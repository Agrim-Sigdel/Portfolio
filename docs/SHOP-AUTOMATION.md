# Product automation

Create a listing, upload its paid file, and connect Dodo from **Admin → Shop** or
from a local JSON batch. Both use the same `shop-product-admin` Edge Function.
The public shop still reads the catalogue from Supabase, so product changes do
not require a Netlify deployment.

## Initial backend setup

Apply only `supabase/migrations/20261109120000_shop_dodo_automation.sql` after the
original shop migration. Deploy `shop-product-admin`. This repository's older
CMS migrations were applied separately; do not blindly replay all migrations.

Set these in **Supabase → Edge Functions → Secrets**:

- `DODO_PAYMENTS_TEST_API_KEY`: test account key.
- `DODO_PAYMENTS_LIVE_API_KEY`: live account key, when ready for real payments.

Each key needs **Products** and **Entitlements** read/write permissions. A key
with product-write access alone cannot upload files or create their entitlement.

Keep keys out of product fields, manifests, Git, browser storage and all `VITE_`
variables. The backend uses the platform's existing service credential for its
database operations. Ordinary requests require a signed-in user listed in
`shop_admins`; the public anon key cannot administer products.

## Website admin

1. Add a resource with **Manage Dodo through this website** enabled.
2. Enter the real description, contents, price, currency and tax category. Use
   `e_book` for an ebook or `digital_products` for other downloadable resources,
   as appropriate to the actual product. Add public cover and sample URLs.
3. Save. Upload the full paid file in **Dodo product automation** below the form.
4. Choose **test**, then **Sync with Dodo & connect checkout**. Progress is saved
   between steps. Retry resumes existing work rather than blindly creating again.
5. Use the listing's Published checkbox to control visibility. Dodo sync uses
   that saved setting. Test checkout never charges real money.
6. Complete a customer checkout and verify the confirmation email and downloaded
   file before choosing live mode. Live operations require the live key and an
   explicit live checkbox.

Files are limited to **20 MB each by this integration**, below Dodo's documented
100 MB upload limit, to stay within the serverless runtime's memory and time
budget. One paid file is supported per listing; ZIP multiple files into a bundle.
Supported formats: PDF, ZIP, EPUB, XLSX, DOCX, PPTX, CSV, TXT and MD. Cover images,
sample PDFs and preview images belong in public Media. Paid masters are saved in
the private `shop-paid-files` bucket and forwarded to Dodo; their storage paths
and contents are never added to the public product row.

Product slugs are stable identifiers. Existing manual Dodo links remain supported.
To move a manually linked listing to API management, first disable and save its
checkout, then enable API management. This creates a separate managed Dodo
product; it does not silently take ownership of an existing manual product.

## JSON batches

Copy `examples/shop-products.example.json` into your Git-ignored
`private/shop-products/` directory. Replace its descriptions, prices and paths.
Each entry has a stable `slug`, the public listing fields, a `published` boolean,
and a local `file` path relative to the manifest. `mode` defaults to `test`.
Price is a decimal **string**, such as `"5.00"`. Maximum batch size is 100.

Local `.env.local` needs `VITE_SUPABASE_URL` (or `SUPABASE_URL`) and either the
existing `SUPABASE_SERVICE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`, or a signed-in shop
admin's `SHOP_ADMIN_ACCESS_TOKEN`. An access token expires with the session.
The service key is a privileged local credential: keep the file private. The
script sends it only to this project's HTTPS Supabase endpoint, never to Dodo.

Validate all items and files without any network requests:

```sh
npm run shop:import -- private/shop-products/products.json
```

Save, upload, sync and apply each entry's publication setting:

```sh
npm run shop:import -- private/shop-products/products.json --apply
```

Other options:

```sh
# Prepare listings and private uploads without Dodo sync; checkout stays disabled.
npm run shop:import -- private/shop-products/products.json --apply --save-only

# Only when the manifest deliberately has "mode": "live" and the live key is set.
npm run shop:import -- private/shop-products/products.json --apply --allow-live

# Keep processing independent items after a failure.
npm run shop:import -- private/shop-products/products.json --apply --continue-on-error
```

The default report is `<manifest>.report.json`; use `--report PATH` to choose a
different path. Reports are Git-ignored and contain results, IDs and error messages,
never API keys or signed download URLs. Any failed item returns a non-zero exit
status. Re-run the same manifest to resume. Successful items retain their Dodo
product IDs; unchanged files are not reuploaded. The importer validates the
entire manifest and all local files before writing the first product.

The script only manages product creation and delivery configuration. It does not
charge cards, issue refunds, create customer accounts or send marketing emails.

## Sync and recovery

The backend holds a short per-product database lock. Test and live IDs are stored
separately in private `shop_dodo_sync` rows. It creates a Digital Files entitlement,
uploads the file, creates/updates the Dodo product, then reads back its price and
delivery before enabling checkout. Each HTTP request performs one bounded step.

Before a create/upload request, an in-progress marker is saved. If Dodo accepted
the request but its response was lost, a retry looks up the resource through its
metadata or the entitlement's file list. If the result cannot be established
uniquely, the sync stops with `reconciliation_required` instead of creating a
duplicate. Retry after the provider recovers; investigate Dodo if it stays unclear.
Reconciliation scans at most 1,000 resources and stops if that limit is reached.

Changing the description, price, currency, tax category or paid file requires
another sync. Checkout stays disabled while incomplete. Replacing a file creates
a new version of the entitlement, retaining the managed Dodo product ID. Benefits
added separately in Dodo are preserved. Previous customers retain the file version
they purchased; replacing a file is not an automatic update to earlier orders.

The local masters under `private/shop-products/` are not in Git. Back them up
separately. Private storage retains prior file versions; this feature does not
automatically delete paid files or revoke earlier purchases.

## Verification

```sh
node --test tests/shop.test.mjs tests/shop-automation.test.mjs
npx eslint src/features/shop src/pages/admin/ShopManager.jsx src/pages/admin/DodoProductSync.jsx
npm run build
```

Verify signed-out/anon requests are rejected, drafts remain hidden, private files
cannot be read publicly, a multi-product test batch succeeds, and re-running the
batch keeps the same Dodo product IDs. Complete a test checkout separately to
verify the customer's actual email and download experience. Dodo's email settings
and account/brand configuration remain in its dashboard; the support address is
`contact@agrimsigdel.com.np`.

Official API references:

- https://docs.dodopayments.com/api-reference/products/post-products
- https://docs.dodopayments.com/api-reference/products/patch-products
- https://docs.dodopayments.com/api-reference/entitlements/create-entitlement
- https://docs.dodopayments.com/features/digital-product-delivery
- https://supabase.com/docs/guides/functions/limits
