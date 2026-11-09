const assert = require('node:assert/strict');
const { estimate, DEFAULTS, LIMITS } = require('../roi.js');
const pick = (r) => ({ hoursPerYear: r.hoursPerYear, dollarsPerYear: r.dollarsPerYear });

assert.deepEqual(DEFAULTS, { teamSize: 10, hoursPerWeek: 3, hourlyCost: 50, weeksPerYear: 48 });
assert.deepEqual(LIMITS, { teamSize: [1, 1000], hoursPerWeek: [0, 40], hourlyCost: [0, 500] });
assert.deepEqual(pick(estimate({ teamSize: 10, hoursPerWeek: 3, hourlyCost: 50 })), { hoursPerYear: 1440, dollarsPerYear: 72000 });
assert.equal(estimate({}).hoursPerYear, 1440);
assert.equal(estimate().hoursPerYear, 1440);
assert.equal(estimate({ teamSize: 'abc' }).inputs.teamSize, 10);
assert.equal(estimate({ teamSize: '25' }).inputs.teamSize, 25);
assert.equal(estimate({ teamSize: -5 }).inputs.teamSize, 1);
assert.equal(estimate({ teamSize: 1e9, hoursPerWeek: 999, hourlyCost: 1e9 }).dollarsPerYear, 1000 * 40 * 48 * 500);
assert.equal(estimate({ hoursPerWeek: 0 }).dollarsPerYear, 0);
assert.equal(estimate({ hoursPerWeek: 2.5, teamSize: 3, hourlyCost: 33.33 }).hoursPerYear, 360);
for (const v of [NaN, Infinity, -Infinity, null, undefined, '', '  ', {}, [], true]) {
  const r = estimate({ teamSize: v, hoursPerWeek: v, hourlyCost: v });
  assert.ok(Number.isFinite(r.dollarsPerYear) && Number.isFinite(r.hoursPerYear), String(v));
  assert.ok(Number.isInteger(r.dollarsPerYear));
}
assert.match(estimate({}).formula, /10 × 3 × 48/);
assert.match(estimate({}).formula, /\$50/);
console.log('roi.test.cjs: PASS');
