const assert = require('node:assert/strict');
const { WORLD_DEFS, worldForStation } = require('../world-data.js');

assert.equal(WORLD_DEFS.length, 7);
assert.deepEqual(WORLD_DEFS.map((w) => w.stationId),
  ['origin', 'mechanism', 'services', 'proof', 'command', 'enterprise', 'convergence']);
assert.deepEqual(WORLD_DEFS.map((w) => w.theme),
  ['arctic', 'lava', 'ocean', 'desert', 'jungle', 'city', 'singularity']);
assert.deepEqual(WORLD_DEFS.map((w) => w.dateISO),
  ['2012-09-30', '2016-03-10', '2017-06-12', '2022-11-22', '2022-11-30', '2024-11-25', null]);
assert.deepEqual(WORLD_DEFS.map((w) => w.wireframe),
  ['scan', 'lattice', 'transformer', 'funnel', 'browser', 'hub', 'brief']);
WORLD_DEFS.forEach((w, i) => {
  assert.equal(w.order, i + 1);
  assert.ok(w.title && w.caption && !/\n/.test(w.caption), `${w.stationId} caption`);
  assert.equal((w.caption.match(/[.!?](\s|$)/g) || []).length, 1, `${w.stationId} is one sentence`);
  assert.ok(!('chapters' in w) && !('image' in w) && !('detailImage' in w));
  assert.ok(w.live || /^https:\/\//.test(w.sourceUrl), `${w.stationId} source`);
  assert.ok(w.live || w.dateLabel, `${w.stationId} date label`);
  assert.ok(w.palette && w.palette.ink && w.palette.accent && w.palette.glow && w.palette.shadow);
});
const dated = WORLD_DEFS.filter((w) => w.dateISO).map((w) => w.dateISO);
assert.deepEqual(dated, [...dated].sort());
assert.equal(WORLD_DEFS.filter((w) => w.live).length, 1);
assert.equal(worldForStation('command').offerId, 'web');
assert.equal(worldForStation('missing'), null);
console.log('world-data.test.cjs: PASS');
