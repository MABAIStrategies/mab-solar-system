const assert = require('node:assert/strict');
const { orbitAt } = require('../world-orbit.js');

const start = orbitAt(0);
const quarter = orbitAt(0.25);
const half = orbitAt(0.5);
const threeQuarter = orbitAt(0.75);
const end = orbitAt(1);

assert.ok(quarter.x > 0, 'first quarter arcs camera to the right');
assert.ok(threeQuarter.x < 0, 'third quarter arcs camera to the left');
assert.ok(half.y > start.y, 'halfway point reaches the far side of the circular path');
assert.ok(Math.abs(start.x - end.x) < 0.001 && Math.abs(start.y - end.y) < 0.001, 'path closes into a circle');
assert.equal(start.entryRift, 1, 'entry rift begins open behind the viewer');
assert.equal(start.exitRift, 0);
assert.equal(end.entryRift, 0);
assert.equal(end.exitRift, 1, 'exit rift is fully open at the completed orbit');
assert.equal(start.approachSide, -1);
assert.equal(end.approachSide, 1, 'exit approaches the rift from the opposite side');

console.log('world-orbit.test.cjs: PASS');
