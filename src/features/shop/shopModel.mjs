export const SHOP_BRAND = 'Obsidian International';
export const SHOP_EMAIL = 'sigdelagrim35@gmail.com';
export const FORMATS = ['Guide', 'Template', 'Spreadsheet', 'Bundle'];
export const CHECKOUT_MODES = ['disabled', 'free', 'test', 'live'];

export function safeAssetUrl(value) {
  if (!value || typeof value !== 'string') return '';
  if (/^\/(?!\/)[^\\\s]*$/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

// Only reusable product links. A checkout session is single-use and expires.
export function dodoLink(value, mode, origin) {
  if (!['test', 'live'].includes(mode)) return '';
  try {
    const url = new URL(value);
    const host = mode === 'test' ? 'test.checkout.dodopayments.com' : 'checkout.dodopayments.com';
    if (url.protocol !== 'https:' || url.host !== host || url.username || url.password || !/^\/buy\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) return '';
    // Discard customer details, price/quantity overrides and arbitrary redirects.
    url.search = '';
    url.hash = '';
    url.searchParams.set('quantity', '1');
    if (origin) url.searchParams.set('redirect_url', new URL('/shop/checkout/return', origin).href);
    return url.href;
  } catch { return ''; }
}

export function productAction(product, origin) {
  if (!product.published) return { label: 'Draft', url: '' };
  const { checkout_mode: mode, checkout_url: link, download_url: download } = product.details;
  if (mode === 'free') return { label: 'Download free', url: safeAssetUrl(download), event: 'download' };
  if (['test', 'live'].includes(mode)) return {
    label: mode === 'test' ? 'Try test checkout' : 'Buy now',
    url: dodoLink(link, mode, origin),
    event: mode === 'test' ? 'test_checkout' : 'checkout_click',
  };
  return { label: 'Available soon', url: '' };
}

export function priceLabel(details) {
  if (details.checkout_mode === 'free') return 'Free';
  if (details.checkout_mode === 'disabled') return 'Coming soon';
  const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: details.currency || 'USD' }).format(Number(details.price) || 0);
  return details.checkout_mode === 'test' ? `${price} · test only` : price;
}

export function validateProduct(product) {
  const d = product.details;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug) || product.slug.length > 100 || ['help', 'support', 'refunds', 'terms', 'privacy', 'checkout'].includes(product.slug)) return 'Use a unique lowercase slug with hyphens (not a reserved shop page).';
  if (!d.title?.trim() || d.title.length > 120) return 'Add a title of up to 120 characters.';
  if (!FORMATS.includes(d.format) || !CHECKOUT_MODES.includes(d.checkout_mode)) return 'Choose a valid format and checkout mode.';
  if (!['USD', 'EUR', 'GBP', 'INR', 'NPR'].includes(d.currency)) return 'Choose a supported display currency.';
  if (!Number.isFinite(Number(d.price)) || Number(d.price) < 0 || !/^\d+(\.\d{1,2})?$/.test(String(d.price))) return 'Enter a non-negative price with at most two decimal places.';
  if (!Number.isInteger(Number(product.sort_order))) return 'Display order must be a whole number.';
  for (const key of ['cover_url', 'sample_url', 'download_url']) {
    if (d[key] && !safeAssetUrl(d[key])) return `${key.replaceAll('_', ' ')} must be a local path or HTTPS URL.`;
  }
  if ((d.previews || []).some(url => !safeAssetUrl(url))) return 'Preview images must use local paths or HTTPS URLs.';
  if (['test', 'live'].includes(d.checkout_mode) && !dodoLink(d.checkout_url, d.checkout_mode)) return `Paste a reusable Dodo ${d.checkout_mode} product link ending in /buy/PRODUCT_ID. The link host must match the mode.`;
  if (product.published && (!d.summary?.trim() || !d.description?.trim() || !d.includes?.some(x => x.trim()))) return 'Published products need a summary, description and contents.';
  if (product.published && d.checkout_mode === 'free' && !d.download_url) return 'A free product needs a download URL before publishing.';
  if (product.published && ['test', 'live'].includes(d.checkout_mode) && (!d.delivery_ready || Number(d.price) <= 0)) return 'Before publishing, set a positive price and confirm that Dodo pricing and file delivery are configured.';
  return '';
}

export function blankProduct() {
  return { slug: '', published: false, sort_order: 10, details: {
    title: '', summary: '', description: '', audience: '', format: 'Guide',
    price: '0', currency: 'USD', checkout_mode: 'disabled', checkout_url: '',
    delivery_ready: false, cover_url: '', sample_url: '', download_url: '',
    includes: [], previews: [], file_note: '',
  } };
}

export function campaignValue(value) {
  // Campaign labels only, never arbitrary URLs, email addresses or identifiers.
  return /^[A-Za-z0-9_-]{1,80}$/.test(value || '') ? value : '';
}

export function campaignSearch(search) {
  const incoming = new URLSearchParams(search);
  const clean = new URLSearchParams();
  for (const key of ['utm_source', 'utm_campaign']) {
    const value = campaignValue(incoming.get(key));
    if (value) clean.set(key, value);
  }
  return clean.size ? `?${clean}` : '';
}
