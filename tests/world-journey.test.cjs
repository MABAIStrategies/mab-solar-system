const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { WORLD_DEFS, dateFor } = require('../world-data.js');

const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const js = read('world-journey.js');
const popup = read('module-popup.js');
const css = read('worlds.css');
const index = read('index.html');

assert.match(js, /worldForStation\(/, 'landing opens from a hub station id');
assert.match(js, /mab:world-open/, 'landing notifies the hub when it takes over');
assert.match(js, /mab:world-close/, 'closing restores the hub');
assert.match(js, /createTimedStationHold\(\{\s*durationMs:\s*HOLD_MS/, 'module opens after the station hold');
assert.match(js, /const HOLD_MS = 2000;/, 'hold is two seconds');
assert.match(js, /briefing\.visit\(stationId\)/, 'each landing is recorded in the brief');
for (const gone of ['chapters', 'detailImage', 'renderNarrative', 'orbitAt', 'world-fx']) {
  assert.ok(!js.includes(gone), `journey no longer uses ${gone}`);
  assert.ok(!css.includes(gone), `stylesheet no longer styles ${gone}`);
}
assert.match(popup, /role="dialog" aria-modal="true" aria-labelledby="module-title"/);
assert.match(popup, /Illustration from your inputs, not a promised saving\./);
assert.ok(index.includes('href="worlds.css"'), 'landing stylesheet is loaded');
for (const script of ['roi.js', 'briefing.js', 'wireframes.js', 'module-popup.js', 'world-journey.js', 'assets/vendor/three.min.js']) {
  assert.ok(index.includes(`"${script}"`), `${script} is loaded`);
}
assert.ok(index.indexOf('"module-popup.js"') < index.indexOf('"world-journey.js"'), 'module loads before the journey');
assert.ok(!/cdn\.jsdelivr|unpkg\.com/.test(index), 'no CDN scripts');

for (const world of WORLD_DEFS) {
  const file = path.join(root, 'assets', 'worlds', `${world.theme}.webp`);
  assert.ok(fs.existsSync(file) && fs.statSync(file).size > 50_000, `${world.theme} approach image exists`);
}
// The live stop reports the visitor's local calendar day.
const live = WORLD_DEFS.find((w) => w.live);
assert.deepEqual(dateFor(live, new Date(2026, 10, 9, 23, 59)), { iso: '2026-11-09', label: 'Nov 9, 2026' });
assert.deepEqual(dateFor(live, new Date(2027, 0, 1, 0, 0)), { iso: '2027-01-01', label: 'Jan 1, 2027' });
assert.deepEqual(dateFor(WORLD_DEFS[0]), { iso: '2012-09-30', label: 'Sep 30, 2012' });
assert.ok(dateFor(live, new Date('nope')).iso.length === 10, 'bad clock input falls back to now');
assert.deepEqual(dateFor(null), { iso: '', label: '' });
console.log('world-journey.test.cjs: PASS');
