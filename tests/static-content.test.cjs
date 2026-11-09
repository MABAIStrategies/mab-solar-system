const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const BANNED = require('./banned.cjs');
const { WORLD_DEFS } = require('../world-data.js');

const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

// Generated regions match their data.
execFileSync(process.execPath, [path.join(root, 'scripts', 'build-static.cjs'), '--check'], { stdio: 'pipe' });

const index = read('index.html');
for (const w of WORLD_DEFS) {
  if (w.live) assert.ok(index.includes('data-live-date'), 'live stop has a date slot');
  else assert.ok(index.includes(`<time datetime="${w.dateISO}">`), `${w.stationId} date is in the page`);
}
const vm = require('node:vm');
const box = { window: {} };
vm.runInNewContext(read('content.js'), box);
const MAB = box.window.MAB;
for (const offer of MAB.offers) assert.ok(index.includes(`<h3>${offer.name}</h3>`), `${offer.name} is in the page`);
assert.equal((index.match(/class="tl-stop"/g) || []).length, 7, 'seven crawlable stops');
const ld = [...index.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
assert.equal(ld.length, 3, 'three JSON-LD blocks');
assert.deepEqual(ld.map((d) => d['@type'] || 'graph'), ['Organization', 'Person', 'graph']);
assert.equal(ld[2]['@graph'].length, 6, 'one Service per paid offer');
assert.ok(index.includes('<link rel="canonical" href="https://mabaistrategies.com/">'));
assert.ok(index.indexOf('"flat.js"') < index.indexOf('<style>'), 'flat mode is decided before first paint');

const PAGES = ['index', 'services', 'command', 'about', 'contact', 'portal', 'privacy', 'terms', 'refunds', '404'];
for (const name of PAGES) {
  const html = read(`${name}.html`);
  assert.ok(html.includes('class="site-nav"') && html.includes('class="site-footer"'), `${name} has nav and footer`);
  assert.ok(html.includes('/assets/mab-logo-256.png'), `${name} shows the logo`);
  assert.ok(/<title>[^<]{8,}<\/title>/.test(html) && /<meta name="description" content="[^"]{10,}"/.test(html), `${name} has title and description`);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${name} has exactly one h1`);
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.ok(m[0].includes('rel="noopener"'), `${name}: new-tab link has rel=noopener`);
  assert.ok(!/\son[a-z]+="/.test(html), `${name} has no inline event handlers`);
  assert.ok(!/href="[a-z-]+\.html"/.test(html), `${name} uses clean URLs`);
}
for (const name of ['portal', '404']) assert.ok(read(`${name}.html`).includes('content="noindex"'), `${name} is noindex`);
for (const name of ['portal', 'command']) {
  const html = read(`${name}.html`);
  for (const gone of ['localStorage', 'password', '4242']) assert.ok(!html.includes(gone), `${name} has no ${gone}`);
}
const services = read('services.html');
assert.ok(services.includes('id="tiers"') && services.includes('id="standalone"') && services.includes('id="estimator"'));

// Legal wording is ported unchanged: spot-check sentences from the live pages.
assert.ok(read('refunds.html').includes('Refund requests must be submitted in writing within 14 calendar days of the disputed invoice date.'));
assert.ok(read('terms.html').includes('no specific business result is guaranteed unless expressly stated in writing'));
assert.ok(read('privacy.html').includes('we cannot guarantee absolute security'));

// Banned strings: first-party shipped files, minus the three legal pages.
const skip = new Set(['privacy.html', 'terms.html', 'refunds.html']);
const shipped = fs.readdirSync(root).filter((f) => /\.(html|js|css|txt|xml|json)$/.test(f) && !skip.has(f) && !/^package/.test(f));
assert.ok(shipped.length > 20, 'scan covers the site');
for (const file of shipped) {
  const text = read(file);
  for (const s of BANNED) assert.ok(!text.includes(s), `${file} contains banned string "${s}"`);
}

// Old URLs keep working.
const vercel = JSON.parse(read('vercel.json'));
assert.equal(vercel.cleanUrls, true);
assert.deepEqual(
  Object.fromEntries(vercel.redirects.map((r) => [r.source, r.destination])),
  { '/privacy-policy': '/privacy', '/terms-of-service': '/terms', '/refund-policy': '/refunds' }
);
assert.ok(vercel.redirects.every((r) => r.permanent === true));
const csp = vercel.headers[0].headers.find((h) => h.key === 'Content-Security-Policy').value;
assert.ok(csp.includes("frame-ancestors 'none'") && csp.includes("default-src 'self'"));
assert.ok(!/unpkg|jsdelivr|cdnjs/.test(csp + index), 'no third-party script hosts');

const sitemap = read('sitemap.xml');
for (const url of ['/', '/services', '/command', '/about', '/contact', '/privacy', '/terms', '/refunds']) {
  assert.ok(sitemap.includes(`<loc>https://mabaistrategies.com${url}</loc>`), `sitemap lists ${url}`);
}
assert.ok(!sitemap.includes('/portal'), 'billing page is not in the sitemap');
assert.ok(read('robots.txt').includes('Sitemap: https://mabaistrategies.com/sitemap.xml'));
for (const asset of ['mab-logo.png', 'mab-logo-256.png', 'mark-bockrath.jpg', 'og.jpg', 'icon-32.png', 'icon-180.png', 'icon-192.png']) {
  assert.ok(fs.statSync(path.join(root, 'assets', asset)).size > 500, `${asset} exists`);
}
console.log('static-content.test.cjs: PASS');
