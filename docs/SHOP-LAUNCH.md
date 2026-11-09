# Shop domain and live payments

The storefront uses the existing portfolio Netlify project and Supabase catalogue.
Both addresses are supported:

- `https://shop.agrimsigdel.com.np/` — storefront root and clean product paths.
- `https://agrimsigdel.com.np/shop` — compatible portfolio path.

The portfolio's Shop buttons link to the subdomain. Old portfolio shop URLs keep
working; they are not redirected away while the domain is being established.
Administration remains at `https://agrimsigdel.com.np/admin`.

## Domain setup

1. Netlify → the `agrimsigdel` project → Domain management → Add domain alias:
   `shop.agrimsigdel.com.np`. Keep the portfolio's primary domain unchanged.
2. Cloudflare → `agrimsigdel.com.np` → DNS → Records:

   | Type | Name | Target | Proxy | TTL |
   | --- | --- | --- | --- | --- |
   | CNAME | shop | agrimsigdel.netlify.app | DNS only | Auto |

3. In Netlify, check DNS verification and HTTPS certificate provisioning for the
   new alias. The certificate must include `shop.agrimsigdel.com.np` before launch.
4. Deploy this repository's `main` branch. The hostname selects the shop routes;
   no second Netlify site, database or build environment is needed.

`netlify.toml` preserves legacy `/shop/...` paths on the shop host and serves its
own robots/sitemap files. Dodo checkout return URLs use `/checkout/return` on the
shop host and `/shop/checkout/return` on the portfolio. Relative sample assets
still resolve from `/shop-assets/` on either host.

For local browser checks use `http://shop.localhost:5173/` with the existing Vite
server. This hostname selects shop routes and is excluded from shop analytics.

## Enable real sales

1. Complete Dodo account verification. Use **Individual** if Obsidian International
   is only a brand operated by Agrim Sigdel. Submit accurate product information,
   identity verification and bank details. Live payments require approved forms;
   payouts also require Dodo's completed monitoring/compliance review.
2. In Dodo **Live** mode, create a key with Products and Entitlements read/write
   access. Configure `DODO_PAYMENTS_LIVE_API_KEY` in Supabase Edge Function secrets.
   A local copy may be kept in the ignored `.env.local`; never use a `VITE_` prefix.
3. Admin → Shop → the validated product. Confirm its final price, description,
   public sample and private paid file. Choose **live**, explicitly enable live
   operations and run **Sync with Dodo & connect checkout**.
4. The sync creates separate live product/file records, verifies them, and updates
   the listing to a live checkout URL. Do not merely replace `test.checkout` in a
   URL: test product IDs do not work in the live environment.
5. Check the published product's **Buy now** button, real checkout total/currency,
   Digital Files inclusion and return URL. The existing sandbox purchase verified
   payment and email delivery; real-payment evidence requires a genuine live sale.
6. Keep customer Payment Succeeded emails enabled in Dodo. Support remains
   `contact@agrimsigdel.com.np`. API synchronization does not verify account approval
   or receipt of payouts.

The original Problem-to-Product Planner has a public full-file sample. Review its
file/sample separation before converting that legacy test listing into a paid
live product. The Validation Sprint already has separate public sample and private
paid master. The batch import test must remain a draft.

Sources checked 9 November 2026:

- [Dodo verification](https://docs.dodopayments.com/miscellaneous/verification-process)
- [Dodo test and live environments](https://docs.dodopayments.com/miscellaneous/test-mode-vs-live-mode)
- [Netlify domain aliases](https://docs.netlify.com/manage/domains/configure-domains/add-a-domain-alias/)
- [Netlify external DNS](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/)
