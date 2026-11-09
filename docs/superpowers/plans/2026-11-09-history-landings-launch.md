# History Landings and Production Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-theme the seven landings as dated AI-history events that each introduce one MAB offer, add the estimator and briefing handoff, clean the proof, carry over the live site's pages, wire Stripe-hosted billing, and cut mabaistrategies.com over to this site.

**Architecture:** Static site, vanilla JS, no build step, deployed on Vercel. New logic lives in small UMD modules (same wrapper as `world-data.js`) so Node can unit test them. three.js 0.160 is reused for wireframes. No server code: Stripe Payment Links and Stripe's hosted customer portal handle money.

**Tech Stack:** HTML, CSS, vanilla JS, three.js 0.160.0, Node `assert` tests (`tests/*.test.cjs`), Playwright (`playwright-core`), Vercel, Stripe.

**Spec:** `docs/superpowers/specs/2026-11-09-history-landings-launch-design.md` (section 13 amendments override earlier sections).

## Global Constraints

- Branch `feat/history-landings-launch`. No commits to `main`, no force push. Merge by pull request.
- Commit style: imperative, about 60 characters, no emoji, no Co-authored-by line.
- No build step, no new runtime dependencies. three.js is vendored at 0.160.0.
- Space scene, hub scroll, warp and planet appearance are not changed. Each world keeps its `theme` value.
- Banned strings anywhere in shipped files: `250+`, `16+`, `15+ hrs`, `15 hours`, `$40K`, `$40,000`, `10% `, `Director of Staff`, `guarantee`, `or refund`, `won't be billed`, `proven B2B revenue impact`, `Aug 2026`, `Acme Ops`, `mab-client`, `Demo password`, `TEST MODE`, `Export code`. The scan covers first-party HTML, CSS and JS only: it skips `assets/vendor/` and the three legal pages, whose wording is ported unchanged.
- Proof wording, exact: career group "$12M+ ARR generated", "#2 national ranking", "750+ enterprise accounts"; built group "100+ AI agents", "300+ business automations". No former employer is named.
- Prices, exact: Foundation `$2,500` / month; Accelerator `$5,500` / month; Principal `Custom`; AI Readiness Audit `$2,000`; Single Workflow or Agent `$3,500+`; Keynote / Workshop / Board `Custom`. Keep "Billed monthly, cancel anytime after 90 days."
- Copy follows `true-voice.md`: plain words, diagnosis before pitch, none of its suppressed phrases.
- Logo is the M lockup at top left of every page. No healthcare or telecom focus language.
- All dynamic text goes through `escapeHtml`. No inline event handlers in new code.
- Production deploy, domain move and every Stripe write wait for Mark's explicit go.
- Verizon firewall: never read or write any path named Verizon or verizon-protected.

## Review Focus

1. WebGL missing or the context is lost mid-visit: all seven stops, captions and offers must still be readable in the flat layout. Test in Task 7.
2. Estimator fed blanks, letters, negatives or absurd values: outputs stay finite numbers, never `NaN` or `Infinity`. Test in Task 2.
3. `sessionStorage` blocked (private mode, strict settings): the brief still works for the visit. Test in Task 3.
4. Brief text containing `&`, quotes, line breaks and emoji sent through `mailto:`: correctly encoded and capped so mail clients accept it. Test in Task 3.
5. Old inbound URLs (`/services.html`, `/about.html`, `/contact.html`, `/privacy-policy.html`, `/terms-of-service.html`, `/refund-policy.html`): each resolves to the new page. Test in Task 10.

---

### Task 1: Event data and content source of truth

**Files:**
- Modify: `world-data.js` (full rewrite of `WORLD_DEFS`), `content.js`
- Test: `tests/world-data.test.cjs` (rewrite), create `tests/content.test.cjs`
- Modify: `package.json` (`test:unit` adds `content.test.cjs`)

**Interfaces:**
- Produces `MABWorldData.WORLD_DEFS: Array<{stationId, theme, order, dateISO: string|null, dateLabel, caption, sourceUrl: string|null, offerId, wireframe, palette:{ink,accent,glow,shadow}, live?: true}>` and `worldForStation(id)`.
- Produces on `window.MAB`: `offers: Array<{id, name, blurb, specs: string[3]}>`, `proof: {career: string[], built: string[]}`, `tiers[]` and `standalone[]` each with `payLink: string|null`, `billing: {portalLoginUrl: string|null}`, `contact`, `stops[]`, `vaultItems[]`.

Event rows, in order (`stationId` / `theme` / `dateISO` / `offerId` / `wireframe`), captions verbatim from spec section 5:

| stationId | theme | dateISO | offerId | wireframe |
|---|---|---|---|---|
| origin | arctic | 2012-09-30 | audit | scan |
| mechanism | lava | 2016-03-10 | agents | lattice |
| services | ocean | 2017-06-12 | architecture | transformer |
| proof | desert | 2022-11-22 | sales | funnel |
| command | jungle | 2022-11-30 | web | browser |
| enterprise | city | 2024-11-25 | automation | hub |
| convergence | singularity | null (`live: true`) | briefing | brief |

- [ ] **Step 1: Rewrite `tests/world-data.test.cjs`**

```js
assert.equal(WORLD_DEFS.length, 7);
assert.deepEqual(WORLD_DEFS.map(w => w.stationId),
  ['origin','mechanism','services','proof','command','enterprise','convergence']);
assert.deepEqual(WORLD_DEFS.map(w => w.theme),
  ['arctic','lava','ocean','desert','jungle','city','singularity']);
assert.deepEqual(WORLD_DEFS.map(w => w.dateISO),
  ['2012-09-30','2016-03-10','2017-06-12','2022-11-22','2022-11-30','2024-11-25',null]);
for (const w of WORLD_DEFS) {
  assert.ok(w.caption && !/\n/.test(w.caption));          // one sentence
  assert.equal((w.caption.match(/[.!?](\s|$)/g) || []).length, 1);
  assert.ok(!('chapters' in w) && !('image' in w));
  assert.ok(w.live || /^https:\/\//.test(w.sourceUrl));
}
const dated = WORLD_DEFS.filter(w => w.dateISO).map(w => w.dateISO);
assert.deepEqual(dated, [...dated].sort());                 // chronological
assert.equal(worldForStation('missing'), null);
```

- [ ] **Step 2: Write `tests/content.test.cjs`** (loads `content.js` with a stub `window`)

```js
const ids = MAB.offers.map(o => o.id);
assert.deepEqual(ids, ['audit','agents','architecture','sales','web','automation','briefing']);
for (const w of WORLD_DEFS) assert.ok(ids.includes(w.offerId));
for (const o of MAB.offers) assert.equal(o.specs.length, 3);
assert.deepEqual(MAB.proof.career, ['$12M+ ARR generated','#2 national ranking','750+ enterprise accounts']);
assert.deepEqual(MAB.proof.built, ['100+ AI agents','300+ business automations']);
assert.deepEqual(MAB.tiers.map(t => t.price), ['$2,500','$5,500','Custom']);
assert.deepEqual(MAB.standalone.map(s => s.price), ['$2,000','$3,500+','Custom']);
assert.ok(!('portalDemo' in MAB) && !('quote' in MAB) && !('stats' in MAB));
const blob = JSON.stringify(MAB);
for (const s of BANNED) assert.ok(!blob.includes(s), s);   // BANNED = Global Constraints list
```

- [ ] **Step 3: Run `npm run test:unit`.** Expected: both new tests FAIL.
- [ ] **Step 4: Rewrite `WORLD_DEFS`** from the table. Palettes carry over from the current file per `theme`.
- [ ] **Step 5: Edit `content.js`.** Add `offers` (names from the current `services` list plus `briefing`; three specs each), `proof`, `standalone`, `billing`, `payLink: null` on every tier. Delete `stats`, `quote`, `portalDemo`, `phases`. Rewrite `heroSub`, `about.paras`, `stops[]` copy to match the events and the proof rule. Remove the guarantee feature line. Drop the "(Aug 2026)" framing from `stack`.
- [ ] **Step 6: Run `npm test`.** Expected: PASS (hub and journey tests may fail on removed fields; if so they are fixed in Task 6, so run only `world-data` and `content` here).
- [ ] **Step 7: Commit** `Replace world themes with AI history event data`

### Task 2: ROI estimator logic

**Files:** Create `roi.js`, `tests/roi.test.cjs`. Modify `package.json` test scripts (`test:unit`, `test:syntax`).

**Interfaces:**
- Produces `MABRoi.DEFAULTS = {teamSize: 10, hoursPerWeek: 3, hourlyCost: 50, weeksPerYear: 48}`, `MABRoi.LIMITS = {teamSize:[1,1000], hoursPerWeek:[0,40], hourlyCost:[0,500]}`, and `MABRoi.estimate(input) -> {inputs, hoursPerYear, dollarsPerYear, formula: string}`. Formula: `teamSize × hoursPerWeek × weeksPerYear`, then `× hourlyCost`. Non-numeric input falls back to the default; values clamp to limits; results round to whole numbers.

- [ ] **Step 1: Write the failing test**

```js
assert.deepEqual(pick(estimate({teamSize:10,hoursPerWeek:3,hourlyCost:50})), {hoursPerYear:1440, dollarsPerYear:72000});
assert.equal(estimate({}).hoursPerYear, 1440);                       // defaults
assert.equal(estimate({teamSize:'abc'}).inputs.teamSize, 10);        // fallback
assert.equal(estimate({teamSize:-5}).inputs.teamSize, 1);            // clamp low
assert.equal(estimate({teamSize:1e9, hoursPerWeek:999, hourlyCost:1e9}).dollarsPerYear, 1000*40*48*500);
assert.equal(estimate({hoursPerWeek:0}).dollarsPerYear, 0);
for (const v of [NaN, Infinity, null, undefined, '', '  ', {}, []])
  assert.ok(Number.isFinite(estimate({teamSize:v,hoursPerWeek:v,hourlyCost:v}).dollarsPerYear));
assert.match(estimate({}).formula, /10 × 3 × 48/);
```

- [ ] **Step 2: Run** `node tests/roi.test.cjs`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `roi.js`** with the UMD wrapper used by `world-data.js`.
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit** `Add ROI estimator logic`

### Task 3: Briefing state and handoff

**Files:** Create `briefing.js`, `tests/briefing.test.cjs`. Modify `package.json` test scripts.

**Interfaces:**
- Consumes `MABRoi.estimate` output shape.
- Produces `MABBriefing.create(storage?) -> {visit(stationId), addOffer(offerId), setEstimate(est), state() -> {visited: string[], offers: string[], estimate: object|null}, toText(lookup) -> string, mailtoHref(email, lookup) -> string, clear()}`. `lookup` is `{offerName(id), stopLabel(id)}`. Storage key `mab_brief_v1`. If `storage` is missing or throws, state is kept in memory. `mailtoHref` caps the encoded body at 1800 characters, cutting on a line boundary.

- [ ] **Step 1: Write the failing test**

```js
const b = create(fakeStorage());
b.visit('origin'); b.visit('origin'); b.addOffer('audit'); b.addOffer('sales');
assert.deepEqual(b.state().visited, ['origin']);                       // no duplicates
assert.deepEqual(create(sameStorage).state().offers, ['audit','sales']); // round trip
const throwing = { getItem(){ throw new Error('blocked'); }, setItem(){ throw new Error('blocked'); } };
const m = create(throwing); m.addOffer('audit');
assert.deepEqual(m.state().offers, ['audit']);                         // memory fallback
const href = b.mailtoHref('mark@mabaistrategies.com', { offerName: () => 'R&D "Audit"\nline 🚀', stopLabel: x => x });
assert.ok(href.startsWith('mailto:mark@mabaistrategies.com?subject='));
assert.ok(!/[\n"& ]/.test(href.split('?')[1].replace(/&body=/, '')));  // fully encoded
assert.doesNotThrow(() => decodeURIComponent(href.split('body=')[1]));
for (let i = 0; i < 400; i++) b.addOffer('offer-' + i);
assert.ok(b.mailtoHref('a@b.co', lookup).split('body=')[1].length <= 1800);
assert.doesNotThrow(() => decodeURIComponent(b.mailtoHref('a@b.co', lookup).split('body=')[1]));
create({ getItem: () => '{not json' }).state();                        // corrupt data does not throw
```

- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement.** **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `Add briefing state and booking handoff`

### Task 4: Wireframe builders

**Files:** Create `wireframes.js`, `tests/wireframes.test.cjs`. Add `assets/vendor/three.min.js` (from `npm pack three@0.160.0`, file `build/three.min.js`). Modify `index.html` loader to use the vendored path. Modify `package.json`.

**Interfaces:**
- Produces `MABWireframes.IDS = ['scan','lattice','transformer','funnel','browser','hub','brief']` and `MABWireframes.build(id, THREE, opts?: {accent: string, glow: string}) -> {group: THREE.Group, update(tSeconds: number): void, dispose(): void}`. Unknown id returns the `scan` wireframe. Each uses only `LineSegments`, `Line` and `Points`, under 4,000 vertices.

Shapes: `scan` five stacked grid planes with one cell pulsing; `lattice` 19×19 grid with one node tracing a path; `transformer` two stacks of six boxes joined by animated beams; `funnel` four narrowing rings with points advancing downward; `browser` a window frame whose inner panels slide in; `hub` central icosahedron with eight connectors extending to cubes; `brief` loose lines converging into a document outline.

- [ ] **Step 1: Write the failing test** (Node, with `require('./assets/vendor/three.min.js')`)

```js
for (const id of IDS) {
  const w = build(id, THREE, { accent: '#55ddff', glow: '#ffffff' });
  assert.ok(w.group.isGroup && w.group.children.length > 0, id);
  let verts = 0; w.group.traverse(o => { if (o.geometry) verts += o.geometry.attributes.position.count; });
  assert.ok(verts > 0 && verts < 4000, id);
  assert.doesNotThrow(() => { w.update(0); w.update(12.5); w.dispose(); }, id);
}
assert.ok(build('nope', THREE).group.children.length > 0);
```

- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Vendor three.js and implement the seven builders.** **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `Add 3D wireframe builders and vendor three.js`

### Task 5: Offer module popup

**Files:** Create `module-popup.js`. Modify `worlds.css` (module styles), `index.html` (script tags, dialog root). Test: `tests/e2e-world-journey.cjs` (extended in Task 6).

**Interfaces:**
- Consumes `MABWireframes.build`, `MAB.offers`, `MABRoi`, `MABBriefing`.
- Produces `MABModule.open({world, offer, briefing, onClose}) -> void`, `MABModule.close()`, `MABModule.isOpen() -> boolean`. Root is `<div role="dialog" aria-modal="true" aria-labelledby="module-title">`. Contents: wireframe canvas, offer name, blurb, three specs, one primary button. For `offer.id === 'audit'` it also renders the estimator (three range inputs bound to `MABRoi`, the formula line, and the label "Illustration from your inputs, not a promised saving."). For `briefing` it renders the brief text with three actions: "Book the briefing" (`MAB.contact.cal`, new tab), "Email this brief to Mark" (`mailtoHref`), "Copy brief". Primary button on other offers: "Add to my brief", which calls `briefing.addOffer` then closes. Esc closes. Focus is trapped and returns to the opener. One shared renderer, disposed on close; rendering pauses when the tab is hidden.

- [ ] **Step 1: Implement `module-popup.js`** to the interface above.
- [ ] **Step 2: Add styles** scoped under `.mab-module`, using the world palette custom properties.
- [ ] **Step 3: Run** `npm run test:syntax` after adding `module-popup.js` to it. Expected: no errors.
- [ ] **Step 4: Commit** `Add offer module dialog with wireframe and estimator`

### Task 6: Landing sequence

**Files:** Modify `world-journey.js`, `worlds.css`, `hub.js` (panel copy only where it reads removed fields), `tests/world-journey.test.cjs`, `tests/hub-topology.test.cjs`, `tests/e2e-world-journey.cjs`. Delete `assets/worlds/*.webp`, `assets/worlds/candidates`, `assets/worlds/sources`, the two sheet JPGs, `assets/research`, `scripts/fetch_world_assets.py`.

**Interfaces:**
- Consumes `MABWorldData`, `MABModule`, `MABBriefing`, `MABStationHold`.
- Keeps `window.MABWorldJourney.open(stationId)` and `.close(reason)` unchanged for `hub.js`.

Behavior: on `open`, set palette properties, show the environmental wireframe (same builder, larger, dimmed) behind a `.world-caption` block containing `<time datetime="{dateISO}">{dateLabel}</time>` and the caption. For the `live` stop, `dateLabel` is the visitor's local date formatted `Mon D, YYYY` and `datetime` is today's ISO date. Call `briefing.visit(stationId)`. After the 2-second station hold, call `MABModule.open`. When the module closes, show the existing return rift. Remove `renderNarrative`, the image layers, `preload`, and the eight themed `.world-fx` blocks with their CSS. "PLANETARY FIELD JOURNEY" becomes "AI HISTORY · " plus the year.

- [ ] **Step 1: Update unit tests** to assert the journey no longer references `chapters`, `image` or `detailImage`, and that hub topology still has seven stations in the existing order.
- [ ] **Step 2: Extend `tests/e2e-world-journey.cjs`**: for each of the seven stations, open it, assert `.world-caption time` has the expected `datetime` (today for `convergence`), assert `[role=dialog]` appears within 4 seconds and contains the mapped offer name, press Esc, assert the dialog is gone and focus returned. For `origin`, set the first range input and assert the dollar output changes and contains no `NaN`. For `convergence`, assert the brief lists `origin` after visiting it.
- [ ] **Step 3: Run** `npm test` and `npm run test:e2e`. Expected: e2e FAIL.
- [ ] **Step 4: Implement the changes** and delete the retired assets.
- [ ] **Step 5: Run** both again. Expected: PASS.
- [ ] **Step 6: Commit** `Replace themed landings with event captions and offer modules`

### Task 7: Crawlable content and flat fallback

**Files:** Modify `index.html`, `shared.css`, `worlds.css`. Create `flat.js`, `robots.txt`, `sitemap.xml`, `llms.txt`, `404.html`. Test: `tests/e2e-responsive.cjs`, create `tests/static-content.test.cjs`.

**Interfaces:**
- Produces `MABFlat.shouldUse() -> boolean` (true when `prefers-reduced-motion: reduce`, viewport width under 720 px, `?flat=1`, or WebGL context creation fails) and `MABFlat.enable()`, which adds `html.flat` and stops the scene from booting. Also call `enable()` on a `webglcontextlost` event.

`index.html` gains a `<section id="timeline">` holding all seven stops as real HTML (`<article>` with `<time>`, caption, offer name, blurb, specs, CTA). It is visually hidden when the 3D journey runs and is the page when `html.flat` is set. Add a "Skip the journey" link as the first focusable element. Head: canonical, Open Graph and Twitter tags, JSON-LD for `Organization`, `Person` (Mark Bockrath, Founder and CEO) and one `Service` per offer. `sitemap.xml` lists `/`, `/services`, `/command`, `/about`, `/contact`, `/privacy`, `/terms`, `/refunds`. `/portal` gets `<meta name="robots" content="noindex">`.

- [ ] **Step 1: Write `tests/static-content.test.cjs`**: parse `index.html` as text and assert it contains all seven `datetime` values or the `live` marker, all seven offer names, three `application/ld+json` blocks that `JSON.parse` cleanly, a canonical link, and none of the banned strings. Assert `portal.html` contains `noindex`.
- [ ] **Step 2: Extend `tests/e2e-responsive.cjs`**: at 390 px width, with `reducedMotion: 'reduce'`, and with `?flat=1`, assert `html.flat` is set, no `canvas#space-canvas` is rendered, and seven `#timeline article` elements are visible. Add a case that dispatches `webglcontextlost` on desktop and asserts the same.
- [ ] **Step 3: Run.** Expected: FAIL. **Step 4: Implement.** **Step 5: Run.** Expected: PASS.
- [ ] **Step 6: Commit** `Add crawlable timeline, flat fallback and SEO files`

### Task 8: Services, Command and billing pages

**Files:** Modify `services.html`, `command.html`, `portal.html`, `shared.css`.

**Interfaces:** Consumes `MAB.tiers`, `MAB.standalone`, `MAB.billing`, `MAB.proof`, `MABRoi`.

- `services.html`: render tiers and standalone engagements from `content.js`. Button is `payLink` (label "Start now", new tab) when set, otherwise the calendar link (label "Book a call"). Add the estimator block and the two proof groups with headings "Founder's career record" and "Built at MAB". "30 minutes · free · ROI roadmap included" stays (the live site and Mark's own positioning both state it).
- `command.html`: delete the lock banner, unlock modal and all `localStorage` auth. Heading kicker becomes "REPRESENTATIVE SYSTEM PATTERNS". Every card is fully visible. Card CTA: "Walk me through this" to the calendar.
- `portal.html`: retitle "Client billing". Body: one button "Manage billing" to `MAB.billing.portalLoginUrl` (rendered only when set; otherwise a line with the billing email link) and one "Book time with Mark". Delete the login form, dashboard and mock card sheet.
- Nav on every page: logo image at left, links Journey, Services, Systems, About, Client billing, and the Briefing button.

- [ ] **Step 1: Add assertions to `tests/static-content.test.cjs`**: `portal.html` and `command.html` contain no `localStorage`, `password` or `4242`; `services.html` contains `id="tiers"` and `id="standalone"`.
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement.** **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `Rebuild services, systems and billing pages`

### Task 9: Carried-over pages and brand assets

**Files:** Create `about.html`, `contact.html`, `privacy.html`, `terms.html`, `refunds.html`. Replace `assets/mab-logo.png` with the attached 1254 px lockup; add `assets/mab-logo-256.png` (nav size) and `assets/mark-bockrath.jpg` (headshot, 800 px wide, under 150 KB). Add favicon files and `assets/og.jpg` (1200×630, logo on the site background).

Source files: `/home/claude/scratch/brand/mab-logo-1254.png`, `/home/claude/scratch/brand/mark-headshot.png`. Page text comes from the live site at `mabaistrategies.com/about.html`, `/contact.html`, `/privacy-policy.html`, `/terms-of-service.html`, `/refund-policy.html`.

- [ ] **Step 1: Fetch the five live pages** and save their main text to `/home/claude/scratch/live/`.
- [ ] **Step 2: Build the three legal pages** with wording unchanged, in the `shared.css` page shell. If `refund-policy` restates the removed guarantee, stop and list the sentences for Mark; do not edit them.
- [ ] **Step 3: Build `about.html`** from the live About text, edited to the proof rule and voice guide, with the headshot.
- [ ] **Step 4: Build `contact.html`** with email, calendar, LinkedIn and X from `MAB.contact`. No form.
- [ ] **Step 5: Resize and place the logo, headshot, favicons and social image.**
- [ ] **Step 6: Run** `npm test`. Expected: PASS (static-content test extended to check each new file exists and has the nav).
- [ ] **Step 7: Commit** `Port about, contact and legal pages and update brand assets`

### Task 10: Hardening

**Files:** Modify `vercel.json`, `index.html` (deferred intro video, vendored script), `.vercelignore` (add `docs`), `README.md`, `ASSET-CREDITS.md`. Create `tests/release-check.cjs`.

`vercel.json` additions:
- Redirects (permanent): `/privacy-policy` to `/privacy`, `/terms-of-service` to `/terms`, `/refund-policy` to `/refunds`. `cleanUrls` already maps the `.html` forms.
- Headers on `/(.*)`: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; connect-src 'self' https://vitals.vercel-insights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`.
- Analytics: add the Vercel Web Analytics script and a `track(name, props)` helper in `shared` code; fire `journey_start`, `stop_visited`, `module_opened`, `estimator_used`, `brief_opened`, `booking_clicked`, `paylink_clicked`.
- Intro video: `preload="none"`, poster first, source attached after `load`.

- [ ] **Step 1: Write `tests/release-check.cjs`**, taking a base URL argument. It crawls from `/` following same-origin links and asserts: every internal URL returns 200; each of the six old URLs in Review Focus item 5 ends on the right new path; the five security headers are present on `/`; no response body contains a banned string; every `https://` external link returns below 400 (LinkedIn's 999 is allowed).
- [ ] **Step 2: Run** against `npm run serve` for the crawl and banned-string parts. Expected: FAIL until implemented.
- [ ] **Step 3: Implement.** **Step 4: Run** `npm test`, `npm run test:browser`, and the release check locally. Expected: PASS except header and redirect checks, which need Vercel.
- [ ] **Step 5: Commit** `Add security headers, redirects, analytics and release check`

### Task 11: Preview deploy and review

- [ ] **Step 1: Push the branch** and open a pull request to `main`. Requires push access (GitHub connector, `MABAIStrategies/mab-solar-system`).
- [ ] **Step 2: Get the Vercel preview URL** for the branch from the `solar-system` project in team `mab-ai-strategies`.
- [ ] **Step 3: Run** `node tests/release-check.cjs <preview-url>`. Expected: PASS on all checks.
- [ ] **Step 4: Record Lighthouse** performance and accessibility for `/` and `/services` in `qa/report.md`. Accessibility below 95 is fixed before review.
- [ ] **Step 5: Send Mark the preview URL** with the QA summary. Wait for his go.

### Task 12: Stripe (live account, gated)

Account `acct_1SUDVzLDY8sl8GVC`, live mode. Objects to create, shown to Mark as a list for a yes before any write:

| Product | Price | Payment Link |
|---|---|---|
| AI Readiness Audit | $2,000 one time | yes |
| Foundation Retainer | $2,500 per month | yes |
| Accelerator Retainer | $5,500 per month | yes |
| Single Workflow or Agent, Principal, Keynote | none | no, book a call |

- [ ] **Step 1: Present the table and get Mark's yes.**
- [ ] **Step 2: Create the three Products, Prices and Payment Links.** After-payment redirect: `https://mabaistrategies.com/portal?paid=1`.
- [ ] **Step 3: Enable the customer portal login link** (invoices, payment methods, no plan switching) and set the public policy URLs to `/terms`, `/privacy`, `/refunds`.
- [ ] **Step 4: Put the four URLs in `content.js`** (`payLink` on three entries, `billing.portalLoginUrl`). Run `npm test`. Commit `Add Stripe payment and billing links`.
- [ ] **Step 5: Open each link on the preview** and confirm product name and amount. Do not complete a payment.

### Task 13: Cutover (gated)

- [ ] **Step 1: Mark approves the preview in writing.** Merge the pull request.
- [ ] **Step 2: Confirm the production deployment** of `solar-system` is ready and serves the merged commit.
- [ ] **Step 3: Record where `mabaistrategies.com` and `www` are attached now** (project name and team) for rollback.
- [ ] **Step 4: Move both hostnames to `solar-system`.** `www` redirects to the apex. If Vercel asks for new DNS records, give Mark the exact records for the DNS host that is authoritative (check the NS records first; it is Namecheap or Cloudflare).
- [ ] **Step 5: Run** `node tests/release-check.cjs https://mabaistrategies.com`. Expected: PASS, valid certificate.
- [ ] **Step 6: Update `README.md`** (drop "pre-production"), set the repo homepage to the domain.
- [ ] **Rollback:** reattach both hostnames to the project recorded in Step 3.
