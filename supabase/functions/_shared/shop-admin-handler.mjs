import { validateProduct } from './shop-contract.mjs';
import { MAX_FILE_BYTES, ShopError, requireSlug, requireMode, normalizeProduct, fileInfo, sha256, desiredHash, publicFileInfo } from './shop-automation.mjs';
import { createDodoClient, syncDodoStep } from './dodo-sync.mjs';

const ORIGINS = ['https://agrimsigdel.com.np','https://www.agrimsigdel.com.np','http://localhost:5173','http://127.0.0.1:5173','http://localhost:4173','http://127.0.0.1:4173'];
const disableCheckout = details => ({...details, checkout_mode:'disabled', checkout_url:'', delivery_ready:false, download_url:''});
const now = () => new Date().toISOString();
const unwrap = result => { if (result.error) throw new ShopError('Shop storage could not be updated. Retry or check the backend migration.',503,'storage_error'); return result.data; };

function equalSecret(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let difference = 0; for (let i=0;i<a.length;i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
export async function authorizeShopRequest(req, {db, serviceKey}) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i,'');
  if (!token) throw new ShopError('Sign in to the shop admin.',401,'unauthorized');
  // The local batch tool may use the existing server credential. It is never
  // installed in Vite or returned from this function.
  if (equalSecret(token, serviceKey)) return {service:true};
  const {data, error} = await db.auth.getUser(token);
  if (error || !data?.user?.id || data.user.role !== 'authenticated') throw new ShopError('Sign in to the shop admin.',401,'unauthorized');
  const membership = await db.from('shop_admins').select('user_id').eq('user_id',data.user.id).maybeSingle();
  if (membership.error || !membership.data) throw new ShopError('Shop administrator access is required.',403,'forbidden');
  return {userId:data.user.id};
}

async function limitedBody(req, maximum) {
  if (Number(req.headers.get('content-length')) > maximum) throw new ShopError('Request exceeds the upload limit.',413,'too_large');
  if (!req.body) throw new ShopError('Request body is required.');
  const reader = req.body.getReader(); const chunks = []; let size=0;
  try {
    while (true) { const {done,value}=await reader.read(); if(done)break; size+=value.length;
      if(size>maximum){await reader.cancel();throw new ShopError('Request exceeds the upload limit.',413,'too_large');}chunks.push(value); }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return bytes;
}

export function createShopAdminHandler({db, env, fetchImpl=fetch}) {
  const getProduct = async slug => unwrap(await db.from('shop_products').select('*').eq('slug',slug).maybeSingle());
  const getFile = async slug => unwrap(await db.from('shop_product_files').select('*').eq('product_slug',slug).maybeSingle());
  const getStates = async slug => unwrap(await db.from('shop_dodo_sync').select('mode,state,updated_at').eq('product_slug',slug));
  const saveState = async (slug,mode,state) => unwrap(await db.from('shop_dodo_sync').upsert({product_slug:slug,mode,state,updated_at:now()},{onConflict:'product_slug,mode'}));
  const saveRow = async product => unwrap(await db.from('shop_products').upsert({...product,updated_at:now()},{onConflict:'slug'}).select('*').single());
  return async req => {
    const origin = req.headers.get('origin');
    const headers = {'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',
      'Access-Control-Allow-Origin':ORIGINS.includes(origin) ? origin : ORIGINS[0],
      'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
    const json = (body,status=200) => new Response(JSON.stringify(body),{status,headers});
    if (origin && !ORIGINS.includes(origin)) return json({error:'Origin is not allowed.'},403);
    if(req.method==='OPTIONS')return new Response('ok',{headers});
    if(req.method!=='POST')return json({error:'Method not allowed.'},405);
    let lock;
    try {
      await authorizeShopRequest(req,{db,serviceKey:env.SUPABASE_SERVICE_ROLE_KEY});
      const multipart = (req.headers.get('content-type') || '').startsWith('multipart/form-data');
      const bytes = await limitedBody(req,multipart ? MAX_FILE_BYTES+65536 : 131072);
      let payload, uploadedFile;
      try {
        if(multipart){const form=await new Response(bytes,{headers:{'Content-Type':req.headers.get('content-type')}}).formData();payload={action:'upload',slug:form.get('slug')};uploadedFile=form.get('file');}
        else payload=JSON.parse(new TextDecoder().decode(bytes));
      } catch { throw new ShopError('The request could not be read.'); }
      if(!payload || typeof payload!=='object' || Array.isArray(payload))throw new ShopError('Provide a request object.');
      const configured = {test:!!env.DODO_PAYMENTS_TEST_API_KEY,live:!!env.DODO_PAYMENTS_LIVE_API_KEY};
      if(payload.action==='status'){
        if(!payload.slug)return json({configured,max_file_bytes:MAX_FILE_BYTES,version:1});
        const slug=requireSlug(payload.slug); const [product,file,states]=await Promise.all([getProduct(slug),getFile(slug),getStates(slug)]);
        const hash=product && file && Number(product.details.price)>0 ? await desiredHash(product,file) : null;
        return json({configured,product,file:publicFileInfo(file),sync:states.map(s=>({...s,state:{...s.state,phase:s.state.phase==='ready' && s.state.applied_hash!==hash ? 'needs_sync' : s.state.phase}})),max_file_bytes:MAX_FILE_BYTES});
      }
      if(!['save','upload','sync'].includes(payload.action))throw new ShopError('Unknown action.');
      const slug=requireSlug(payload.action==='save' ? payload.product?.slug : payload.slug);
      lock={slug,token:crypto.randomUUID()};
      if(!unwrap(await db.rpc('acquire_shop_product_lock',{p_slug:slug,p_token:lock.token})))throw new ShopError('Another operation is running for this product. Retry shortly.',409,'busy');
      const existing=await getProduct(slug);
      if(payload.action==='save'){
        if(existing && payload.expected_updated_at!==existing.updated_at)throw new ShopError('This product changed since it was loaded. Reload before saving.',409,'stale_product');
        if(!existing && payload.expected_updated_at)throw new ShopError('This product no longer exists. Reload before saving.',409,'stale_product');
        let input=payload.product;
        // Managed checkout values are generated by the server, never trusted
        // from a manifest or a manually edited form.
        const states=existing ? await getStates(slug) : [];
        const managed=states.length>0 || input.details?.api_managed===true;
        const requestedMode=input.details?.checkout_mode;
        if(managed){
          if(existing && !existing.details.api_managed && ['test','live'].includes(existing.details.checkout_mode))throw new ShopError('This listing has a manually connected Dodo product. Disable and save its manual checkout first before creating a new API-managed product.',409,'manual_connection');
          input={...input,details:{...disableCheckout(input.details || {}),api_managed:true}};
        }
        const product=normalizeProduct(input);
        if(managed && ['test','live'].includes(requestedMode)){
          const file=await getFile(slug); const state=states.find(s=>s.mode===requestedMode)?.state;
          if(file && state?.phase==='ready' && state.applied_hash===await desiredHash(product,file))product.details={...product.details,checkout_mode:requestedMode,checkout_url:`https://${requestedMode==='test'?'test.':''}checkout.dodopayments.com/buy/${state.product_id}`,delivery_ready:true};
        }
        const saved=await saveRow(product);return json({product:saved});
      }
      if(!existing)throw new ShopError('Save the product before uploading or syncing.',404,'not_found');
      if(payload.action==='upload'){
        if(!(uploadedFile instanceof Blob) || typeof uploadedFile.name!=='string')throw new ShopError('Select a paid product file.');
        const info=fileInfo(uploadedFile.name,uploadedFile.size); const fileBytes=await uploadedFile.arrayBuffer();const hash=await sha256(fileBytes);
        const previous=await getFile(slug);
        if(previous?.sha256===hash && previous.filename===info.filename)return json({file:publicFileInfo(previous),unchanged:true});
        const states=await getStates(slug);
        if(states.some(s=>s.state.pending_file || s.state.pending_product || s.state.pending_entitlement))throw new ShopError('Reconcile the unfinished Dodo sync before replacing this file.',409,'reconciliation_required');
        const storagePath=`${slug}/${hash}/${info.filename.replace(/[^A-Za-z0-9._-]/g,'_')}`;
        unwrap(await db.storage.from('shop-paid-files').upload(storagePath,fileBytes,{contentType:info.content_type,upsert:true}));
        const file={product_slug:slug,storage_path:storagePath,...info,sha256:hash,updated_at:now()};
        unwrap(await db.from('shop_product_files').upsert(file,{onConflict:'product_slug'}));
        if(existing.details.api_managed)await saveRow({...existing,details:disableCheckout(existing.details)});
        return json({file:publicFileInfo(file),unchanged:false});
      }
      const mode=requireMode(payload.mode);
      if((mode==='live' || existing.details.checkout_mode==='live') && payload.confirm_live!==true)throw new ShopError('Explicitly enable live operations before changing a live product.',400,'live_confirmation_required');
      if(!configured[mode])throw new ShopError(`Dodo ${mode} key is not configured. Add DODO_PAYMENTS_${mode.toUpperCase()}_API_KEY to Supabase Edge Function secrets.`,503,'not_configured');
      if(!existing.details.api_managed && ['test','live'].includes(existing.details.checkout_mode))throw new ShopError('Disable and save the manual checkout first. API sync creates its own managed Dodo product.',409,'manual_connection');
      const file=await getFile(slug);if(!file)throw new ShopError('Upload the paid file before syncing.');
      const product={...existing,details:{...disableCheckout(existing.details),api_managed:true}};
      const validation=validateProduct({...product,published:true});if(validation)throw new ShopError(validation);
      const state=(await getStates(slug)).find(s=>s.mode===mode)?.state || {};
      // A partial update must never expose a checkout with the old price/file.
      await saveRow(product);
      const result=await syncDodoStep({product,file,mode,state,saveState:state=>saveState(slug,mode,state),
        loadFile:async()=>unwrap(await db.storage.from('shop-paid-files').download(file.storage_path)),
        dodo:createDodoClient({key:env[`DODO_PAYMENTS_${mode.toUpperCase()}_API_KEY`],mode,fetchImpl})});
      if(result.done){
        product.details={...product.details,checkout_mode:mode,checkout_url:result.checkout_url,delivery_ready:true};
        product.published=payload.publish === true;
        const saved=await saveRow(product);return json({done:true,phase:'ready',product:saved,sync:result.state});
      }
      return json({done:false,phase:result.phase,sync:result.state});
    } catch(error){
      return json({error:error instanceof ShopError ? error.message : 'The operation could not finish. Retry to resume safely.',code:error instanceof ShopError ? error.code : 'internal_error'},error instanceof ShopError ? error.status : 500);
    } finally {
      if(lock)await Promise.resolve(db.rpc('release_shop_product_lock',{p_slug:lock.slug,p_token:lock.token})).catch(()=>{});
    }
  };
}
