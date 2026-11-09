import { ShopError, desiredHash, dodoProductBody, sha256 } from './shop-automation.mjs';

export function createDodoClient({key, mode, fetchImpl = fetch}) {
  const base = mode === 'test' ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com';
  return {
    async request(path, {method = 'GET', body} = {}) {
      let response;
      try {
        response = await fetchImpl(base + path, {
          method, headers: {Authorization: `Bearer ${key}`, ...(body instanceof FormData ? {} : {'Content-Type':'application/json'})},
          body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
          signal: AbortSignal.timeout(method === 'POST' && body instanceof FormData ? 70000 : 25000),
          redirect: 'error',
        });
      } catch { throw new ShopError('Dodo did not confirm the request. Retry sync to reconcile its result before creating anything again.', 502, 'dodo_uncertain'); }
      if (!response.ok) {
        // Never relay provider bodies: they may include request data or signed URLs.
        let message=`Dodo returned HTTP ${response.status}. Check the key, product settings and Dodo service status, then retry sync.`;
        if(response.status===401)message='Dodo rejected the API key. Check that the backend secret belongs to the selected test/live environment.';
        if(response.status===403){
          const body=await response.json().catch(()=>({}));
          const permission=body.code==='INSUFFICIENT_PERMISSION' && typeof body.message==='string' ? body.message.match(/Required:\s*([a-z_]{1,40}:(?:read|write))/)?.[1] : null;
          if(permission)message=`The Dodo API key needs ${permission} permission. Update the key and its Supabase secret, then retry sync.`;
        }
        const error = new ShopError(message, 502, 'dodo_error');
        error.providerStatus = response.status;
        throw error;
      }
      const text = await response.text();
      if (!text) return null;
      try { return JSON.parse(text); } catch { throw new ShopError('Dodo returned an unreadable response. Retry sync to reconcile it.', 502, 'dodo_uncertain'); }
    },
  };
}

async function recoverCreated(dodo, kind, predicate) {
  const found = [];
  for (let page = 0; page < 10; page++) {
    const result = await dodo.request(`/${kind}?page_size=100&page_number=${page}${kind === 'entitlements' ? '&integration_type=digital_files' : ''}`);
    if (!Array.isArray(result?.items)) throw new ShopError('Could not reconcile the Dodo catalogue.', 502, 'reconciliation_required');
    found.push(...result.items.filter(predicate));
    if (result.items.length < 100) {
      if (found.length === 1) return found[0];
      throw new ShopError(found.length ? 'More than one matching Dodo resource exists. Review it in Dodo before continuing.' : 'The previous create request is still unconfirmed. No duplicate was created. Retry later or review the resource in Dodo.', 409, 'reconciliation_required');
    }
  }
  throw new ShopError('Reconciliation reached 1,000 Dodo resources. Review the previous operation in Dodo before continuing.', 409, 'reconciliation_required');
}

export function remoteProductMatches(remote, body, entitlementId) {
  const p = remote?.price;
  return remote?.name === body.name && (remote.description || '') === body.description && remote.tax_category === body.tax_category &&
    p?.type === 'one_time_price' && p.price === body.price.price && p.currency === body.price.currency &&
    !p.pay_what_you_want && !p.purchasing_power_parity && !p.tax_inclusive && !(p.discount_bps ?? p.discount ?? 0) &&
    !remote.is_archived && remote.entitlements?.some(e => e.entitlement_id === entitlementId || e.id === entitlementId);
}

// A request performs one bounded step. The caller resumes until done. State is
// persisted BEFORE non-idempotent POSTs; uncertain POSTs are reconciled, never
// blindly repeated. The enclosing handler holds a per-product database lock.
export async function syncDodoStep({product, file, mode, state: initial, saveState, loadFile, dodo}) {
  const state = {...initial};
  state.sync_id ||= crypto.randomUUID();
  const hash = await desiredHash(product, file);
  const fileVersion = await sha256(new TextEncoder().encode(`${file.sha256}:${file.filename}`));
  const body = dodoProductBody(product);
  const persist = async patch => { Object.assign(state, patch); await saveState(state); };
  const result = phase => ({done: false, phase, state});
  try {
    if (state.file_version !== fileVersion) {
      // Don't lose an unresolved external create when the input changes.
      if (state.pending_entitlement || state.pending_product || state.pending_file) throw new ShopError('Finish reconciling the previous sync before replacing its file.', 409, 'reconciliation_required');
      await persist({file_version:fileVersion, entitlement_id:null, file_id:null, staged_hash:null, applied_hash:null, phase:'entitlement', last_error:null});
    }
    if (!state.entitlement_id) {
      let entitlement;
      if (state.pending_entitlement) {
        entitlement = await recoverCreated(dodo, 'entitlements', e => e.metadata?.shop_sync_id === state.sync_id && e.metadata?.shop_file_version === fileVersion);
      } else {
        await persist({pending_entitlement:true, phase:'entitlement', last_error:null});
        try {
          entitlement = await dodo.request('/entitlements', {method:'POST', body:{
            name: `${product.details.title} - files`, integration_type:'digital_files',
            integration_config:{digital_file_ids:[], instructions:'Open the included file in a compatible reader. For order help, contact contact@agrimsigdel.com.np.'},
            metadata:{shop_sync_id:state.sync_id, shop_file_version:fileVersion, shop_slug:product.slug},
          }});
        } catch (e) {
          if (e.providerStatus >= 400 && e.providerStatus < 500 && e.providerStatus !== 408) await persist({pending_entitlement:false});
          throw e;
        }
      }
      if (!entitlement?.id) throw new ShopError('Dodo did not return an entitlement ID. Retry to reconcile.', 502, 'dodo_uncertain');
      await persist({entitlement_id:entitlement.id, pending_entitlement:false, phase:'file', last_error:null});
      return result('file');
    }
    if (!state.file_id) {
      let fileId;
      if (state.pending_file) {
        const remote = await dodo.request(`/entitlements/${encodeURIComponent(state.entitlement_id)}`);
        const matches = remote.integration_config?.digital_files?.files?.filter(f => f.filename === file.filename && (f.file_size == null || f.file_size === file.size_bytes)) || [];
        if (matches.length !== 1) throw new ShopError('The previous file upload is unconfirmed. No duplicate was uploaded. Retry later or review the entitlement in Dodo.', 409, 'reconciliation_required');
        fileId = matches[0].file_id;
      } else {
        const blob = await loadFile();
        if (blob.size !== file.size_bytes || await sha256(await blob.arrayBuffer()) !== file.sha256) throw new ShopError('The stored file does not match its fingerprint. Upload it again.', 409);
        const form = new FormData(); form.append('filename',file.filename); form.append('file',blob,file.filename);
        await persist({pending_file:true, phase:'file', last_error:null});
        try {
          const uploaded = await dodo.request(`/entitlements/${encodeURIComponent(state.entitlement_id)}/files`, {method:'POST',body:form});
          fileId = uploaded?.file_id;
        } catch (e) {
          if (e.providerStatus >= 400 && e.providerStatus < 500 && e.providerStatus !== 408) await persist({pending_file:false});
          throw e;
        }
      }
      if (!fileId) throw new ShopError('Dodo did not confirm the file ID. Retry to reconcile.', 502, 'dodo_uncertain');
      await persist({file_id:fileId, pending_file:false, phase:'product', last_error:null});
      return result('product');
    }
    if (state.staged_hash !== hash && state.applied_hash !== hash) {
      const payload = {...body, entitlements:[{entitlement_id:state.entitlement_id}], metadata:{shop_sync_id:state.sync_id, shop_slug:product.slug}};
      if (!state.product_id) {
        let remote;
        if (state.pending_product) remote = await recoverCreated(dodo, 'products', p => p.metadata?.shop_sync_id === state.sync_id);
        else {
          await persist({pending_product:true, phase:'product', last_error:null});
          try { remote = await dodo.request('/products',{method:'POST',body:payload}); }
          catch (e) {
            if (e.providerStatus >= 400 && e.providerStatus < 500 && e.providerStatus !== 408) await persist({pending_product:false});
            throw e;
          }
        }
        if (!remote?.product_id) throw new ShopError('Dodo did not return a product ID. Retry to reconcile.', 502, 'dodo_uncertain');
        await persist({product_id:remote.product_id, pending_product:false});
        // A recovered product may have been created from an earlier input.
        if (!remoteProductMatches(remote, body, state.entitlement_id)) await dodo.request(`/products/${encodeURIComponent(state.product_id)}`,{method:'PATCH',body:payload});
      } else {
        const remote = await dodo.request(`/products/${encodeURIComponent(state.product_id)}`);
        if (remote.metadata?.shop_sync_id !== state.sync_id) throw new ShopError('This Dodo product is not owned by this sync record.',409,'ownership_mismatch');
        // Preserve benefits added separately in Dodo; replace only our prior file entitlement.
        const extras = (remote.entitlements || []).map(e=>e.entitlement_id || e.id).filter(id=>id && id !== state.attached_entitlement_id && id !== state.entitlement_id);
        payload.entitlements.push(...extras.map(entitlement_id=>({entitlement_id})));
        payload.metadata = {...remote.metadata,...payload.metadata};
        await dodo.request(`/products/${encodeURIComponent(state.product_id)}`,{method:'PATCH',body:payload});
      }
      await persist({staged_hash:hash, applied_hash:null, phase:'verify', last_error:null});
      return result('verify');
    }
    const remote = await dodo.request(`/products/${encodeURIComponent(state.product_id)}`);
    const entitlement = await dodo.request(`/entitlements/${encodeURIComponent(state.entitlement_id)}`);
    const files = entitlement.integration_config?.digital_files?.files || [];
    if (!files.some(f=>f.file_id === state.file_id)) {
      await persist({file_id:null, staged_hash:null, applied_hash:null, phase:'file'});
      throw new ShopError('The Dodo file is missing. Checkout remains disabled; run sync again to restore it.',409,'verification_failed');
    }
    if (!remoteProductMatches(remote, body, state.entitlement_id)) {
      await persist({staged_hash:null, applied_hash:null, phase:'product'});
      throw new ShopError('Dodo’s price or delivery differs from the saved product. Checkout remains disabled; run sync again to repair it.',409,'verification_failed');
    }
    await persist({applied_hash:hash, staged_hash:hash, attached_entitlement_id:state.entitlement_id, phase:'ready', last_error:null, synced_at:new Date().toISOString()});
    return {done:true, phase:'ready', state, checkout_url:`https://${mode === 'test' ? 'test.' : ''}checkout.dodopayments.com/buy/${state.product_id}`};
  } catch (e) {
    await persist({last_error:e instanceof ShopError ? e.message : 'Sync interrupted. Retry to resume.'});
    throw e;
  }
}
