import { blankProduct, validateProduct } from './shop-contract.mjs';

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const FILE_TYPES = {
  pdf: 'application/pdf', zip: 'application/zip', epub: 'application/epub+zip',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  csv: 'text/csv', txt: 'text/plain', md: 'text/markdown',
};
export class ShopError extends Error {
  constructor(message, status = 400, code = 'invalid_request') { super(message); this.status = status; this.code = code; }
}
export function requireSlug(slug) {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100 || ['help','support','refunds','terms','privacy','checkout'].includes(slug)) throw new ShopError('Use a valid product slug.');
  return slug;
}
export function requireMode(mode) {
  if (!['test', 'live'].includes(mode)) throw new ShopError('Choose test or live mode.');
  return mode;
}
export function normalizeProduct(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ShopError('Provide a product object.');
  requireSlug(input.slug);
  const raw = input.details;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ShopError('Provide product details.');
  const defaults = blankProduct().details;
  const details = {};
  for (const key of Object.keys(defaults)) {
    const val = raw[key] ?? defaults[key];
    if (['includes', 'previews'].includes(key)) {
      if (!Array.isArray(val) || val.length > 30 || val.some(x => typeof x !== 'string' || x.length > 2000)) throw new ShopError(`Invalid ${key}.`);
      details[key] = val.map(x => x.trim()).filter(Boolean);
    } else if (key === 'delivery_ready') details[key] = val === true;
    else {
      if (typeof val !== 'string' || val.length > (key === 'description' ? 12000 : 2500)) throw new ShopError(`Invalid ${key}.`);
      details[key] = val.trim();
    }
  }
  details.api_managed = raw.api_managed === true;
  details.tax_category = raw.tax_category ?? 'digital_products';
  if (!['digital_products', 'e_book'].includes(details.tax_category)) throw new ShopError('Choose digital_products or e_book as the Dodo tax category.');
  const product = {slug: input.slug, published: input.published === true, sort_order: Number(input.sort_order ?? 10), details};
  const error = validateProduct(product); if (error) throw new ShopError(error);
  return product;
}
export function priceInMinorUnits(value) {
  if (!/^\d+(\.\d{1,2})?$/.test(String(value))) throw new ShopError('Use a price with at most two decimal places.');
  const [whole, decimal = ''] = String(value).split('.');
  const minor = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(minor) || minor <= 0 || minor > 2147483647) throw new ShopError('Price must be positive and within Dodo’s supported range.');
  return minor;
}
export function dodoProductBody(product) {
  const d = product.details;
  if (!['USD','EUR','GBP','INR','NPR'].includes(d.currency)) throw new ShopError('Unsupported automation currency.');
  return {name: d.title, description: d.description, tax_category: d.tax_category || 'digital_products',
    price: {type: 'one_time_price', price: priceInMinorUnits(d.price), currency: d.currency, discount: 0, pay_what_you_want: false, purchasing_power_parity: false, tax_inclusive: false}};
}
export function fileInfo(name, size) {
  if (typeof name !== 'string' || !name || name.length > 180 || /[\/\\\x00-\x1f]/.test(name) || name.startsWith('.')) throw new ShopError('Use a simple file name without folders.');
  const extension = name.split('.').pop().toLowerCase();
  if (!FILE_TYPES[extension]) throw new ShopError('Use PDF, ZIP, EPUB, XLSX, DOCX, PPTX, CSV, TXT or MD. Put multi-file bundles in a ZIP.');
  if (!Number.isInteger(size) || size < 1 || size > MAX_FILE_BYTES) throw new ShopError('Paid files must be between 1 byte and 20 MB.');
  return {filename: name, size_bytes: size, content_type: FILE_TYPES[extension]};
}
export async function sha256(bytes) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(b => b.toString(16).padStart(2,'0')).join('');
}
export async function desiredHash(product, file) {
  return sha256(new TextEncoder().encode(JSON.stringify({body: dodoProductBody(product), file: file.sha256, filename: file.filename})));
}
export function billingFieldsChanged(a, b) {
  return ['title','description','price','currency','tax_category'].some(k => (a[k] ?? '') !== (b[k] ?? ''));
}
export function publicFileInfo(file) {
  if (!file) return null;
  const {filename, size_bytes, content_type, sha256: hash, updated_at} = file;
  return {filename, size_bytes, content_type, sha256: hash, updated_at};
}
