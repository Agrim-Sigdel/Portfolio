import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loadProducts, loadShopStats, saveProduct } from '../../features/shop/shopStore';
import { blankProduct, CHECKOUT_MODES, dodoLink, FORMATS, priceLabel, SHOP_EMAIL } from '../../features/shop/shopModel.mjs';
import { TextField, TextAreaField, CheckboxField } from './fields';
import './shopAdmin.css';

function SelectField({ label, value, options, onChange }) {
  return <label className="admin-field"><span>{label}</span><select aria-label={label} value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></label>;
}

function ShopStats() {
  const [state, setState] = useState({ rows: [], loading: true, error: '' });
  const refresh = () => loadShopStats().then(rows => setState({ rows, loading: false, error: '' })).catch(e => setState({ rows: [], loading: false, error: e.message }));
  useEffect(() => { let active = true; loadShopStats().then(rows => { if (active) setState({ rows, loading: false, error: '' }); }).catch(e => { if (active) setState({ rows: [], loading: false, error: e.message }); }); return () => { active = false; }; }, []);
  return <section className="admin-card shop-admin-stats"><h2>Shop analytics · Last 30 days</h2><p className="admin-hint">Event counts, not unique visitors or verified sales. Test checkouts are separate. Use Dodo for paid orders and revenue. Local development and browsers with Do Not Track / Global Privacy Control are excluded.</p><button type="button" className="admin-btn" onClick={refresh}>Refresh counts</button>{state.loading && <p role="status">Loading analytics…</p>}{state.error && <p className="admin-error">{state.error}</p>}{!state.loading && !state.error && !state.rows.length && <p className="admin-hint">No events yet. Share a product link with ?utm_source=instagram&utm_campaign=launch to compare content.</p>}{!!state.rows.length && <div className="shop-admin-table"><table><thead><tr><th>Product</th><th>Event</th><th>Source</th><th>Campaign</th><th>Count</th></tr></thead><tbody>{state.rows.map((r, i) => <tr key={i}><td>{r.product_slug || 'Shop'}</td><td>{r.event_type}</td><td>{r.source || 'Direct / untagged'}</td><td>{r.campaign || '—'}</td><td>{r.total}</td></tr>)}</tbody></table></div>}</section>;
}

function ProductEditor({ initial, onSaved, onCancel }) {
  const [product, setProduct] = useState(initial || blankProduct);
  const [includes, setIncludes] = useState(initial?.details.includes?.join('\n') || '');
  const [previews, setPreviews] = useState(initial?.details.previews?.join('\n') || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const d = product.details;
  const patch = (key, value) => setProduct(p => ({ ...p, details: { ...p.details, [key]: value } }));
  const paid = ['test', 'live'].includes(d.checkout_mode);
  const checkout = dodoLink(d.checkout_url, d.checkout_mode, window.location.origin);
  const submit = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const row = await saveProduct({ ...product, details: { ...d, includes: includes.split('\n').map(x => x.trim()).filter(Boolean), previews: previews.split('\n').map(x => x.trim()).filter(Boolean) } }, initial?.slug);
      toast.success(row.published ? 'Product published' : 'Draft saved'); onSaved(row);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };
  return <form className="admin-card shop-admin-editor" onSubmit={submit}><h2>{initial ? 'Edit resource' : 'New resource'}</h2><fieldset disabled={saving}>
    <TextField label="Title" value={d.title} onChange={v => patch('title', v)} />
    <TextField label="URL slug" value={product.slug} onChange={v => setProduct(p => ({ ...p, slug: v }))} hint="Example: study-planner. Changing a published slug changes its public link." />
    <div className="shop-admin-grid"><SelectField label="Format" value={d.format} options={FORMATS} onChange={v => patch('format', v)} /><TextField label="Display order" value={product.sort_order} onChange={v => setProduct(p => ({ ...p, sort_order: v }))} /></div>
    <TextAreaField label="Short summary" value={d.summary} rows={2} onChange={v => patch('summary', v)} />
    <TextAreaField label="Problem solved and description" value={d.description} onChange={v => patch('description', v)} />
    <TextField label="Who it is for" value={d.audience} onChange={v => patch('audience', v)} />
    <TextAreaField label="Contents · one item per line" value={includes} onChange={setIncludes} />
    <TextField label="File requirements" value={d.file_note} onChange={v => patch('file_note', v)} hint="Example: 12-page PDF · English · printable A4" />
    <TextField label="Cover image URL" value={d.cover_url} onChange={v => patch('cover_url', v)} hint="Upload a public cover using the Media tab, then paste its URL here. A typographic cover is used if blank." />
    <TextAreaField label="Preview image URLs · one per line" value={previews} onChange={setPreviews} />
    <TextField label="Public sample URL" value={d.sample_url} onChange={v => patch('sample_url', v)} hint="Only share samples here. Paid files belong in Dodo’s Digital Files entitlement, not public media." />
    <h3>Checkout & delivery</h3><p className="admin-hint">Brand support email: {SHOP_EMAIL}. Set this address in Dodo’s customer-facing support and receipt settings too.</p><SelectField label="Checkout mode" value={d.checkout_mode} options={CHECKOUT_MODES} onChange={v => patch('checkout_mode', v)} />
    <p className="admin-hint">Disabled shows “Available soon”. Free links directly to a public file. Test and live redirect to Dodo’s hosted checkout. No API key is needed for reusable product links.</p>
    <div className="shop-admin-grid"><TextField label="Display price" value={d.price} onChange={v => patch('price', v)} /><SelectField label="Display currency" value={d.currency} options={['USD', 'EUR', 'GBP', 'INR', 'NPR']} onChange={v => patch('currency', v)} /></div>
    {d.checkout_mode === 'free' && <TextField label="Free download URL" value={d.download_url} onChange={v => patch('download_url', v)} hint="This URL is public. Never put a paid download here." />}
    {paid && <><TextField label={`Dodo ${d.checkout_mode} product link`} value={d.checkout_url} onChange={v => patch('checkout_url', v)} placeholder={`https://${d.checkout_mode === 'test' ? 'test.' : ''}checkout.dodopayments.com/buy/pdt_…`} hint="Use the reusable /buy/ product link from Dodo, not a single-use checkout session. Customer details and query overrides are stripped; return is set to this website." />
      {checkout && <p><a className="admin-btn" href={checkout} target="_blank" rel="noreferrer">Open {d.checkout_mode} checkout ↗</a></p>}
      <CheckboxField label="I matched the Dodo product price/currency and attached the correct Digital Files entitlement." checked={d.delivery_ready} onChange={v => patch('delivery_ready', v)} hint="The display price does not update Dodo. Configure both. Dodo handles confirmation emails and paid downloads after successful payment." />
      {d.checkout_mode === 'live' && <p className="admin-hint">Live mode accepts real payments. Verify the product and merchant account in Dodo before publishing. Use test mode first.</p>}
    </>}
    <CheckboxField label="Published · visible in the shop" checked={product.published} onChange={v => setProduct(p => ({ ...p, published: v }))} hint="Uncheck to archive a resource without deleting its record. Drafts cannot be viewed or purchased publicly." />
    {error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-actions"><button type="submit" className="admin-btn admin-btn-primary">{saving ? 'Saving…' : product.published ? 'Save & publish' : 'Save draft'}</button><button type="button" className="admin-btn" onClick={onCancel}>Cancel</button></div>
  </fieldset></form>;
}

export default function ShopManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(undefined);
  const refresh = () => loadProducts(true).then(data => { setProducts(data); setError(''); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); });
  useEffect(() => { let active = true; loadProducts(true).then(data => { if (active) { setProducts(data); setLoading(false); } }).catch(e => { if (active) { setError(e.message); setLoading(false); } }); return () => { active = false; }; }, []);
  return <div className="shop-admin"><section className="admin-card"><div className="admin-actions"><h1>Obsidian International</h1><Link className="admin-btn" to="/shop" target="_blank">View shop ↗</Link></div><p className="admin-hint">Manage resources, previews and checkout links. Changes go live when saved; no redeploy needed.</p><details><summary>Connect Dodo in five steps</summary><ol><li>Create a one-time product in Dodo test mode.</li><li>Upload your paid files to a Digital Files entitlement and attach it to that product.</li><li>Add a resource below, match the price, choose test mode and paste the reusable product payment link.</li><li>Publish and open the product from your shop. Complete a test payment using Dodo’s test details, then check the confirmation and download.</li><li>After Dodo approves your live account, configure the live product and replace the test link with its live link. Switch mode to live and save.</li></ol><p className="admin-hint">Payment success is confirmed by Dodo, not by the return page. This version tracks clicks; Dodo’s dashboard tracks sales.</p><a href="https://docs.dodopayments.com/features/digital-product-delivery" target="_blank" rel="noreferrer">Dodo file delivery guide ↗</a></details></section>
    {editor !== undefined ? <ProductEditor key={editor?.slug || 'new'} initial={editor} onSaved={() => { setEditor(undefined); refresh(); }} onCancel={() => setEditor(undefined)} /> : <section className="admin-card"><div className="admin-actions"><h2>Resources</h2><button type="button" className="admin-btn" onClick={() => setEditor(null)} disabled={!!error || loading}>+ Add resource</button></div>{loading && <p role="status">Loading resources…</p>}{error && <div role="alert"><p className="admin-error">{error} If this is a new deployment, apply the shop database migration.</p><button className="admin-btn" onClick={refresh}>Retry</button></div>}{products.map(p => <div key={p.slug} className="shop-admin-product"><div><strong>{p.details.title}</strong><small>{p.published ? 'Published' : 'Draft'} · {p.details.checkout_mode} · {priceLabel(p.details)}</small></div><div className="admin-actions">{p.published && <Link className="admin-btn" to={`/shop/${p.slug}`} target="_blank">View ↗</Link>}<button className="admin-btn" onClick={() => setEditor(p)}>Edit</button></div></div>)}{!loading && !error && !products.length && <p className="admin-hint">Add your first resource to get started.</p>}</section>}
    <ShopStats />
  </div>;
}
