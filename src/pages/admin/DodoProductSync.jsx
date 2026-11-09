import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { shopAdminRequest } from '../../features/shop/shopStore';

const phases={entitlement:'Preparing file delivery',file:'Uploading the paid file to Dodo',product:'Creating or updating the Dodo product',verify:'Checking the price and delivery',ready:'Ready',needs_sync:'Changes need syncing'};

export default function DodoProductSync({product,disabled,onUpdated}){
  const [status,setStatus]=useState(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState('');
  const [file,setFile]=useState(null);
  const [mode,setMode]=useState(product.details.checkout_mode==='live'?'live':'test');
  const [confirmLive,setConfirmLive]=useState(false);
  useEffect(()=>{let active=true;shopAdminRequest({action:'status',slug:product.slug}).then(s=>{if(active)setStatus(s);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[product.slug]);
  const selected=status?.sync?.find(s=>s.mode===mode)?.state;
  const live=mode==='live'||product.details.checkout_mode==='live';
  const refresh=async()=>{const s=await shopAdminRequest({action:'status',slug:product.slug});setStatus(s);return s;};
  const upload=async()=>{
    if(!file)return;
    setBusy(true);setError('');setProgress('Saving the paid file privately…');
    try{
      const form=new FormData();form.append('slug',product.slug);form.append('file',file);
      await shopAdminRequest(form);const s=await refresh();toast.success('Paid file saved privately');onUpdated(s.product);
    }catch(e){setError(e.message);}finally{setBusy(false);setProgress('');}
  };
  const sync=async()=>{
    setBusy(true);setError('');setProgress('Starting Dodo sync…');
    try{
      for(let step=0;step<8;step++){
        const result=await shopAdminRequest({action:'sync',slug:product.slug,mode,publish:product.published,confirm_live:confirmLive});
        if(result.done){toast.success(`${mode==='test'?'Test':'Live'} checkout connected`);onUpdated(result.product);return;}
        setProgress(phases[result.phase] || 'Syncing with Dodo…');
      }
      throw new Error('Progress was saved. Run sync again to finish.');
    }catch(e){setError(e.message);toast.error(e.message);await refresh().catch(()=>{});}
    finally{setBusy(false);setProgress('');}
  };
  return <section className="admin-card shop-dodo-sync" aria-label="Dodo automation"><h2>Dodo product automation</h2>
    <p className="admin-hint">Upload once, then sync the price and file delivery. The website only enables checkout after Dodo confirms both. Email delivery is handled by Dodo after payment.</p>
    {disabled && <p className="admin-hint">Save your changes above before uploading or syncing.</p>}
    {error && <p className="admin-error" role="alert">{error}</p>}
    {!status && !error && <p role="status">Loading connection status…</p>}
    {status && <>
      <p className="admin-hint">Test key: <strong>{status.configured.test?'Configured':'Not configured'}</strong> · Live key: <strong>{status.configured.live?'Configured':'Not configured'}</strong></p>
      <fieldset disabled={disabled||busy}>
        <label className="admin-field"><span>Paid product file</span><input type="file" accept=".pdf,.zip,.epub,.xlsx,.docx,.pptx,.csv,.txt,.md" onChange={e=>setFile(e.target.files?.[0]||null)}/><small>Private storage · Maximum 20 MB · Use a ZIP for a bundle. Covers and samples still go in public Media.</small></label>
        {status.file && <p className="admin-hint">Saved: <strong>{status.file.filename}</strong> · {(status.file.size_bytes/1024).toFixed(1)} KB</p>}
        <button type="button" className="admin-btn" disabled={!file} onClick={upload}>Upload paid file</button>
        <label className="admin-field"><span>Dodo environment</span><select value={mode} onChange={e=>{setMode(e.target.value);setConfirmLive(false);}}><option value="test">test</option><option value="live">live</option></select></label>
        {!status.configured[mode] && <p className="admin-hint">Add DODO_PAYMENTS_{mode.toUpperCase()}_API_KEY in Supabase → Edge Functions → Secrets. Then reload this editor. Never paste the key into a product field.</p>}
        {live && <label className="shop-live-confirm"><input type="checkbox" checked={confirmLive} onChange={e=>setConfirmLive(e.target.checked)}/> I intend to change live checkout. Live mode accepts real payments.</label>}
        {selected && <p className="admin-hint">Sync status: <strong>{phases[selected.phase]||selected.phase}</strong>{selected.product_id?` · ${selected.product_id}`:''}</p>}
        {selected?.last_error && <p className="admin-error">{selected.last_error}</p>}
        <p className="admin-hint">After a successful sync, this listing will be {product.published?'visible in your shop':'kept as a draft'}. Test payments do not charge real money. Changing a file updates future deliveries; previous customers keep their purchased version.</p>
        <div className="admin-actions"><button type="button" className="admin-btn admin-btn-primary" disabled={!status.file||!status.configured[mode]||(live&&!confirmLive)} onClick={sync}>Sync with Dodo & connect checkout</button><button type="button" className="admin-btn" onClick={async()=>{try{const s=await refresh();onUpdated(s.product);}catch(e){setError(e.message);}}}>Reload product & status</button></div>
      </fieldset>
    </>}
    {busy && <p role="status" aria-live="polite">{progress}</p>}
  </section>;
}
