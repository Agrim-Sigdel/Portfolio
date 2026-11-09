import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { campaignSearch, campaignValue, dodoLink, productAction, safeAssetUrl, validateProduct, isShopOrigin, shopPath, shopRoutePath } from '../src/features/shop/shopModel.mjs';
const seed = JSON.parse(readFileSync(new URL('../src/features/shop/seed-product.json', import.meta.url)));

test('the launch resource is complete and downloadable', () => {
  assert.equal(validateProduct(seed), '');
  assert.equal(productAction(seed).url, '/shop-assets/problem-to-product-planner.pdf');
});
test('draft and disabled products have no purchase action', () => {
  assert.equal(productAction({ ...seed, published: false }).url, '');
  assert.equal(productAction({ ...seed, details: { ...seed.details, checkout_mode: 'disabled' } }).url, '');
});
test('checkout allows only matching Dodo product links', () => {
  const live = 'https://checkout.dodopayments.com/buy/pdt_123';
  const testLink = 'https://test.checkout.dodopayments.com/buy/pdt_123';
  assert.ok(dodoLink(live, 'live'));
  assert.ok(dodoLink(testLink, 'test'));
  for (const link of [live, 'http://test.checkout.dodopayments.com/buy/pdt_123', 'https://test.checkout.dodopayments.com.evil.test/buy/pdt_123', 'https://test.checkout.dodopayments.com/session_123', 'https://user:pass@test.checkout.dodopayments.com/buy/pdt_123', 'javascript:alert(1)']) assert.equal(dodoLink(link, 'test'), '');
});
test('checkout removes prefilled PII and overrides and sets a local return page', () => {
  const result = new URL(dodoLink('https://checkout.dodopayments.com/buy/pdt_123?email=private@example.com&quantity=7&redirect_url=https://evil.test#secret', 'live', 'https://agrimsigdel.com.np'));
  assert.equal(result.searchParams.get('email'), null);
  assert.equal(result.searchParams.get('quantity'), '1');
  assert.equal(result.searchParams.get('redirect_url'), 'https://agrimsigdel.com.np/shop/checkout/return');
  assert.equal(result.hash, '');
});
test('shop host uses root routes while portfolio and previews retain /shop', () => {
  for (const origin of ['https://shop.agrimsigdel.com.np', 'http://shop.localhost:5173']) {
    assert.equal(isShopOrigin(origin), true);
    assert.equal(shopPath('', origin), '/');
    assert.equal(shopPath('/help', origin), '/help');
    assert.equal(shopPath('a-guide', origin), '/a-guide');
    const checkout = new URL(dodoLink('https://test.checkout.dodopayments.com/buy/pdt_123', 'test', origin));
    assert.equal(checkout.searchParams.get('redirect_url'), `${origin}/checkout/return`);
  }
  for (const origin of ['https://agrimsigdel.com.np', 'https://example.netlify.app', 'http://localhost:5173', 'https://shop.agrimsigdel.com.np.evil.test']) {
    assert.equal(isShopOrigin(origin), false);
    assert.equal(shopPath('', origin), '/shop');
    assert.equal(shopPath('help', origin), '/shop/help');
  }
  assert.equal(isShopOrigin('not a URL'), false);
});
test('legacy shop paths normalize without changing unrelated product names', () => {
  assert.equal(shopRoutePath('/shop'), '/');
  assert.equal(shopRoutePath('/shop/'), '/');
  assert.equal(shopRoutePath('/shop/checkout/return'), '/checkout/return');
  assert.equal(shopRoutePath('/shop/a-guide'), '/a-guide');
  assert.equal(shopRoutePath('/shopping-guide'), '/shopping-guide');
  assert.equal(shopRoutePath('/a-guide'), '/a-guide');
});
test('published paid products require a matching checkout, price and delivery confirmation', () => {
  const product = structuredClone(seed);
  Object.assign(product.details, { checkout_mode: 'test', checkout_url: 'https://test.checkout.dodopayments.com/buy/pdt_123', price: '5' });
  assert.match(validateProduct(product), /delivery/);
  product.details.delivery_ready = true;
  assert.equal(validateProduct(product), '');
  assert.equal(productAction(product).event, 'test_checkout');
  product.details.checkout_mode = 'live';
  assert.match(validateProduct(product), /live/);
  product.details.price = '1.999';
  assert.match(validateProduct(product), /decimal/);
});
test('asset links reject executable and protocol-relative URLs', () => {
  for (const value of ['javascript:alert(1)', '//evil.test/file', '/\\evil.test', 'data:text/html,hi', 'http://example.com/file']) assert.equal(safeAssetUrl(value), '');
  assert.equal(safeAssetUrl('/shop-assets/test.pdf'), '/shop-assets/test.pdf');
  assert.equal(safeAssetUrl('https://example.com/preview.png'), 'https://example.com/preview.png');
});
test('campaign attribution carries only safe labels across the catalogue', () => {
  assert.equal(campaignValue('creator@example.com'), '');
  assert.equal(campaignValue('x'.repeat(81)), '');
  assert.equal(campaignSearch('?utm_source=instagram&utm_campaign=launch&email=private@example.com'), '?utm_source=instagram&utm_campaign=launch');
  assert.equal(campaignSearch('?utm_source=https://example.com&token=secret'), '');
});
test('reserved slugs and incomplete published products are rejected', () => {
  for (const slug of ['help', 'shop', 'admin']) assert.match(validateProduct({ ...seed, slug }), /reserved/);
  assert.match(validateProduct({ ...seed, details: { ...seed.details, summary: '' } }), /summary/);
  assert.match(validateProduct({ ...seed, details: { ...seed.details, download_url: '' } }), /download URL/);
});
