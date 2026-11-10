// Release check against a running site. Usage: node tests/release-check.cjs <base-url>
// Crawls internal links, checks old URLs, security headers, banned strings and external links.
const assert = require('node:assert/strict');
const BANNED = require('./banned.cjs');

const base = (process.argv[2] || process.env.BASE_URL || 'http://127.0.0.1:8765').replace(/\/$/, '');
const origin = new URL(base).origin;
const LEGAL = new Set(['/privacy', '/terms', '/refunds']);
const OLD = { '/services.html': '/services', '/about.html': '/about', '/contact.html': '/contact',
  '/privacy-policy.html': '/privacy', '/terms-of-service.html': '/terms', '/refund-policy.html': '/refunds' };
const HEADERS = ['strict-transport-security', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'content-security-policy'];

// COOKIE lets the check run against a Vercel preview behind deployment protection.
const cookie = process.env.COOKIE;
const get = (url, opts = {}) => fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20_000), ...opts,
  headers: { ...(cookie && url.startsWith(origin) ? { cookie } : {}), ...(opts.headers || {}) } });

(async () => {
  const failures = [];
  const fail = (m) => failures.push(m);
  const seen = new Set();
  const queue = ['/'];
  const external = new Set();
  const assets = new Set();

  while (queue.length) {
    const p = queue.shift();
    if (seen.has(p)) continue;
    seen.add(p);
    const res = await get(base + p);
    if (res.status !== 200) { fail(`${p} -> ${res.status}`); continue; }
    const html = await res.text();
    if (!LEGAL.has(p)) for (const s of BANNED) if (html.includes(s)) fail(`${p} contains "${s}"`);
    for (const m of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
      const raw = m[1];
      if (/^(mailto:|tel:|data:)/.test(raw)) continue;
      const url = new URL(raw, base + p);
      if (url.origin !== origin) { if (/^https:/.test(url.href) && !/(^|\.)mabaistrategies\.com$/.test(url.host) && !/fonts\.(googleapis|gstatic)\.com/.test(url.host)) external.add(url.href); continue; }
      if (/\.[a-z0-9]{2,5}$/i.test(url.pathname) && !url.pathname.endsWith('.html')) assets.add(url.pathname);
      else queue.push(url.pathname);
    }
  }
  assert.ok(seen.size >= 9, `crawl found ${seen.size} pages`);

  for (const a of assets) {
    const res = await get(base + a, { method: 'GET' });
    if (res.status !== 200) fail(`asset ${a} -> ${res.status}`);
    else if (/\.(js|css)$/.test(a) && !a.startsWith('/assets/vendor/')) {
      const text = await res.text();
      for (const s of BANNED) if (text.includes(s)) fail(`${a} contains "${s}"`);
    }
  }
  for (const [from, to] of Object.entries(OLD)) {
    const res = await get(base + from);
    const landed = new URL(res.url).pathname;
    if (res.status !== 200 || landed !== to) fail(`${from} -> ${res.status} ${landed}, expected ${to}`);
  }
  for (const f of ['/robots.txt', '/sitemap.xml', '/llms.txt']) {
    const res = await get(base + f);
    if (res.status !== 200) fail(`${f} -> ${res.status}`);
  }
  const missing = await get(base + '/definitely-not-a-page');
  if (missing.status !== 404) fail(`unknown path -> ${missing.status}, expected 404`);

  const home = await get(base + '/');
  for (const h of HEADERS) if (!home.headers.get(h)) fail(`missing header ${h}`);

  // External links: reachable. Some sites refuse bots (LinkedIn 999, X 403); those are noted, not failed.
  const notes = [];
  for (const url of external) {
    try {
      const res = await get(url, { headers: { 'user-agent': 'Mozilla/5.0 (release-check)' } });
      if ([999, 403, 429, 503].includes(res.status)) notes.push(`${url} -> ${res.status} (bot-blocked, check by hand)`);
      else if (res.status >= 400) fail(`external ${url} -> ${res.status}`);
    } catch (e) {
      notes.push(`${url} -> ${e.name} (could not reach from here, check by hand)`);
    }
  }

  console.log(`pages: ${[...seen].sort().join(' ')}`);
  console.log(`assets checked: ${assets.size}, external links: ${external.size}`);
  notes.forEach((n) => console.log('note: ' + n));
  if (failures.length) { failures.forEach((f) => console.error('FAIL: ' + f)); process.exit(1); }
  console.log('release-check.cjs: PASS');
})().catch((e) => { console.error(e); process.exit(1); });
