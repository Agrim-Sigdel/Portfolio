#!/usr/bin/env node
import { readFile, stat, writeFile } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { blankProduct } from '../supabase/functions/_shared/shop-contract.mjs';
import { normalizeProduct, fileInfo, dodoProductBody, requireMode } from '../supabase/functions/_shared/shop-automation.mjs';

const help=`Usage: node --env-file=.env.local scripts/shop-import.mjs FILE.json [options]

Default: validate the entire batch and its local files; make no network calls.
  --apply               Save, privately upload, sync with Dodo and publish as specified
  --save-only           With --apply, save and upload but leave checkout disabled
  --allow-live          Explicitly allow live-mode operations (test is the default)
  --continue-on-error   Process later products after a failed item
  --report PATH         Write a JSON result report (default: beside the manifest)
  --help                Show this help

Credentials: SUPABASE_URL (or VITE_SUPABASE_URL) and SHOP_ADMIN_ACCESS_TOKEN
or SUPABASE_SERVICE_KEY / SUPABASE_SERVICE_ROLE_KEY, all kept in .env.local.
Dodo keys stay in Supabase Edge Function secrets; the importer never sends
them to the website or puts them in product JSON.
See docs/SHOP-AUTOMATION.md and examples/shop-products.example.json.
`;

export function parseArgs(args){
  const opts={apply:false,saveOnly:false,allowLive:false,continueOnError:false};
  for(let i=0;i<args.length;i++){
    const arg=args[i];
    if(arg==='--apply')opts.apply=true;
    else if(arg==='--dry-run')opts.apply=false;
    else if(arg==='--save-only')opts.saveOnly=true;
    else if(arg==='--allow-live')opts.allowLive=true;
    else if(arg==='--continue-on-error')opts.continueOnError=true;
    else if(arg==='--help'||arg==='-h')opts.help=true;
    else if(arg==='--report'){if(!args[i+1]||args[i+1].startsWith('--'))throw new Error('--report needs a path.');opts.report=args[++i];}
    else if(arg.startsWith('-'))throw new Error(`Unknown option: ${arg}`);
    else if(opts.file)throw new Error('Supply one manifest path.');
    else opts.file=arg;
  }
  if(!opts.help&&!opts.file)throw new Error('Supply a JSON manifest. Use --help for examples.');
  return opts;
}

export async function prepareManifest(manifestPath){
  const path=resolve(manifestPath);const content=await readFile(path,'utf8');
  if(Buffer.byteLength(content)>1024*1024)throw new Error('Manifest exceeds 1 MB. Split the batch.');
  const manifest=JSON.parse(content);const mode=requireMode(manifest.mode ?? 'test');
  if(manifest.version!==1||!Array.isArray(manifest.products)||!manifest.products.length||manifest.products.length>100)throw new Error('Use version: 1 and between 1 and 100 products.');
  const slugs=new Set();const items=[];
  for(const raw of manifest.products){
    if(!raw || typeof raw!=='object')throw new Error('Each product must be an object.');
    if(slugs.has(raw.slug))throw new Error(`Duplicate slug in manifest: ${raw.slug}`);slugs.add(raw.slug);
    if(typeof raw.file!=='string'||!raw.file.trim())throw new Error(`${raw.slug}: supply a local paid file path.`);
    const defaults=blankProduct();
    const {slug,published=false,sort_order=10,file,...details}=raw;
    const product=normalizeProduct({slug,published,sort_order,details:{...defaults.details,...details,api_managed:true,checkout_mode:'disabled',checkout_url:'',download_url:'',delivery_ready:false}});
    // Drafts should still be complete enough to sync without rewriting the manifest.
    normalizeProduct({...product,published:true});dodoProductBody(product);
    const filePath=resolve(dirname(path),file);const metadata=await stat(filePath);
    if(!metadata.isFile())throw new Error(`${slug}: paid file must be a regular file.`);
    const info=fileInfo(basename(filePath),metadata.size);
    const bytes=await readFile(filePath);fileInfo(info.filename,bytes.length);
    items.push({product,filePath,file:{...info,sha256:createHash('sha256').update(bytes).digest('hex')}});
  }
  return {mode,items,path};
}

export function createImporterAPI(env=process.env,fetchImpl=fetch){
  const raw=env.SUPABASE_URL||env.VITE_SUPABASE_URL;
  if(!raw)throw new Error('Missing SUPABASE_URL or VITE_SUPABASE_URL.');
  const url=new URL(raw);
  if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||url.username||url.password)throw new Error('Use your project’s HTTPS supabase.co URL.');
  const token=env.SHOP_ADMIN_ACCESS_TOKEN||env.SUPABASE_SERVICE_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
  if(!token)throw new Error('Set SHOP_ADMIN_ACCESS_TOKEN or the existing SUPABASE_SERVICE_KEY in .env.local.');
  return async body=>{
    const form=body instanceof FormData;
    const response=await fetchImpl(new URL('/functions/v1/shop-product-admin',url),{
      method:'POST',headers:{Authorization:`Bearer ${token}`,...(form?{}:{'Content-Type':'application/json'})},
      body:form?body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(100000),
    });
    let result;try{result=await response.json();}catch{throw new Error(`Shop backend returned HTTP ${response.status} without a readable result.`);}
    if(!response.ok||result.error)throw new Error(result.error||`Shop backend returned HTTP ${response.status}.`);
    return result;
  };
}

export async function runImport(batch,opts,{api,log=console.log}={}){
  if(batch.mode==='live'&&opts.apply&&!opts.allowLive)throw new Error('Live mode requires --allow-live. No products were changed.');
  const report={version:1,mode:batch.mode,dry_run:!opts.apply,started_at:new Date().toISOString(),results:[]};
  for(const item of batch.items){
    const slug=item.product.slug;
    if(!opts.apply){log(`[dry run] ${slug}: ${item.product.details.currency} ${item.product.details.price}, ${item.file.filename}, ${item.product.published?'publish':'draft'}`);report.results.push({slug,status:'valid'});continue;}
    try{
      log(`[${slug}] Checking current state`);
      const current=await api({action:'status',slug});
      if(!opts.saveOnly&&!current.configured[batch.mode])throw new Error(`Dodo ${batch.mode} key is not configured. Add its backend secret, or use --save-only.`);
      if(current.product?.details.checkout_mode==='live'&&!opts.allowLive)throw new Error('This existing product has live checkout. Use --allow-live to change it.');
      if(current.product && !current.product.details.api_managed && ['test','live'].includes(current.product.details.checkout_mode))throw new Error('This product has a manual Dodo link. Disable and save it before using API automation.');
      // Preserve a working managed checkout on identical re-runs. The server
      // disables it automatically if any billed content or file has changed.
      const product={...item.product,details:{...item.product.details}};
      if(current.product?.details.api_managed && !opts.saveOnly)product.details.checkout_mode=current.product.details.checkout_mode;
      await api({action:'save',product,expected_updated_at:current.product?.updated_at||null});
      if(current.file?.sha256!==item.file.sha256||current.file?.filename!==item.file.filename){
        const bytes=await readFile(item.filePath);
        if(createHash('sha256').update(bytes).digest('hex')!==item.file.sha256)throw new Error('The local file changed after validation. Re-run the batch.');
        const form=new FormData();form.append('slug',slug);form.append('file',new Blob([bytes],{type:item.file.content_type}),item.file.filename);
        log(`[${slug}] Uploading paid file privately`);await api(form);
      }
      if(opts.saveOnly){report.results.push({slug,status:'saved',published:item.product.published});continue;}
      let result;
      for(let attempt=0;attempt<8;attempt++){
        result=await api({action:'sync',slug,mode:batch.mode,publish:item.product.published,confirm_live:opts.allowLive});
        log(`[${slug}] ${result.phase}`);if(result.done)break;
      }
      if(!result?.done)throw new Error('Sync progress was saved. Re-run this batch to finish.');
      report.results.push({slug,status:'ready',published:result.product.published,dodo_product_id:result.sync.product_id,product_url:`https://agrimsigdel.com.np/shop/${slug}`});
    }catch(error){report.results.push({slug,status:'failed',error:error.message});log(`[${slug}] FAILED: ${error.message}`);if(!opts.continueOnError)break;}
  }
  report.finished_at=new Date().toISOString();return report;
}

async function main(){
  const opts=parseArgs(process.argv.slice(2));if(opts.help){console.log(help);return;}
  const batch=await prepareManifest(opts.file);
  const reportPath=resolve(opts.report||`${batch.path}.report.json`);
  if(reportPath===batch.path||batch.items.some(i=>i.filePath===reportPath))throw new Error('Report must not overwrite the manifest or a paid file.');
  const report=await runImport(batch,opts,{api:opts.apply?createImporterAPI():undefined});
  await writeFile(reportPath,JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log(`Report: ${reportPath}`);
  if(report.results.some(r=>r.status==='failed'))process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
