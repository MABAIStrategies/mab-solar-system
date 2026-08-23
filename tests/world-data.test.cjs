const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const { WORLD_DEFS, worldForStation } = require('../world-data.js');

assert.equal(WORLD_DEFS.length, 7, 'hub exposes exactly seven themed worlds');
assert.deepEqual(
  WORLD_DEFS.map((world) => world.theme),
  ['arctic', 'lava', 'ocean', 'desert', 'jungle', 'city', 'singularity'],
  'the seven requested environments are represented once each'
);

for (const world of WORLD_DEFS) {
  assert.ok(world.stationId, `${world.theme} maps to a hub station`);
  assert.ok(world.title && world.eyebrow, `${world.theme} has display copy`);
  assert.ok(world.image.startsWith('assets/worlds/'), `${world.theme} uses a local hero image`);
  assert.ok(world.detailImage.startsWith('assets/worlds/'), `${world.theme} uses a local detail image`);
  assert.ok(Array.isArray(world.chapters) && world.chapters.length >= 3, `${world.theme} has a scroll narrative`);
  assert.ok(world.palette && world.palette.accent && world.palette.glow, `${world.theme} has an atmosphere palette`);
}

assert.equal(worldForStation('command').theme, 'jungle');
assert.equal(worldForStation('enterprise').theme, 'city');
assert.equal(worldForStation('missing'), null);

console.log('world-data.test.cjs: PASS');
