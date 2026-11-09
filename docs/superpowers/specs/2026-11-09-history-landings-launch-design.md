# MAB Solar System: history landings, conversion layer, production launch

Date: 2026-11-09
Repo: `MABAIStrategies/mab-solar-system` · Branch: `feat/history-landings-launch`
Status: awaiting Mark's review. No product code has been changed.

## 1. Outcome

Replace mabaistrategies.com with the solar-system site, re-themed so each landing is a
dated moment in recent AI history that introduces one MAB offer. Visitors can estimate
their own opportunity, book a prepared briefing, and existing clients can pay and manage
billing through Stripe. The site is safe to send outbound traffic to.

Success means:

- Seven stops, each showing one caption sentence with a date, and a popup module with a
  3D wireframe and description of the mapped offer.
- Every link, CTA, form and payment path works on the production domain.
- No number, guarantee or testimonial on the site that Mark has not confirmed.
- The current site's About, Contact and legal content survives the cutover.
- Rollback to the current live site takes one domain reassignment.

## 2. What Mark said vs. what I assumed

Said: keep the space travel; drop the themed landing stations; one historical event per
offer; one sentence plus date per landing; popup module with a 3D wireframe; review the
Google Doc; make it production-ready with live links, portal and Stripe; deploy and point
DNS. Chosen on 2026-11-09: Stripe-hosted billing, and career-record framing for proof.

Assumed (strike any that are wrong):

- A1. Stops run in chronological order, so the flight reads as a timeline.
- A2. The four-chapter scroll narrative inside each world is removed. The caption and
  the popup replace it.
- A3. The prehistoric world images are retired. Landings are wireframe scenes drawn in
  code, with no photos of real people or events.
- A4. Career figures appear without naming a former employer.
- A5. The Command vault becomes a public gallery of representative system patterns. The
  client key and demo login are deleted.
- A6. Until one price sheet is confirmed, tiers show no prices and every tier CTA books
  a call. No Stripe products are created before that.
- A7. The standing "Export code" footer button applies to this site. It downloads a
  `.txt` mirror of the page source (the repo is already public).

## 3. Scope

In scope, in build order:

1. Event landings and popup modules (section 5)
2. Conversion layer adopted from the Google Doc (section 6)
3. Content and proof cleanup (section 7)
4. Pages carried over from the live site, plus billing (section 8)
5. Production hardening (section 9)
6. Cutover (section 11)

Out of scope: a custom client portal with auth and a database (own spec later); the live
agent sandbox; the gamified clearance vault; launch distribution; the nexus-crm version.

## 4. Architecture

The site stays static: vanilla JS, no build step, deployed on Vercel. three.js 0.160 is
already loaded for the space scene and is reused for wireframes. No server code is added:
payments use Stripe Payment Links, billing uses Stripe's hosted customer portal login
link, and the contact form posts to Web3Forms.

| Unit | Purpose | Depends on |
|---|---|---|
| `world-data.js` (rewritten) | The seven event definitions: date, caption, source URL, mapped offer, palette, wireframe id. Keeps `worldForStation()` so hub code is unaffected. | none |
| `wireframes.js` (new) | Registry of seven builders, each returning a three.js line-geometry group with an `update(t)` hook. One shared renderer and canvas. | three.js |
| `module-popup.js` (new) | Accessible dialog: wireframe canvas, offer name, description, three spec bullets, CTA. Focus trap, Esc to close. | `wireframes.js`, `content.js` |
| `world-journey.js` (trimmed) | Landing sequence: descend, show caption, open popup after the existing 2-second station hold, return rift. Chapter rendering removed. | the three above |
| `roi.js` (new) | Pure functions for the estimator. No DOM. | none |
| `briefing.js` (new) | Records visited stops and estimator inputs in `sessionStorage`; renders the mission brief; builds the booking and email handoff. | `roi.js` |
| `content.js` (edited) | Single source for offers, proof, tiers, contact and Stripe links. | none |

Each unit can be tested alone. `roi.js`, `briefing.js` and `world-data.js` get Node unit
tests in the existing `tests/*.test.cjs` style.

## 5. Event landings

Dates were checked against the sources listed on 2026-11-09.

| # | Station id | Date shown | Caption (one sentence) | Offer | Wireframe | Source |
|---|---|---|---|---|---|---|
| 1 | origin | Sep 30, 2012 | AlexNet is entered in the ImageNet challenge and beats the runner-up by more than ten points: machines learn to see. | AI Readiness Audit | Stacked scan planes resolving one highlighted bottleneck | image-net.org/challenges/LSVRC/2012 |
| 2 | mechanism | Mar 10, 2016 | In game two against Lee Sedol, AlphaGo plays Move 37, a move no human would have chosen. | Custom AI Agents | 19×19 lattice, one node lighting a path | blog.google AlphaGo match log |
| 3 | services | Jun 12, 2017 | "Attention Is All You Need" introduces the Transformer, the architecture everything since is built on. | Fractional AI Architecture | Encoder and decoder stacks joined by attention beams | arxiv.org/abs/1706.03762 |
| 4 | proof | Nov 22, 2022 | Meta's Cicero reaches human-level play in Diplomacy by negotiating in plain language. | AI Sales Systems | Funnel with deal nodes advancing stage to stage | Science, doi 10.1126/science.ade9097 |
| 5 | command | Nov 30, 2022 | ChatGPT launches as a free research preview and the interface makes the model matter. | Conversion Web Experiences | Browser frame assembling from scroll layers | OpenAI launch post |
| 6 | enterprise | Nov 25, 2024 | Anthropic open-sources the Model Context Protocol and agents plug into the tools where work lives. | Workflow Automation | Hub with connectors snapping into app nodes | anthropic.com/news/model-context-protocol |
| 7 | convergence | Today (live) | The next entry on this timeline is yours. | Briefing and booking | The visitor's selections assembling into a brief | n/a |

Note on stop 1: the ImageNet site lists Sep 30, 2012 as the submission deadline and
Oct 12 to 13 for the results presentation. The caption says "is entered" so the date is
exact.

Behavior per stop: the camera descends into a dark scene lit in the stop's palette with a
slow environmental wireframe; the date and caption appear; after the hold, the module
slides in. Closing it shows the return rift. Each module has one primary CTA: stops 1 to
6 add the offer to the brief and continue; stop 7 opens the brief.

Old `image` and `detailImage` fields and the 14 world `.webp` files are removed, which
cuts page weight. Hub panel copy in `content.js` `stops[]` is rewritten to match.

## 6. Google Doc review

The doc holds three overlapping proposals. Verdict per idea:

| Idea | Decision | Reason |
|---|---|---|
| ROI estimator with sliders | Adopt, in the second proposal's honest form | Inputs: team size, manual hours per person per week, loaded hourly cost (editable, default shown). Output: hours per year and a dollar figure, with the formula visible and the label "Illustration from your inputs, not a promised saving." Lives in stop 1's module and on `/services`. |
| Booking that carries context | Adopt | Stop 7 shows what the visitor explored and their estimator inputs, with "Book the briefing" (existing Google Calendar link), "Email this brief to Mark" (prefilled `mailto:`) and "Copy brief". Nothing is sent without a click. |
| Crawlable layer, JSON-LD, sitemap, llms.txt | Adopt | Each stop and offer also exists as real HTML in the page. Add Organization, Person and Service JSON-LD, `sitemap.xml`, `robots.txt`, `llms.txt`, canonical and Open Graph tags. `noindex` on `/portal`. |
| Non-3D fallback | Adopt | A flat, scrollable version of the same content for `prefers-reduced-motion`, small screens, and WebGL failure, plus a "Skip the journey" link. |
| Claims cleanup | Adopt | See section 7. |
| Orbit physics reacting to sliders | Defer | Cost is high and it adds no information for the buyer. |
| Live agent sandbox | Defer | Scripted telemetry shown as real execution is fake proof. If built later it must be labelled a simulation. |
| Clearance vault and mission cartridge | Defer | The brief in stop 7 covers the conversion purpose. |
| "Wired in 14 days", launch on Hacker News | Skip | An unconfirmed delivery promise, and not site work. |

## 7. Content and proof

Removed everywhere (`content.js`, `world-data.js`, hub copy, meta tags): "250+ AI
solutions", "16+ yrs", "15+ hrs saved per week", "$40K annual net liquidity", "near-10%
YoY", the anonymous Director of Staff quote, "90-day ROI guarantee or refund", "$12M+ in
proven B2B revenue impact" as a client result, and the "(Aug 2026)" stack label.

Replaced with two clearly separated groups:

- Founder's career record: $12M+ ARR generated; #2 national ranking; 750+ enterprise
  accounts.
- Built at MAB: 100+ AI agents; 300+ business automations.

Vault items are labelled "representative system patterns", not client deployments. The
`portalDemo` fixture ("Acme Ops Co", sample invoices) is deleted. The services page line
"30 minutes · free · ROI roadmap included" becomes "30 minutes · free" unless Mark
confirms the roadmap deliverable.

Branding: the nav's text mark is replaced by `assets/mab-logo.png` (the M lockup already
in the repo) at top left on every page.

## 8. Pages and billing

- `/about`, `/contact`, `/privacy`, `/terms`, `/refunds`: content ported from the current
  live site, restyled to `shared.css`. Old `.html` URLs keep working through `cleanUrls`
  plus explicit redirects.
- `/contact`: form with Name, Email and Reason, posting to Web3Forms, with a `mailto:`
  fallback if the request fails. Honeypot field for spam.
- `/portal` becomes "Client billing": one button to the Stripe customer portal login
  link (clients sign in by emailed code and see invoices, receipts and payment methods)
  and one to book time. No password field, no local auth.
- `/services`: tiers read prices and Payment Link URLs from `content.js`. A tier with no
  link renders "Book a call".
- Stripe setup, done only after Mark confirms the price sheet in writing: create
  Products, Prices and Payment Links in the live account, enable the customer portal
  login link, and set the business's public policy URLs to the new pages. Each object is
  listed for approval before creation because the account has no test mode.

## 9. Production hardening

- Security headers in `vercel.json`: Content-Security-Policy limited to self, the font
  hosts and the form endpoint; HSTS; `X-Content-Type-Options`; `Referrer-Policy`;
  `frame-ancestors 'none'`.
- three.js vendored into `assets/vendor/` at the pinned version instead of loading from
  a CDN.
- `intro.mp4` (9.6 MB) loads only after first paint with its poster shown first; world
  images removed; long-cache headers kept for `/assets`.
- Keyboard access for every stop and module, visible focus, labelled controls, contrast
  check on all palettes.
- Funnel events through Vercel Web Analytics (cookieless): journey start, stop visited,
  module opened, estimator used, brief opened, booking clicked, payment link clicked.
- A 404 page, favicon set and social preview image.

Threat model and data map. The site stores no personal data server-side. Estimator inputs
and visited stops stay in the visitor's `sessionStorage`. The contact form sends name,
email and message to Web3Forms, which forwards to Mark's inbox. Payment data is entered
only on Stripe's pages. Risks and controls: form spam (honeypot, provider rate limits);
script injection (CSP, no inline event handlers in new code, all dynamic text escaped);
secrets (none in the repo: Web3Forms access keys are public by design, Payment Links are
public URLs); clickjacking (`frame-ancestors`).

## 10. Testing

- Unit: `world-data` (seven events, valid ISO dates, each maps to an existing offer),
  `roi` (formula, bounds, zero and extreme inputs), `briefing` (state round trip, mailto
  encoding). Existing hub, hold and orbit tests stay green.
- Browser (existing Playwright harness): each stop lands, shows its caption, opens and
  closes its module; reduced-motion fallback renders all seven; responsive run at phone,
  tablet and desktop widths.
- Release checks on the preview URL: crawl for broken links; confirm no removed claim
  string remains (`grep` list from section 7); headers present; Lighthouse performance
  and accessibility recorded; contact form delivers a real message; each Payment Link
  opens the right product and price.

## 11. Cutover

1. Deploy the branch to a Vercel preview. Mark reviews it.
2. Mark approves in writing. Merge to `main` by pull request.
3. Production deploy of the solar project.
4. Move `mabaistrategies.com` and `www` from the current project to the solar project.
   DNS already resolves to Vercel, so no registrar change is expected.
5. Verify on the live domain: pages, redirects, form, payment links, certificate.
6. Rollback: reassign the domain to the old project, which stays untouched.

## 12. Inputs still needed from Mark

| Input | Blocks | Default if not supplied |
|---|---|---|
| Access to the Vercel account that owns `solar-system` and the domain | Steps 3 to 5 of cutover | Build and preview proceed in the connected team; cutover waits |
| One current price sheet, and which items sell online | Stripe objects, prices on `/services` | Tiers show "Book a call", no prices |
| Web3Forms access key | Contact form | Form falls back to `mailto:` |
| OK to port the three policy pages as written | `/privacy`, `/terms`, `/refunds` | Ported verbatim from the live site |
