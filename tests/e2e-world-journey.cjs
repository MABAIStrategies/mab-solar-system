const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { WORLD_DEFS } = require('../world-data.js');

const root = path.resolve(__dirname, '..');
const qaDir = path.join(root, 'qa');
fs.mkdirSync(qaDir, { recursive: true });

const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ['--disable-gpu-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const pageErrors = [];
  const failedLocalRequests = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(`console: ${message.text()}`);
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith('http://127.0.0.1:8765')) {
      failedLocalRequests.push(`${request.url()} :: ${request.failure()?.errorText}`);
    }
  });

  try {
    await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.keyboard.press('Escape');
    await page.waitForFunction(
      () => window.MABHub && window.MABWorldJourney && window.MABSpace && !document.body.classList.contains('intro-active'),
      null,
      { timeout: 120_000 }
    );
    await page.waitForTimeout(1_000);
    await page.screenshot({ path: path.join(qaDir, '01-hub-opening.png') });

    const firstPlanet = await page.evaluate(() => {
      const canvas = document.querySelector('#space-canvas');
      return {
        canvasVisible: !!canvas && getComputedStyle(canvas).display !== 'none',
        startProgress: window.MABSpace.getProgress(),
        bodyTheme: document.body.dataset.theme || '',
      };
    });
    assert.equal(firstPlanet.canvasVisible, true, 'WebGL hub canvas is visible');
    assert.ok(firstPlanet.startProgress < 0.03, 'hub opens at the start of the journey');

    await page.evaluate(() => window.MABHub.jumpToId('mechanism'));
    const reachedMechanism = await page
      .waitForFunction(() => window.MABHub.getActiveId() === 'mechanism', null, { timeout: 20_000 })
      .catch(() => null);
    if (!reachedMechanism) {
      const debugState = await page.evaluate(() => ({
        y: scrollY,
        active: window.MABHub.getActiveId(),
        progress: window.MABSpace.getProgress(),
        hasLenis: !!window.__lenis,
        introActive: document.body.classList.contains('intro-active'),
        target: (() => {
          const el = document.querySelector('.runway-stop[data-id="mechanism"]');
          return el ? { top: el.offsetTop, height: el.offsetHeight } : null;
        })(),
      }));
      throw new Error(`Mechanism did not activate: ${JSON.stringify(debugState)}`);
    }
    await page.waitForSelector('#station-dwell.holding', { state: 'visible', timeout: 20_000 });
    await page.screenshot({ path: path.join(qaDir, '02-lava-station.png') });

    const beforeLockedWheel = await page.evaluate(() => ({ y: scrollY, remaining: window.MABHub.stationHoldRemaining() }));
    assert.ok(beforeLockedWheel.remaining > 500, 'arrival exposes a real timed hold window');
    await page.mouse.move(800, 500);
    await page.mouse.wheel(0, 1_800);
    await page.waitForTimeout(280);
    const duringLockedWheel = await page.evaluate(() => ({ y: scrollY, remaining: window.MABHub.stationHoldRemaining() }));
    assert.ok(
      Math.abs(duringLockedWheel.y - beforeLockedWheel.y) < 4,
      `scroll is discarded during timed hold (${beforeLockedWheel.y} -> ${duringLockedWheel.y})`
    );

    await page.waitForFunction(() => window.MABHub.stationHoldRemaining() === 0, null, { timeout: 5_000 });
    const releasedY = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(650);
    const afterReleasedWheel = await page.evaluate(() => scrollY);
    assert.ok(afterReleasedWheel > releasedY + 15, 'normal wheel movement resumes after two seconds');

    await page.evaluate(() => window.MABHub.jumpToId('mechanism'));
    await page.waitForFunction(() => window.MABHub.getActiveId() === 'mechanism', null, { timeout: 20_000 });
    const stationSurface = await page.evaluate(() => getComputedStyle(document.querySelector('#surface-layer')).backgroundImage);
    assert.match(stationSurface, /assets\/worlds\/lava\.webp/, 'hub station uses the real local lava image');

    const enter = page.locator('.stop-panel[data-id="mechanism"] .world-enter');
    await enter.waitFor({ state: 'visible', timeout: 10_000 });
    await enter.click();
    await page.waitForFunction(() => document.body.classList.contains('world-open'));
    await page.waitForFunction(() => document.querySelector('#world-journey')?.dataset.theme === 'lava');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(qaDir, '03-lava-world-entry.png') });

    await page.evaluate(() => {
      const el = document.querySelector('#world-journey');
      el.scrollTo({ top: (el.scrollHeight - el.clientHeight) * 0.5, behavior: 'auto' });
    });
    await page.waitForTimeout(500);
    const midpoint = await page.evaluate(() => {
      const el = document.querySelector('#world-journey');
      const visibleCards = [...el.querySelectorAll('.world-beat.active .world-beat-card')]
        .filter((card) => {
          const style = getComputedStyle(card);
          const rect = card.getBoundingClientRect();
          return style.visibility !== 'hidden' && Number(style.opacity) > 0.9 && rect.width > 0 && rect.height > 0;
        });
      const card = visibleCards[0] || null;
      const rect = card?.getBoundingClientRect();
      return {
        detail: parseFloat(el.style.getPropertyValue('--detail-alpha')),
        orbitX: parseFloat(el.style.getPropertyValue('--orbit-x')),
        progress: parseFloat(el.style.getPropertyValue('--world-progress')),
        meteors: getComputedStyle(el.querySelector('.world-fx.meteors')).display,
        viewportHeight: innerHeight,
        chapter: {
          count: visibleCards.length,
          title: card?.querySelector('h2')?.textContent?.trim() || '',
          top: rect?.top ?? -1,
          bottom: rect?.bottom ?? -1,
        },
      };
    });
    assert.ok(midpoint.progress > 0.47 && midpoint.progress < 0.53, 'world scroll reaches the midpoint of its orbit');
    assert.ok(midpoint.detail > 0.85, 'detail scene is revealed during the orbit');
    assert.equal(midpoint.meteors, 'block', 'lava-specific meteors are rendered');
    assert.equal(midpoint.chapter.count, 1, 'exactly one active world chapter is visible at midpoint');
    assert.ok(midpoint.chapter.title.length > 3, 'the active world chapter contains readable copy');
    assert.ok(
      midpoint.chapter.top >= 0 && midpoint.chapter.bottom <= midpoint.viewportHeight,
      `active chapter remains fully inside the viewport (${midpoint.chapter.top}..${midpoint.chapter.bottom})`
    );
    await page.screenshot({ path: path.join(qaDir, '04-lava-world-midpoint.png') });

    await page.evaluate(() => {
      const el = document.querySelector('#world-journey');
      el.scrollTo({ top: el.scrollHeight - el.clientHeight - 18, behavior: 'auto' });
    });
    await page.waitForTimeout(300);
    const nearExit = await page.evaluate(() => ({
      power: parseFloat(document.querySelector('.world-rift--exit').style.getPropertyValue('--rift-power')),
      worldOpen: document.body.classList.contains('world-open'),
    }));
    assert.ok(nearExit.power > 0.9, 'opposite-side outbound rift becomes dominant at orbit completion');
    assert.equal(nearExit.worldOpen, true, 'near-exit view remains visible before crossing');
    await page.screenshot({ path: path.join(qaDir, '05-lava-outbound-rift.png') });

    await page.evaluate(() => {
      const el = document.querySelector('#world-journey');
      el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
    });
    await page.waitForFunction(() => !document.body.classList.contains('world-open'), null, { timeout: 5_000 });
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => window.MABHub.getActiveId()), 'mechanism', 'rift returns to the originating hub station');
    await page.screenshot({ path: path.join(qaDir, '06-returned-to-hub.png') });

    for (const world of WORLD_DEFS) {
      await page.evaluate((stationId) => window.MABWorldJourney.open(stationId), world.stationId);
      await page.waitForFunction((theme) => document.querySelector('#world-journey')?.dataset.theme === theme, world.theme);
      await page.evaluate(() => {
        const el = document.querySelector('#world-journey');
        el.scrollTo({ top: (el.scrollHeight - el.clientHeight) * 0.43, behavior: 'auto' });
      });
      await page.waitForTimeout(220);
      const visual = await page.evaluate((expectedTheme) => {
        const el = document.querySelector('#world-journey');
        return {
          theme: el.dataset.theme,
          main: getComputedStyle(el.querySelector('.world-image-main')).backgroundImage,
          detail: getComputedStyle(el.querySelector('.world-image-detail')).backgroundImage,
        };
      }, world.theme);
      assert.equal(visual.theme, world.theme);
      assert.ok(visual.main.includes(`${world.theme}.webp`), `${world.theme} uses its local hero image`);
      assert.ok(visual.detail.includes(`${world.theme}-detail.webp`), `${world.theme} uses its local detail image`);
      await page.screenshot({ path: path.join(qaDir, `world-${world.theme}.png`) });
      await page.evaluate(() => window.MABWorldJourney.close('qa'));
      await page.waitForFunction(() => !document.body.classList.contains('world-open'), null, { timeout: 4_000 });
    }

    assert.deepEqual(failedLocalRequests, [], `no local resources failed: ${failedLocalRequests.join('\n')}`);
    assert.deepEqual(pageErrors, [], `browser emitted no errors: ${pageErrors.join('\n')}`);

    const report = {
      status: 'PASS',
      firstPlanet,
      hold: {
        remainingAtCaptureMs: Math.round(beforeLockedWheel.remaining),
        beforeY: Math.round(beforeLockedWheel.y),
        duringY: Math.round(duringLockedWheel.y),
        releasedY: Math.round(releasedY),
        afterReleasedY: Math.round(afterReleasedWheel),
      },
      orbit: midpoint,
      outboundRiftPower: nearExit.power,
      themesCaptured: WORLD_DEFS.map((world) => world.theme),
      screenshots: fs.readdirSync(qaDir).filter((file) => file.endsWith('.png')).sort(),
      errors: pageErrors,
      failedLocalRequests,
    };
    fs.writeFileSync(path.join(qaDir, 'e2e-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
