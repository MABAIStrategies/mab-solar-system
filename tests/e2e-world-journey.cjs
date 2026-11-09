const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { launch, watch, BASE_URL } = require('./browser.cjs');
const { WORLD_DEFS, dateFor } = require('../world-data.js');

const qaDir = path.join(__dirname, '..', 'qa', 'screenshots');
fs.mkdirSync(qaDir, { recursive: true });

const OFFER_NAMES = {
  audit: 'AI Readiness Audit', agents: 'Custom AI Agents', architecture: 'Fractional AI Architecture',
  sales: 'AI Sales Systems', web: 'Conversion Web Experiences', automation: 'Workflow Automation', briefing: 'Strategic Briefing',
};

(async () => {
  const browser = await launch();
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
  const problems = watch(page);
  try {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.keyboard.press('Escape');
    await page.waitForFunction(
      () => window.MABHub && window.MABWorldJourney && window.MABModule && window.MABSpace && !document.body.classList.contains('intro-active'),
      null, { timeout: 120_000 });
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#space-canvas')).display !== 'none'), true, 'space scene still renders');

    for (const world of WORLD_DEFS) {
      const id = world.stationId;
      assert.equal(await page.evaluate((s) => window.MABWorldJourney.open(s), id), true, `${id} opens`);
      await page.waitForSelector('#world-journey.active', { timeout: 5_000 });
      const shown = await page.evaluate(() => ({
        datetime: document.querySelector('.caption-date').getAttribute('datetime'),
        date: document.querySelector('.caption-date').textContent,
        caption: document.querySelector('.caption-text').textContent,
      }));
      const expected = world.live ? await page.evaluate(() => {
        const d = new Date(); const p = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      }) : world.dateISO;
      assert.equal(shown.datetime, expected, `${id} date`);
      if (!world.live) assert.equal(shown.date, dateFor(world).label);
      assert.equal(shown.caption, world.caption, `${id} caption`);

      // Module opens by itself after the two-second hold.
      const t0 = Date.now();
      await page.waitForSelector('.mab-module.open [role="dialog"]', { timeout: 4_000 });
      assert.ok(Date.now() - t0 >= 1_200, `${id} module waits for the hold`);
      const title = await page.textContent('#module-title');
      assert.equal(title, OFFER_NAMES[world.offerId], `${id} maps to its offer`);
      assert.equal(await page.locator('.module-specs li').count(), 3);
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(qaDir, `landing-${world.order}-${id}.png`) });

      if (id === 'origin') {
        const before = await page.textContent('[data-est="dollars"]');
        assert.equal(before, '$72,000 a year');
        await page.evaluate(() => {
          const el = document.querySelector('.mab-estimator input[name="teamSize"]');
          el.value = '40'; el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        const after = await page.textContent('.mab-estimator');
        assert.match(after, /\$288,000 a year/);
        assert.ok(!/NaN|Infinity|undefined/.test(after), 'estimator output is clean');
        assert.match(after, /Illustration from your inputs, not a promised saving\./);
      }
      if (id === 'mechanism') {
        await page.click('[data-add-brief]');
        await page.waitForSelector('.mab-module', { state: 'hidden' });
      } else {
        // Focus is trapped in the dialog; Esc closes only the module.
        for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => !!document.activeElement.closest('.mab-module-card')), true, `${id} focus stays in dialog`);
        await page.keyboard.press('Escape');
        await page.waitForSelector('.mab-module', { state: 'hidden' });
      }
      assert.equal(await page.evaluate(() => window.MABWorldJourney.isOpen()), true, `${id} landing stays open after module closes`);
      if (id !== 'mechanism') {
        assert.equal(await page.evaluate(() => document.activeElement.matches('[data-world-module]')), true, `${id} focus returns to opener`);
      }
      if (id === 'convergence') {
        await page.click('[data-world-module]');
        await page.waitForSelector('.mab-module.open');
        const brief = await page.textContent('.brief-text');
        assert.match(brief, /Custom AI Agents/, 'brief lists the added offer');
        assert.match(brief, /Sep 30, 2012 · AlexNet/, 'brief lists visited stops');
        assert.match(brief, /40 people/, 'brief carries the estimate');
        const mail = await page.getAttribute('a[href^="mailto:"]', 'href');
        assert.ok(mail.startsWith('mailto:mark@mabaistrategies.com?subject='));
        assert.equal(await page.getAttribute('.mab-brief a.primary-solid', 'href'), 'https://calendar.app.google/kuwKF2VrDuyvdfN9A');
        await page.screenshot({ path: path.join(qaDir, 'brief.png') });
        await page.keyboard.press('Escape');
      } else {
        assert.equal(await page.isVisible('[data-world-next]'), true, `${id} offers the next stop`);
      }
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !window.MABWorldJourney.isOpen() && !document.body.classList.contains('world-open'), null, { timeout: 5_000 });
    }
    assert.deepEqual(problems, [], 'no page errors or failed requests');
    console.log('e2e-world-journey.cjs: PASS');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
