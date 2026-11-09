// Shared Playwright launcher. CHROME_PATH overrides the browser; BASE_URL overrides the server.
const fs = require('node:fs');
const { chromium } = require('playwright-core');

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);

exports.BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:8765').replace(/\/$/, '');

exports.launch = () =>
  chromium.launch({
    headless: true,
    executablePath: CANDIDATES.find((p) => fs.existsSync(p)),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });

// Collects page errors and failed same-origin requests for a final assertion.
exports.watch = (page) => {
  const problems = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('requestfailed', (r) => {
    if (r.url().startsWith(exports.BASE_URL) && r.failure()?.errorText !== 'net::ERR_ABORTED') problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`);
  });
  page.on('response', (r) => {
    if (r.url().startsWith(exports.BASE_URL) && r.status() >= 400) problems.push(`http ${r.status()}: ${r.url()}`);
  });
  return problems;
};
