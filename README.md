# MAB AI Strategies website

The company site for [MAB AI Strategies](https://www.mabaistrategies.com): a 3D flight through six
moments in AI history, each introducing one service, with a plain-HTML version of the same
content for phones, reduced motion and crawlers.

## Pages

| Path | File | Notes |
|---|---|---|
| `/` | `index.html` | 3D journey; `?flat=1` shows the plain version, `?flat=0` forces 3D |
| `/services` | `services.html` | Offers, pricing, estimator |
| `/command` | `command.html` | Representative system patterns |
| `/about`, `/contact` | `about.html`, `contact.html` | Contact form posts to Formspree |
| `/portal` | `portal.html` | Client billing through Stripe (noindex) |
| `/privacy`, `/terms`, `/refunds` | | Legal pages |

## Where content lives

- `content.js`: offers, proof, pricing, Stripe links, contact details.
- `world-data.js`: the seven stops (date, caption, source, mapped offer).

After changing either file, regenerate the nav, footer, crawlable timeline, JSON-LD and sitemap:

```bash
# bash, from the repo root
node scripts/build-static.cjs
```

To take payments, paste the Stripe Payment Link URLs into `payLink` on the tier or standalone
entries in `content.js`, and the customer portal login link into `billing.portalLoginUrl`.
Any entry left `null` shows "Book a call".

## Run and test

```bash
# bash, from the repo root
npm install
npm run serve          # http://127.0.0.1:8765, mirrors vercel.json (clean URLs, redirects, headers)
npm test               # unit, static-content and syntax checks
npm run test:browser   # Playwright; needs Chrome and the server running
node tests/release-check.cjs https://<deployment-url>   # crawl, redirects, headers, banned strings
```

## Deploy

Static files on Vercel, no build step. `vercel.json` sets clean URLs, redirects from the previous
site's paths and security headers. Turn on Web Analytics in the Vercel project to receive the
funnel events sent by `site.js`.
