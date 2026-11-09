// Flat fallback and the standard pages, at phone and desktop widths.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { launch, watch, BASE_URL } = require('./browser.cjs');

const qaDir = path.join(__dirname, '..', 'qa', 'screenshots');
fs.mkdirSync(qaDir, { recursive: true });
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const DESKTOP = { viewport: { width: 1440, height: 900 } };

async function assertFlat(page, label) {
  await page.waitForFunction(() => document.documentElement.classList.contains('flat'), null, { timeout: 15_000 });
  const state = await page.evaluate(() => ({
    canvas: getComputedStyle(document.querySelector('#space-canvas')).display,
    intro: getComputedStyle(document.querySelector('#intro')).display,
    stops: [...document.querySelectorAll('#timeline article')].filter((a) => a.getBoundingClientRect().height > 80).length,
    threeLoaded: !!window.THREE,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    live: document.querySelector('[data-live-date]').getAttribute('datetime'),
    footer: getComputedStyle(document.querySelector('.site-footer')).position,
  }));
  assert.equal(state.canvas, 'none', `${label}: 3D canvas hidden`);
  assert.equal(state.intro, 'none', `${label}: intro hidden`);
  assert.equal(state.stops, 7, `${label}: seven readable stops`);
  assert.ok(state.overflow <= 1, `${label}: no sideways scroll (${state.overflow}px)`);
  assert.match(state.live, /^\d{4}-\d{2}-\d{2}$/, `${label}: live stop shows today's date`);
  assert.notEqual(state.footer, 'absolute', `${label}: footer is visible`);
  return state;
}

(async () => {
  const browser = await launch();
  const all = [];
  try {
    // 1. Phone width -> flat, and the 3D bundle is never fetched.
    {
      const page = await (await browser.newContext(PHONE)).newPage();
      const problems = watch(page); all.push(problems);
      const requested = [];
      page.on('request', (r) => requested.push(r.url()));
      await page.goto(`${BASE_URL}/`, { waitUntil: 'load' });
      const s = await assertFlat(page, 'phone');
      assert.equal(s.threeLoaded, false, 'phone: three.js not loaded');
      assert.ok(!requested.some((u) => /three\.min|intro\.mp4|space-scene/.test(u)), 'phone: no 3D assets requested');
      await page.screenshot({ path: path.join(qaDir, 'flat-phone.png'), fullPage: false });
    }
    // 2. Reduced motion on desktop -> flat.
    {
      const page = await (await browser.newContext({ ...DESKTOP, reducedMotion: 'reduce' })).newPage();
      all.push(watch(page));
      await page.goto(`${BASE_URL}/`, { waitUntil: 'load' });
      await assertFlat(page, 'reduced-motion');
    }
    // 3. ?flat=1 on desktop -> flat, and the choice sticks for the session; ?flat=0 returns.
    {
      const page = await (await browser.newContext(DESKTOP)).newPage();
      all.push(watch(page));
      await page.goto(`${BASE_URL}/?flat=1`, { waitUntil: 'load' });
      await assertFlat(page, '?flat=1');
      await page.screenshot({ path: path.join(qaDir, 'flat-desktop.png'), fullPage: false });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'load' });
      await assertFlat(page, 'sticky flat');
      await page.click('[data-launch-journey]');
      await page.waitForFunction(() => !document.documentElement.classList.contains('flat') && window.MABSpace, null, { timeout: 60_000 });
    }
    // 4. GPU context lost mid-visit -> falls back instead of a black page.
    {
      const page = await (await browser.newContext(DESKTOP)).newPage();
      all.push(watch(page));
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => window.MABSpace && !document.body.classList.contains('intro-active'), null, { timeout: 120_000 });
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains('flat')), false, 'desktop starts in 3D');
      await page.evaluate(() => document.querySelector('#space-canvas').dispatchEvent(new Event('webglcontextlost', { bubbles: false, cancelable: true })));
      await assertFlat(page, 'context lost');
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflowY !== 'hidden'), true, 'context lost: page scrolls');
    }
    // 5. WebGL unavailable -> flat, and the 3D launch button is removed.
    {
      const ctx = await browser.newContext(DESKTOP);
      await ctx.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
      const page = await ctx.newPage();
      all.push(watch(page));
      await page.goto(`${BASE_URL}/?flat=0`, { waitUntil: 'load' });
      await assertFlat(page, 'no webgl');
      assert.equal(await page.locator('[data-launch-journey]').count(), 0, 'no webgl: 3D launch is not offered');
    }

    // 6. Standard pages at both widths.
    for (const [name, opts] of [['phone', PHONE], ['desktop', DESKTOP]]) {
      const page = await (await browser.newContext(opts)).newPage();
      all.push(watch(page));
      for (const route of ['/services', '/command', '/about', '/contact', '/portal', '/privacy', '/terms', '/refunds']) {
        const res = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'load' });
        assert.equal(res.status(), 200, `${route} loads`);
        const m = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          h1: document.querySelector('h1').getBoundingClientRect().height,
          nav: !!document.querySelector('.site-nav .brand img'),
          footerLinks: document.querySelectorAll('.site-footer a').length,
        }));
        assert.ok(m.overflow <= 1, `${name} ${route}: no sideways scroll (${m.overflow}px)`);
        assert.ok(m.h1 > 20 && m.nav && m.footerLinks >= 12, `${name} ${route}: heading, nav and footer render`);
      }

      // Services: prices, fallback buttons, estimator.
      await page.goto(`${BASE_URL}/services`, { waitUntil: 'load' });
      assert.deepEqual(await page.$$eval('#tiers .price', (els) => els.map((e) => e.firstChild.textContent.trim())), ['$2,500', '$5,500', 'Custom']);
      assert.deepEqual(await page.$$eval('#standalone .price', (els) => els.map((e) => e.textContent.trim())), ['$2,000', '$3,500+', 'Custom']);
      assert.equal(await page.locator('#tier-terms').textContent(), 'Billed monthly, cancel anytime after 90 days.');
      assert.deepEqual(await page.$$eval('#tiers .btn, #standalone .btn', (els) => [...new Set(els.map((e) => e.textContent.trim()))]), ['Book a call'], 'no pay links yet -> every tier books a call');
      assert.equal(await page.locator('#services .card').count(), 6);
      assert.deepEqual(await page.$$eval('#proof-groups h3', (els) => els.map((e) => e.textContent)), ["Founder's career record", 'Built at MAB']);
      const before = await page.locator('#estimator [data-est="dollars"]').textContent();
      assert.equal(before, '$72,000 a year');
      await page.$eval('#estimator input[name="teamSize"]', (el) => { el.value = '25'; el.dispatchEvent(new Event('input', { bubbles: true })); });
      assert.equal(await page.locator('#estimator [data-est="dollars"]').textContent(), '$180,000 a year');
      assert.match(await page.locator('#estimator [data-est="formula"]').textContent(), /25 × 3 × 48/);
      assert.equal(await page.locator('#estimator .est-note').textContent(), 'Illustration from your inputs, not a promised saving.');
      await page.screenshot({ path: path.join(qaDir, `services-${name}.png`) });

      // Systems gallery: filter and search.
      await page.goto(`${BASE_URL}/command`, { waitUntil: 'load' });
      assert.equal(await page.locator('#grid .card').count(), 12);
      await page.click('.chip:has-text("Agent")');
      assert.equal(await page.locator('#grid .card').count(), 3);
      await page.click('.chip:has-text("All")');
      await page.fill('#search', '<img src=x onerror=alert(1)>');
      assert.equal(await page.locator('#grid .card').count(), 0);
      assert.ok((await page.locator('#grid .empty').textContent()).startsWith('No systems match'));

      // Billing: no link configured yet -> email fallback; ?paid=1 shows the receipt note.
      await page.goto(`${BASE_URL}/portal`, { waitUntil: 'load' });
      assert.match(await page.locator('#billing-action a').getAttribute('href'), /^mailto:mark@mabaistrategies\.com/);
      assert.equal(await page.locator('#paid-notice').isVisible(), false);
      await page.goto(`${BASE_URL}/portal?paid=1`, { waitUntil: 'load' });
      assert.equal(await page.locator('#paid-notice').isVisible(), true);

      // Contact: validation blocks an empty or malformed send; nothing leaves the page.
      await page.goto(`${BASE_URL}/contact`, { waitUntil: 'load' });
      let posted = 0;
      await page.route('https://formspree.io/**', (r) => { posted++; r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
      await page.click('#cf-submit');
      assert.match(await page.locator('#cf-status').textContent(), /Add your name/);
      await page.fill('#cf-name', 'Test Person'); await page.fill('#cf-email', 'not-an-email'); await page.fill('#cf-message', 'Hello');
      await page.click('#cf-submit');
      assert.equal(posted, 0, 'invalid form is not sent');
      await page.fill('#cf-email', 'test@example.com');
      await page.click('#cf-submit');
      await page.waitForFunction(() => document.querySelector('#cf-status').classList.contains('ok'));
      assert.equal(posted, 1, 'valid form posts once');
      assert.equal(await page.inputValue('#cf-name'), '', 'form clears after sending');

      // Old URLs.
      for (const [from, to] of [['/services.html', '/services'], ['/about.html', '/about'], ['/contact.html', '/contact'],
        ['/privacy-policy.html', '/privacy'], ['/terms-of-service.html', '/terms'], ['/refund-policy.html', '/refunds']]) {
        const res = await page.goto(`${BASE_URL}${from}`, { waitUntil: 'domcontentloaded' });
        assert.equal(res.status(), 200, `${from} resolves`);
        assert.equal(new URL(page.url()).pathname, to, `${from} lands on ${to}`);
      }
      // Unknown path -> the 404 page (its own unwatched tab: the 404 status is the point).
      const lost = await page.context().newPage();
      const missing = await lost.goto(`${BASE_URL}/no-such-page`, { waitUntil: 'domcontentloaded' });
      assert.equal(missing.status(), 404);
      assert.equal(await lost.locator('h1').textContent(), 'Off the map.');
      await lost.close();
    }

    const problems = all.flat();
    assert.deepEqual(problems, [], 'no page errors or failed requests');
    console.log('e2e-responsive.cjs: PASS');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
