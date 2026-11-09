import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {normalizeProduct,priceInMinorUnits,fileInfo,MAX_FILE_BYTES,sha256,ShopError} from '../supabase/functions/_shared/shop-automation.mjs';
import {syncDodoStep,createDodoClient} from '../supabase/functions/_shared/dodo-sync.mjs';
import {authorizeShopRequest,createShopAdminHandler} from '../supabase/functions/_shared/shop-admin-handler.mjs';
import {prepareManifest,runImport,parseArgs,createImporterAPI} from '../scripts/shop-import.mjs';

const product=normalizeProduct({slug:'test-guide',published:false,details:{title:'Test guide',summary:'A useful test.',description:'A guide with a real file.',price:'5.10',currency:'USD',format:'Guide',checkout_mode:'disabled',includes:['Guide'],api_managed:true,tax_category:'e_book'}});

async function harness(){
  let state={};const ents=new Map(),products=new Map(),calls=[];let failAfter='',failBefore='';
  const blob=new Blob(['A private guide.'],{type:'text/plain'});
  const file={filename:'guide.txt',size_bytes:blob.size,sha256:await sha256(await blob.arrayBuffer())};
  const dodo={request:async(path,options={})=>{
    const {method='GET',body}=options;calls.push([method,path]);
    if(failBefore===`${method} ${path}`){failBefore='';const e=new ShopError('Rejected',502);e.providerStatus=422;throw e;}
    let answer;
    if(method==='GET'&&path.startsWith('/entitlements?'))answer={items:[...ents.values()]};
    else if(method==='GET'&&path.startsWith('/products?'))answer={items:[...products.values()]};
    else if(method==='POST'&&path==='/entitlements'){answer={...body,id:`ent_${ents.size+1}`,integration_config:{digital_files:{files:[]}}};ents.set(answer.id,answer);}
    else if(method==='POST'&&path.endsWith('/files')){const id=path.split('/')[2],upload=body.get('file');answer={file_id:`file_${ents.get(id).integration_config.digital_files.files.length+1}`};ents.get(id).integration_config.digital_files.files.push({...answer,filename:body.get('filename'),file_size:upload.size});}
    else if(method==='POST'&&path==='/products'){answer={...body,product_id:`pdt_${products.size+1}`,entitlements:body.entitlements.map(e=>({id:e.entitlement_id}))};products.set(answer.product_id,answer);}
    else if(method==='PATCH'&&path.startsWith('/products/')){const id=path.split('/')[2];products.set(id,{...products.get(id),...body,entitlements:body.entitlements.map(e=>({id:e.entitlement_id}))});answer=null;}
    else if(method==='GET'&&path.startsWith('/entitlements/'))answer=ents.get(path.split('/')[2]);
    else if(method==='GET'&&path.startsWith('/products/'))answer=products.get(path.split('/')[2]);
    else throw new Error(`Unexpected request ${method} ${path}`);
    if(failAfter===`${method} ${path}`){failAfter='';throw new ShopError('Response lost',502,'dodo_uncertain');}
    return structuredClone(answer);
  }};
  const step=overrides=>syncDodoStep({product:structuredClone(product),file,mode:'test',state:structuredClone(state),saveState:async s=>{state=structuredClone(s);},loadFile:async()=>blob,dodo,...overrides});
  const finish=async(overrides)=>{for(let i=0;i<8;i++){const r=await step(overrides);if(r.done)return r;}throw new Error('Did not finish');};
  return {step,finish,ents,products,calls,file,blob,state:()=>state,failAfter:v=>{failAfter=v;},failBefore:v=>{failBefore=v;}};
}

test('money uses integer minor units and rejects invalid or excessive values',()=>{
  assert.equal(priceInMinorUnits('10.29'),1029);assert.equal(priceInMinorUnits('0.01'),1);
  for(const v of ['0','-1','1.001','Infinity','99999999999'])assert.throws(()=>priceInMinorUnits(v));
});
test('file checks reject secrets, path traversal, unsupported and oversized files',()=>{
  assert.equal(fileInfo('guide.pdf',100).content_type,'application/pdf');
  for(const n of ['../.env.local','.env.local','guide.exe','folder/file.pdf'])assert.throws(()=>fileInfo(n,100));
  assert.throws(()=>fileInfo('guide.pdf',MAX_FILE_BYTES+1));assert.throws(()=>fileInfo('guide.pdf',0));
});
test('normalization strips unknown fields and rejects malformed catalogue input',()=>{
  const p=normalizeProduct({...product,details:{...product.details,api_key:'must not persist',secret:'no'}});
  assert.equal(p.details.api_key,undefined);assert.equal(p.details.secret,undefined);
  assert.throws(()=>normalizeProduct({...product,details:{...product.details,includes:'wrong'}}));
});
test('sync creates delivery before product and verifies it; reruns do not duplicate',async()=>{
  const h=await harness();const r=await h.finish();assert.equal(r.done,true);assert.match(r.checkout_url,/test.checkout/);
  assert.deepEqual(h.calls.filter(([m])=>m==='POST').map(([,p])=>p),['/entitlements','/entitlements/ent_1/files','/products']);
  await h.finish();assert.equal(h.ents.size,1);assert.equal(h.products.size,1);assert.equal(h.calls.filter(([m,p])=>m==='POST'&&p.endsWith('/files')).length,1);
});
test('lost create responses reconcile remote IDs without a duplicate POST',async()=>{
  for(const path of ['/entitlements','/products']){
    const h=await harness();h.failAfter(`POST ${path}`);
    await assert.rejects(h.finish(),/Response lost/);await h.finish();
    assert.equal(h.ents.size,1);assert.equal(h.products.size,1);assert.equal(h.calls.filter(([m,p])=>m==='POST'&&p===path).length,1);
  }
});
test('lost file response is recovered from the entitlement rather than uploaded twice',async()=>{
  const h=await harness();h.failAfter('POST /entitlements/ent_1/files');
  await assert.rejects(h.finish(),/Response lost/);await h.finish();
  assert.equal(h.ents.get('ent_1').integration_config.digital_files.files.length,1);
});
test('unresolved creates stop instead of guessing that it is safe to create again',async()=>{
  const h=await harness();h.failAfter('POST /entitlements');await assert.rejects(h.step());h.ents.clear();
  await assert.rejects(h.step(),/unconfirmed/);assert.equal(h.calls.filter(([m,p])=>m==='POST'&&p==='/entitlements').length,1);
});
test('definitive rejected creates can be corrected and retried',async()=>{
  const h=await harness();h.failBefore('POST /entitlements');await assert.rejects(h.step(),/Rejected/);
  assert.equal(h.state().pending_entitlement,false);await h.finish();assert.equal(h.ents.size,1);
});
test('file replacement versions delivery while keeping the same product and extra benefits',async()=>{
  const h=await harness();await h.finish();h.products.get('pdt_1').entitlements.push({id:'ent_extra'});
  const blob=new Blob(['Revised private guide']);const file={...h.file,size_bytes:blob.size,sha256:await sha256(await blob.arrayBuffer())};
  await h.finish({file,loadFile:async()=>blob});
  assert.equal(h.products.size,1);assert.equal(h.ents.size,2);assert.deepEqual(h.products.get('pdt_1').entitlements.map(e=>e.id).sort(),['ent_2','ent_extra']);
});
test('drift is detected and repaired; missing uploaded files are restored',async()=>{
  const h=await harness();await h.finish();h.products.get('pdt_1').price.price=123;
  await assert.rejects(h.step(),/differs/);await h.finish();assert.equal(h.products.get('pdt_1').price.price,510);
  h.ents.get('ent_1').integration_config.digital_files.files=[];
  await assert.rejects(h.step(),/file is missing/);await h.finish();assert.equal(h.ents.get('ent_1').integration_config.digital_files.files.length,1);
});
test('wrong stored bytes cannot be delivered to Dodo',async()=>{
  const h=await harness();await h.step();await assert.rejects(h.step({loadFile:async()=>new Blob(['wrong'])}),/fingerprint/);
  assert.equal(h.calls.filter(([m,p])=>m==='POST'&&p.endsWith('/files')).length,0);
});
test('Dodo client keeps secrets server-side, rejects redirects and sanitizes provider failures',async()=>{
  let request;const client=createDodoClient({key:'private-key',mode:'test',fetchImpl:async(url,options)=>{request={url,options};return new Response('private-key echoed',{status:401});}});
  await assert.rejects(client.request('/products'),e=>e.message.includes('rejected')&&!e.message.includes('private-key'));
  assert.equal(request.url,'https://test.dodopayments.com/products');assert.equal(request.options.redirect,'error');
});
test('missing Dodo permissions surface an actionable scope without exposing the raw response',async()=>{
  const client=createDodoClient({key:'secret',mode:'test',fetchImpl:async()=>new Response(JSON.stringify({code:'INSUFFICIENT_PERMISSION',message:'Required: entitlements:write. Scopes: secret'}),{status:403})});
  await assert.rejects(client.request('/entitlements'),e=>e.message.includes('entitlements:write')&&!e.message.includes('Scopes'));
});
test('authorization rejects anonymous and ordinary signed-in users, accepts only shop admins or server credential',async()=>{
  const request=token=>new Request('https://example.test',{headers:{Authorization:`Bearer ${token}`}});
  const db={auth:{getUser:async token=>token==='anon'?{error:{}}:{data:{user:{id:'u',role:'authenticated'}}}},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})})};
  await assert.rejects(authorizeShopRequest(request('anon'),{db,serviceKey:'secret'}),e=>e.status===401);
  await assert.rejects(authorizeShopRequest(request('user'),{db,serviceKey:'secret'}),e=>e.status===403);
  assert.equal((await authorizeShopRequest(request('secret'),{db,serviceKey:'secret'})).service,true);
});
test('handler does not accept untrusted origins, unsigned calls or oversized bodies',async()=>{
  const db={auth:{getUser:async()=>({error:{}})}};
  const handle=createShopAdminHandler({db,env:{SUPABASE_SERVICE_ROLE_KEY:'secret'}});
  const foreign=await handle(new Request('https://example.test',{method:'POST',headers:{origin:'https://evil.test'},body:'{}'}));assert.equal(foreign.status,403);
  assert.equal((await handle(new Request('https://example.test',{method:'POST',body:'{}'}))).status,401);
  const huge=await handle(new Request('https://example.test',{method:'POST',headers:{Authorization:'Bearer secret'},body:'a'.repeat(131073)}));assert.equal(huge.status,413);
});
test('batch dry-run validates all files, catches duplicate slugs and makes no network calls',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'shop-test-'));
  try{
    await writeFile(join(dir,'guide.txt'),'private guide');const raw={slug:'test-guide',...product.details,file:'guide.txt'};const path=join(dir,'batch.json');
    await writeFile(path,JSON.stringify({version:1,products:[raw]}));const batch=await prepareManifest(path);
    const report=await runImport(batch,{apply:false},{log:()=>{},api:()=>{throw new Error('No network allowed');}});assert.equal(report.results[0].status,'valid');
    await writeFile(path,JSON.stringify({version:1,products:[raw,raw]}));await assert.rejects(prepareManifest(path),/Duplicate slug/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('batch requires explicit live writes and disallows unsafe credential destinations',async()=>{
  await assert.rejects(runImport({mode:'live',items:[]},{apply:true}),/allow-live/);
  assert.throws(()=>createImporterAPI({SUPABASE_URL:'https://evil.test',SUPABASE_SERVICE_KEY:'secret'}),/supabase.co/);
  assert.equal(parseArgs(['batch.json']).apply,false);assert.throws(()=>parseArgs(['batch.json','--unknown']));
});
