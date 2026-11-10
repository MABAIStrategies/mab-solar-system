// The hub as a visitor meets it: every stop's landing button is reachable on common laptop
// screens, and the end of the scroll offers a next step instead of empty space.
const assert = require('node:assert/strict');
const { launch, watch, BASE_URL } = require('./browser.cjs');
const { WORLD_DEFS } = require('../world-data.js');

(async () => {
  const browser = await launch();
  const all = [];
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 1024, height: 768 }]) {
      const label = `${viewport.width}x${viewport.height}`; const T0 = Date.now(); const step = (m) => process.env.E2E_VERBOSE && console.log(label, m, Date.now() - T0);
      const page = await (await browser.newContext({ viewport })).newPage();
      all.push(watch(page));
      await page.goto(`${BASE_URL}/?flat=0`, { waitUntil: 'domcontentloaded' });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => window.MABHub && window.MABSpace && window.MABWorldJourney && !document.body.classList.contains('intro-active'), null, { timeout: 120_000 });
      assert.equal(await page.locator('#journey-end').isVisible(), false, `${label}: end card hidden at the start`);

      step('ready');
      for (const world of WORLD_DEFS) {
        // Rail jumps are ignored during the 2 s arrival hold (existing behaviour), so wait it out with margin.
        await page.waitForFunction(() => window.MABHub.stationHoldRemaining() === 0, null, { timeout: 10_000 });
        await page.waitForTimeout(250);
        await page.evaluate((id) => window.MABHub.jumpToId(id), world.stationId);
        // Known issue (predates this branch): a rail jump made while smooth scrolling is paused
        // for the arrival hold can be dropped. One retry mirrors a visitor clicking again.
        await page.waitForFunction((id) => window.MABHub.getActiveId() === id, world.stationId, { timeout: 6_000 })
          .catch(() => page.evaluate((id) => window.MABHub.jumpToId(id), world.stationId));
        await page.waitForFunction((id) => window.MABHub.getActiveId() === id, world.stationId, { timeout: 15_000 })
          .catch(async () => { throw new Error(`${label} ${world.stationId}: never became active (${JSON.stringify(await page.evaluate(() => ({ active: window.MABHub.getActiveId(), y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight })))})`); });
        await page.waitForTimeout(1600);
        const box = await page.evaluate((id) => {
          const btn = document.querySelector(`.stop-panel[data-id="${id}"] .world-enter`);
          const r = btn.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return { top: r.top, bottom: r.bottom, vh: innerHeight, onTop: !!hit && (hit === btn || btn.contains(hit)) };
        }, world.stationId);
        assert.ok(box.top >= 0 && box.bottom <= box.vh, `${label} ${world.stationId}: landing button is on screen (${Math.round(box.top)}-${Math.round(box.bottom)} of ${box.vh})`);
        assert.ok(box.onTop, `${label} ${world.stationId}: landing button is not covered`);
      }

      step('stops ok');
      // The audit panel (tallest: it holds the estimator) fits the screen and scrolls to its last line.
      await page.evaluate(() => window.MABWorldJourney.open('origin'));
      await page.waitForSelector('.mab-module.open', { timeout: 16_000 });
      await page.waitForTimeout(700);
      const card = await page.evaluate(() => { const c = document.querySelector('.mab-module-card').getBoundingClientRect(); return { top: c.top, bottom: c.bottom, vh: innerHeight }; });
      assert.ok(card.top >= 0 && card.bottom <= card.vh + 1, `${label}: audit panel fits the screen (${Math.round(card.bottom)} of ${card.vh})`);
      const mid = await page.$eval('.mab-module-body', (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.mouse.move(mid.x, mid.y);
      for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(60); }
      const note = await page.evaluate(() => { const n = document.querySelector('.mab-module-body').lastElementChild.getBoundingClientRect(); return { bottom: n.bottom, vh: innerHeight }; });
      assert.ok(note.bottom <= note.vh, `${label}: audit panel scrolls to its last line (${Math.round(note.bottom)} of ${note.vh})`);
      await page.keyboard.press('Escape');
      await page.click('.world-close');
      await page.waitForFunction(() => !document.body.classList.contains('world-open'), null, { timeout: 8_000 });

      // A real click on the last stop's button lands, then returning restores the hub.
      // The landing button's small label is fully readable (not running under the arrow).
      const fit = await page.evaluate(() => {
        const btn = document.querySelector('.stop-panel[data-id="convergence"] .world-enter');
        const small = btn.querySelector('small');
        const range = document.createRange(); range.selectNodeContents(small);
        const text = range.getBoundingClientRect(); const box = btn.getBoundingClientRect();
        return { textRight: text.right, limit: box.right - 40, lines: Math.round(small.getBoundingClientRect().height) };
      });
      assert.ok(fit.textRight <= fit.limit, `${label}: landing button label clears the arrow (${Math.round(fit.textRight)} <= ${Math.round(fit.limit)})`);

      await page.focus('.stop-panel[data-id="convergence"] .world-enter');
      await page.keyboard.press('Enter');
      await page.waitForSelector('#world-journey.active', { timeout: 8_000 });
      // Keyboard focus stays inside the landing (or its dialog) while it is open.
      await page.waitForTimeout(400);
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press('Tab');
        const where = await page.evaluate(() => { const el = document.activeElement; return el === document.body || el.closest('#world-journey, .mab-module') ? 'inside' : `${el.tagName}.${el.className}`; }); // body = the browser's own wrap-around stop
        assert.equal(where, 'inside', `${label}: Tab ${i + 1} stays inside the landing`);
      }
      if (await page.evaluate(() => window.MABModule.isOpen())) await page.keyboard.press('Escape');
      await page.click('.world-close');
      await page.waitForFunction(() => !document.body.classList.contains('world-open'), null, { timeout: 8_000 });
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => document.activeElement.matches('.stop-panel[data-id="convergence"] .world-enter')), true, `${label}: focus returns to the landing button`);
      assert.equal(await page.evaluate(() => document.querySelector('#site-nav').inert), false, `${label}: hub is interactive again`);

      step('landed and returned');
      // Scroll to the very end.
      for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 600); await page.waitForTimeout(120); }
      await page.waitForFunction(() => scrollY >= document.documentElement.scrollHeight - innerHeight - 4, null, { timeout: 20_000 });
      await page.waitForTimeout(900);
      assert.equal(await page.locator('#journey-end').isVisible(), true, `${label}: end card shows at the end of the scroll`);
      assert.equal(await page.getAttribute('#journey-end a.primary-solid', 'href'), 'https://calendar.app.google/kuwKF2VrDuyvdfN9A');
      assert.deepEqual(await page.$$eval('#journey-end a, #journey-end button', (els) => els.map((e) => e.textContent.trim())), ['Book the briefing', 'Services and pricing', 'Back to the start']);
      step('end card ok');
      await page.click('#journey-end button');
      await page.waitForFunction(() => scrollY < 200, null, { timeout: 20_000 });
      await page.waitForFunction(() => getComputedStyle(document.querySelector('#journey-end')).visibility === 'hidden', null, { timeout: 8_000 })
        .catch(() => assert.fail(`${label}: end card hides again`));
      await page.context().close(); // a live WebGL page left open slows the next viewport
    }
    assert.deepEqual(all.flat(), [], 'no page errors or failed requests');
    console.log('e2e-hub.cjs: PASS');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
