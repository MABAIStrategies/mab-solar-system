const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const root = path.resolve(__dirname, '..');
const qaDir = path.join(root, 'qa');
fs.mkdirSync(qaDir, { recursive: true });
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = 'http://127.0.0.1:8765/index.html';

async function enterReadyHub(page) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.keyboard.press('Escape');
  await page.waitForFunction(
    () => window.MABHub && window.MABWorldJourney && window.MABSpace && !document.body.classList.contains('intro-active'),
    null,
    { timeout: 120_000 }
  );
  await page.waitForTimeout(800);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ['--disable-gpu-sandbox', '--disable-dev-shm-usage'],
  });
  const errors = [];

  try {
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    const page = await mobile.newPage();
    page.on('pageerror', (error) => errors.push(`mobile: ${error}`));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`mobile console: ${message.text()}`);
    });

    await enterReadyHub(page);
    await page.evaluate(() => window.MABHub.jumpToId('services'));
    await page.waitForFunction(() => window.MABHub.getActiveId() === 'services', null, { timeout: 20_000 });
    const enter = page.locator('.stop-panel[data-id="services"] .world-enter');
    await enter.waitFor({ state: 'visible', timeout: 10_000 });
    await enter.click();
    await page.waitForFunction(() => document.querySelector('#world-journey')?.dataset.theme === 'ocean');
    await page.evaluate(() => {
      const el = document.querySelector('#world-journey');
      el.scrollTo({ top: (el.scrollHeight - el.clientHeight) * 0.5, behavior: 'auto' });
    });
    await page.waitForTimeout(500);

    const mobileLayout = await page.evaluate(() => {
      const root = document.querySelector('#world-journey');
      const cards = [...root.querySelectorAll('.world-beat.active .world-beat-card')].filter((card) => {
        const style = getComputedStyle(card);
        const rect = card.getBoundingClientRect();
        return Number(style.opacity) > 0.9 && rect.width > 0 && rect.height > 0;
      });
      const rect = cards[0]?.getBoundingClientRect();
      return {
        count: cards.length,
        rect: rect ? { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom } : null,
        viewport: { width: innerWidth, height: innerHeight },
        theme: root.dataset.theme,
        bubbles: getComputedStyle(root.querySelector('.world-fx.bubbles')).display,
      };
    });
    assert.equal(mobileLayout.theme, 'ocean');

    assert.equal(mobileLayout.bubbles, 'block', 'ocean effects render on mobile');
    assert.equal(mobileLayout.count, 1, 'one mobile chapter is visible');
    assert.ok(mobileLayout.rect.left >= 0 && mobileLayout.rect.right <= mobileLayout.viewport.width, 'mobile chapter fits horizontally');
    assert.ok(mobileLayout.rect.top >= 0 && mobileLayout.rect.bottom <= mobileLayout.viewport.height, 'mobile chapter fits vertically');
    await page.screenshot({ path: path.join(qaDir, 'mobile-ocean-midpoint.png') });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.body.classList.contains('world-open'), null, { timeout: 4_000 });
    await mobile.close();

    const reduced = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    });
    const reducedPage = await reduced.newPage();
    reducedPage.on('pageerror', (error) => errors.push(`reduced: ${error}`));
    reducedPage.on('console', (message) => {
      if (message.type() === 'error') errors.push(`reduced console: ${message.text()}`);
    });
    await enterReadyHub(reducedPage);
    const opened = await reducedPage.evaluate(() => window.MABWorldJourney.open('origin'));
    assert.equal(opened, true, 'reduced-motion world opens');
    await reducedPage.waitForFunction(() => document.body.classList.contains('world-open'));
    await reducedPage.keyboard.press('End');
    await reducedPage.waitForFunction(() => !document.body.classList.contains('world-open'), null, { timeout: 4_000 });
    await reduced.close();

    assert.deepEqual(errors, [], `browser errors: ${errors.join('\n')}`);
    console.log(JSON.stringify({ status: 'PASS', mobile: mobileLayout, reducedMotion: 'PASS', errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
