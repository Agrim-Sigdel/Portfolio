import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import SEO from '../../shared/ui/SEO';
import { loadProducts, trackShop } from '../../features/shop/shopStore';
import { SHOP_BRAND, SHOP_EMAIL, campaignSearch, priceLabel, productAction, safeAssetUrl } from '../../features/shop/shopModel.mjs';
import './shop.css';

const info = {
  help: { title: 'A little help with your purchase.', subtitle: 'From checkout to your first download.', sections: [
    ['How do I get a free resource?', 'Open its product page and choose Download free. The PDF opens directly; use your browser’s download or save button. No account or payment is required.'],
    ['How do paid purchases work?', 'Choose Buy now on a product page to open Dodo Payments’ hosted checkout. Check the product, currency and final total before paying. After successful payment, Dodo sends the purchase confirmation and download access to the email you used at checkout.'],
    ['Where is my download?', 'Check your inbox and spam folder for your Dodo purchase email. Reopen the order link in that email or your Dodo customer portal to retrieve fresh download links. If you still cannot access your files, email support with the product name, checkout email and order ID. Do not send card details.'],
    ['What does “test checkout” mean?', 'A product marked Test checkout is a demonstration, not a live sale. Use only Dodo’s documented test payment details. It does not create a real paid order.'],
    ['Can I use the files on my phone?', 'Check the file requirements on the product page before buying. PDFs work in a PDF reader; spreadsheets and editable templates may need compatible software.'],
  ] },
  support: { title: 'Let’s get it sorted.', subtitle: 'Support for Obsidian International resources.', sections: [
    ['Contact', `Email ${SHOP_EMAIL} with your product name and a short description of the issue. For purchases, include your order ID and the email used at checkout. Never send passwords, payment card numbers or security codes.`],
    ['What we can help with', 'Missing downloads, files that will not open, product questions and refund requests. For payment status, check your Dodo receipt or order page as well.'],
    ['Who runs the shop?', 'Obsidian International is a brand operated by Agrim Sigdel in Kathmandu, Nepal. It is the digital resources part of this personal portfolio.'],
  ] },
  refunds: { title: 'Refunds, clearly explained.', subtitle: 'Last updated 9 November 2026.', sections: [
    ['Request a refund', `Contact ${SHOP_EMAIL} within 14 days of purchase with your order ID and the reason for your request. We review requests for duplicate purchases, missing or unusable files, and products that materially differ from their description. We may first help you recover the download or provide a working file.`],
    ['How refunds are handled', 'Approved refunds are processed through Dodo Payments to the original payment method. Processing times depend on the payment provider and your bank. Download access may be withdrawn when a purchase is refunded.'],
    ['Before you purchase', 'Read the description, sample, file format and software requirements. These are digital downloads, with no physical shipping. Free downloads and test checkouts do not involve a payment to refund.'],
    ['Your rights', 'This policy does not limit any mandatory consumer rights that apply to your purchase. Dodo’s checkout terms also apply to payments processed by Dodo.'],
  ] },
  terms: { title: 'Terms of use.', subtitle: 'Last updated 9 November 2026.', sections: [
    ['The shop', 'Obsidian International is a brand operated by Agrim Sigdel, Kathmandu, Nepal. These terms cover the resources offered here. Dodo Payments’ buyer terms apply to checkout and payment processing.'],
    ['Your licence', 'Unless a product page explicitly grants a different licence, you may use and adapt the purchased resource for your own personal work or your own business. You may not redistribute, resell, sublicense or publicly share the source files. Copyright remains with the creator.'],
    ['Product information', 'Check the contents, format, language and software requirements before purchase. The final price, applicable taxes and currency are shown at checkout. Only products with an active live checkout can be purchased. Test checkouts are demonstrations.'],
    ['Using the resources', 'Resources are educational and organisational tools. They do not guarantee income, business results or any particular outcome, and are not personalised medical, legal or financial advice. Updates or ongoing support are included only when the product description says so.'],
    ['Problems with your order', `See the refund policy or contact ${SHOP_EMAIL}. Nothing in these terms removes mandatory rights that apply to you.`],
  ] },
  privacy: { title: 'Your privacy matters.', subtitle: 'Last updated 9 November 2026.', sections: [
    ['Who operates this shop', `Agrim Sigdel operates Obsidian International from Kathmandu, Nepal. For privacy questions or requests, email ${SHOP_EMAIL}.`],
    ['Shop analytics', 'We count shop visits, product views, sample clicks, free download clicks and checkout clicks. Events can include a product slug and campaign labels (utm_source and utm_campaign). We do not set analytics cookies or store a persistent visitor ID, full browsing URL, card details or full referrer in these events. These counts are not unique visitor or confirmed sales figures. We respect browser Do Not Track and Global Privacy Control signals. Analytics events are retained for up to 90 days; older records are removed when new events arrive.'],
    ['Orders and support', 'Dodo Payments collects and processes the information needed for checkout and delivery under its own privacy policy. We can access order information needed to support a purchase. Emails you send us are used to answer your request and retained only as needed for support, disputes and applicable recordkeeping obligations.'],
    ['Service providers', 'This site uses Netlify for hosting and Supabase for catalogue data, administration and shop analytics. These providers may process technical connection information such as IP addresses in their service logs. Dodo handles paid checkout and file delivery. Data may be processed outside Nepal.'],
    ['Your choices', 'Free downloads do not require an account or marketing signup. You can enable Do Not Track or Global Privacy Control to disable our shop event collection, and contact us about access, correction or deletion of information associated with your purchases or support requests, subject to applicable retention requirements.'],
  ] },
};

function ProductCover({ product, className = '' }) {
  const url = safeAssetUrl(product.details.cover_url);
  return <div className={`shop-cover ${className}`}>
    {url ? <img src={url} alt={`${product.details.title} cover`} /> : <div className="shop-cover-type"><span>{SHOP_BRAND}</span><strong>{product.details.title}</strong><small>{product.details.format} / Digital edition</small></div>}
  </div>;
}

function ProductDetail({ product }) {
  const d = product.details;
  const action = productAction(product, window.location.origin);
  const sample = safeAssetUrl(d.sample_url);
  return <>
    <Link className="shop-back" to="/shop">← All resources</Link>
    <div className="shop-product-layout">
      <ProductCover product={product} />
      <section className="shop-product-copy">
        <p className="shop-eyebrow">{d.format} / Digital download</p>
        <h1>{d.title}</h1>
        <p className="shop-lead">{d.summary}</p>
        <p className="shop-price">{priceLabel(d)}</p>
        {d.checkout_mode === 'test' && <p className="shop-notice">Test checkout · No real payment. This listing is for testing the purchase flow.</p>}
        {action.url ? <a className="shop-button" href={action.url} onClick={() => trackShop(action.event, product.slug)} download={d.checkout_mode === 'free' ? '' : undefined} rel="noreferrer">{action.label} <span aria-hidden="true">↗</span></a> : <button className="shop-button" disabled>Available soon</button>}
        <p className="shop-fine">{d.file_note || 'Digital resource. No physical delivery.'}</p>
        {d.checkout_mode === 'live' && <p className="shop-fine">Secure checkout and delivery by Dodo Payments. Final taxes and currency shown at checkout.</p>}
        <div className="shop-inline-links">
          {sample && <a href={sample} target="_blank" rel="noreferrer" onClick={() => trackShop('sample_click', product.slug)}>Preview sample ↗</a>}
          <Link to="/shop/help">Purchase help</Link><Link to="/shop/refunds">Refund policy</Link>
        </div>
      </section>
    </div>
    <div className="shop-details-grid">
      <section><p className="shop-eyebrow">The problem, made simpler</p><h2>A clearer place to start.</h2><p className="shop-preserve">{d.description}</p>{d.audience && <p className="shop-audience">{d.audience}</p>}</section>
      <section><p className="shop-eyebrow">Inside the download</p><h2>What you get.</h2><ul className="shop-contents">{d.includes?.map((item, i) => <li key={i}><span aria-hidden="true">↗</span>{item}</li>)}</ul></section>
    </div>
    {!!d.previews?.length && <section className="shop-preview-section"><p className="shop-eyebrow">Take a closer look</p><h2>Inside the resource.</h2><div className="shop-previews">{d.previews.filter(safeAssetUrl).map((url, i) => <a key={url} href={safeAssetUrl(url)} target="_blank" rel="noreferrer"><img src={safeAssetUrl(url)} alt={`${d.title}, preview ${i + 1}`} loading="lazy" /><span>Preview {String(i + 1).padStart(2, '0')} ↗</span></a>)}</div></section>}
  </>;
}

function Catalogue({ products }) {
  const [format, setFormat] = useState('All');
  const campaign = campaignSearch(useLocation().search);
  const formats = ['All', ...new Set(products.map(p => p.details.format))];
  const shown = products.filter(p => format === 'All' || p.details.format === format);
  return <>
    <section className="shop-hero"><div><p className="shop-eyebrow"><span className="shop-dot" /> Independent ideas. Practical resources.</p><h1>Less overwhelm.<br />More <em>doing.</em></h1><p className="shop-lead">Thoughtful guides, templates and tools to turn a real problem into a clear next step.</p><a className="shop-button" href="#resources">Explore the collection <span aria-hidden="true">↓</span></a></div><div className="shop-hero-art" aria-hidden="true"><div className="shop-orbit" /><div className="shop-art-card"><span>OBSIDIAN<br />INTERNATIONAL</span><strong>Make room<br />for your<br /><i>next idea.</i></strong><div>RESOURCES FOR GETTING STARTED <span>↗</span></div></div><span className="shop-art-note">Small tools.<br />Considered design.</span></div></section>
    <div className="shop-promise"><span>01 / Made to be useful</span><span>02 / Digital, by design</span><span>03 / Yours to put into practice</span></div>
    <section id="resources" className="shop-catalogue"><div className="shop-section-title"><div><p className="shop-eyebrow">The collection</p><h2>Start somewhere good.</h2></div><span className="shop-fine">{products.length} {products.length === 1 ? 'resource' : 'resources'} / More in the making</span></div>
      {formats.length > 2 && <div className="shop-filters" aria-label="Filter resources">{formats.map(f => <button key={f} aria-pressed={format === f} onClick={() => setFormat(f)}>{f}</button>)}</div>}
      <div className="shop-products">{shown.map(p => <Link className="shop-product-card" key={p.slug} to={`/shop/${p.slug}${campaign}`}><ProductCover product={p} /><div className="shop-card-meta"><span>{p.details.format}</span><span>{priceLabel(p.details)}</span></div><h3>{p.details.title} <span aria-hidden="true">↗</span></h3><p>{p.details.summary}</p></Link>)}</div>
      {!products.length && <p className="shop-notice">New resources are on their way. Check back soon.</p>}
    </section>
    <section className="shop-bottom-note"><p className="shop-eyebrow">Simple from the start</p><h2>Find your resource.<br />Make it your own.</h2><div><p>See exactly what’s inside before you download. Clear descriptions, useful previews, and a real person to contact if you get stuck.</p><Link to="/shop/help">How downloads work ↗</Link></div></section>
  </>;
}

function InfoPage({ page }) {
  return <article className="shop-info"><Link className="shop-back" to="/shop">← Back to the shop</Link><p className="shop-eyebrow">{SHOP_BRAND}</p><h1>{page.title}</h1><p className="shop-lead">{page.subtitle}</p>{page.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}<a className="shop-button" href={`mailto:${SHOP_EMAIL}`}>Email support ↗</a>{page === info.privacy && <p className="shop-fine"><a href="https://dodopayments.com/legal/privacy-policy" target="_blank" rel="noreferrer">Dodo Payments privacy policy ↗</a></p>}</article>;
}

export default function ShopPage() {
  const { productSlug } = useParams();
  const { pathname, search } = useLocation();
  const [state, setState] = useState({ products: [], loading: true, error: '' });
  const [reload, setReload] = useState(0);
  const section = pathname.split('/')[2];
  const page = info[section];
  const isReturn = pathname === '/shop/checkout/return';
  const needsCatalogue = !page && !isReturn;
  const product = state.products.find(p => p.slug === productSlug);

  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.setAttribute('data-theme', 'light');
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    if (!needsCatalogue) return;
    let current = true;
    loadProducts().then(products => { if (current) setState({ products, loading: false, error: '' }); })
      .catch(error => { if (current) setState({ products: [], loading: false, error: error.message }); });
    return () => { current = false; };
  }, [needsCatalogue, reload]);
  useEffect(() => {
    if (pathname === '/shop' || pathname === '/shop/') trackShop('shop_view');
    else if (product) trackShop('product_view', product.slug);
  }, [pathname, search, product]);

  const title = page?.title || (isReturn ? 'After checkout' : product?.details.title || 'Practical digital resources');
  return <div className="shop-shell">
    <SEO title={`${title} | ${SHOP_BRAND}`} description={product?.details.summary || 'Practical guides, templates and digital resources by Obsidian International, a brand by Agrim Sigdel.'} url={`https://agrimsigdel.com.np${pathname}`} image="https://agrimsigdel.com.np/shop-assets/planner-preview-1.png" />
    <a className="shop-skip" href="#shop-main">Skip to content</a>
    <header className="shop-header"><Link className="shop-brand" to="/shop"><span className="shop-mark" aria-hidden="true">O<span>I</span></span><span>OBSIDIAN<small>INTERNATIONAL</small></span></Link><nav aria-label="Shop navigation"><Link to="/shop" aria-current={pathname === '/shop' ? 'page' : undefined}>Shop</Link><Link to="/shop/help">Purchase help</Link><Link className="shop-portfolio-link" to="/">Portfolio ↗</Link></nav></header>
    <main id="shop-main" className="shop-main">
      {page ? <InfoPage page={page} /> : isReturn ? <article className="shop-info"><p className="shop-eyebrow">After checkout</p><h1>Check your order email.</h1><p className="shop-lead">Your payment status and download access are confirmed by Dodo Payments.</p><p>This page does not verify a payment. If you completed checkout, check your Dodo order page or confirmation email for the result and download links. If payment was cancelled or failed, return to the product to try again. Test checkouts are not real purchases.</p><div className="shop-inline-links"><Link className="shop-button" to="/shop/help">Find my download ↗</Link><Link to="/shop">Back to shop</Link></div></article> : state.loading ? <p className="shop-loading" role="status">Loading the collection…</p> : state.error ? <div className="shop-info" role="alert"><h1>We’ll be right back.</h1><p>{state.error}</p><button className="shop-button" onClick={() => { setState(s => ({ ...s, loading: true })); setReload(n => n + 1); }}>Try again</button></div> : productSlug ? product ? <ProductDetail product={product} /> : <article className="shop-info"><h1>Resource not found.</h1><p>This resource may have moved or is not available yet.</p><Link className="shop-button" to="/shop">Explore the collection ↗</Link></article> : <Catalogue products={state.products} />}
    </main>
    <footer className="shop-footer"><div><strong>{SHOP_BRAND}</strong><p>Useful things, thoughtfully made.</p><small>A brand by <Link to="/">Agrim Sigdel</Link> · Kathmandu, Nepal</small></div><nav aria-label="Shop policies"><Link to="/shop/support">Support</Link><Link to="/shop/refunds">Refunds</Link><Link to="/shop/terms">Terms</Link><Link to="/shop/privacy">Privacy</Link></nav><span className="shop-copyright">© {new Date().getFullYear()} Agrim Sigdel</span></footer>
  </div>;
}
