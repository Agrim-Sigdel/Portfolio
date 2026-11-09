# Obsidian International shop

The existing Vite/Netlify portfolio serves `/shop`, `/shop/:productSlug`, `/shop/help`,
`/shop/support`, `/shop/refunds`, `/shop/terms`, `/shop/privacy`, and
`/shop/checkout/return`. Obsidian International is a brand operated by Agrim Sigdel.

## Product management

Sign in at `/admin` and open **Shop**. Add a resource, its description, contents,
format, preview images, sample and price. Save drafts privately or publish them.
Unpublish to archive a listing. Slug changes do not create redirects, so retain
published slugs whenever possible. Changes are saved to Supabase immediately.

### Second product: 7-Day Product Validation Sprint

The listing uses `/shop/seven-day-product-validation-sprint` and starts with
checkout disabled. Its suggested test price is USD 5; match the actual Dodo
price before enabling checkout. Edit the existing listing in **Admin → Shop**
when the Dodo product is ready instead of creating a duplicate.

The full five-page PDF and its generator are kept locally in the Git-ignored
`private/shop-products/` folder. Upload
`seven-day-product-validation-sprint.pdf` from that folder to Dodo's Digital
Files entitlement. Back up that private folder separately; it is not in Git
or the website deployment. Only the cover, the one-page sample PDF and its
preview image are in `public/shop-assets/`. The live listing uses copies in
the existing public `media` bucket (the `obsidian-v1-validation-sprint-*`
files), so it works without waiting for a Netlify build. Do not use the
sample PDF as the paid deliverable.

Once the Dodo product and entitlement are configured, select **test**, enter
the matching price and reusable checkout link, confirm delivery is ready,
and save. Payment and email delivery for this product still require an
end-to-end test after it is connected.

Public cover images and samples can be uploaded in the existing **Media** tab.
Do not upload paid product files into that public bucket or into `public/`.
For a free resource, provide a public download URL. Empty cover fields get a
typographic fallback. Preview fields accept image URLs, not PDFs or video URLs.

## Connect Dodo

Use **contact@agrimsigdel.com.np** for all Obsidian International customer support
and order enquiries. Set the same address in Dodo's customer-facing business
support and receipt settings. Website changes do not update Dodo account settings.

1. In Dodo **test mode**, create a one-time product and set its price/currency.
2. Create a **Digital Files entitlement**, upload the paid files, and attach it
   to that product. Dodo handles confirmation emails and customer downloads.
3. In the website admin, choose **test**, match the display price/currency, paste
   the reusable product link and confirm file delivery is configured.
   Format: `https://test.checkout.dodopayments.com/buy/PRODUCT_ID`.
4. Publish. Open the product from `/shop`, complete a test payment using Dodo's
   documented test details, and verify the order, email and download in Dodo.
5. When the merchant account and live product are approved, repeat the product
   and entitlement setup in live mode. Replace the link with
   `https://checkout.dodopayments.com/buy/PRODUCT_ID`, choose **live**, and save.

Do not paste a Checkout Sessions API URL: sessions expire and are single-use.
Links are restricted to Dodo's standard checkout hosts and `/buy/` paths. Extra
query parameters are stripped to avoid sharing customer data or overriding the
quantity/return destination. Quantity is one and the return page is on this site.
Display prices are editorial; Dodo is authoritative for final prices and taxes.
Changing a price here does not change the Dodo product.

No Dodo API key is needed or stored in the browser. The return page is informational
and never treats a URL parameter as payment confirmation. Downloads for paid
products are delivered by Dodo, not unlocked by this site. Confirmed sales and
revenue are in Dodo's dashboard. Automated site-side order fulfilment would require
a separate server integration and verified, idempotent payment webhooks.

Official references:
- https://github.com/dodopayments/skills/blob/main/dodo-payments/checkout-integration/SKILL.md
- https://docs.dodopayments.com/features/digital-product-delivery
- https://docs.dodopayments.com/developer-resources/checkout-session

## Database

Apply `supabase/migrations/20261109090000_shop.sql` once to the portfolio Supabase
project. It adds isolated shop tables and RPCs without modifying portfolio CMS
content. The seed is a genuine free three-page planner; there are no mock paid
listings. `src/features/shop/seed-product.json` is a test fixture matching that seed,
not a runtime fallback. A failed database read shows a retry screen, never stale
payment links.

The migration makes existing private portfolio auth accounts shop administrators.
Keep public signup disabled. Future shop administrators require an explicit entry
in `shop_admins`; new auth accounts do not inherit write access. RLS hides drafts
from anonymous readers and restricts product changes to listed admins. Never add
customers to `shop_admins`.

`shop_events` is not directly readable or writable by browser roles. A bounded
RPC records approved event types for published products. `shop_stats()` checks
admin membership and aggregates the last 30 days (up to 500 groups). Raw events
older than 90 days are removed on subsequent event ingestion. Public event counts
can contain repeat visits or bot traffic; they are directional, not audited sales.

Use product links with `?utm_source=instagram&utm_campaign=launch` (letters, numbers,
hyphens and underscores only). The catalogue carries these two labels into product
pages. No analytics cookie, persistent visitor ID, full referrer or full URL is
stored. Localhost, Do Not Track and Global Privacy Control are excluded.

## Verify and deploy

```sh
node --test tests/shop.test.mjs
npx eslint src/features/shop src/pages/shop src/pages/admin/ShopManager.jsx
npm run build
```

Check the catalogue and product on mobile and desktop, sample/download links,
policy links, missing products, unauthenticated admin access, and a draft save /
publish / unpublish cycle. Test the checkout mode before live mode. Netlify's
existing SPA rewrite supports direct links and refreshes on every shop route.

The sample PDF can be regenerated with `python3 scripts/generate-shop-sample.py`
(ReportLab required). Render its three pages to `public/shop-assets/planner-preview-N.png`
with Poppler and inspect them before shipping an updated sample.
