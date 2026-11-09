const assert = require('node:assert/strict');
const { create, STORAGE_KEY } = require('../briefing.js');

function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const lookup = { offerName: (id) => `Offer ${id}`, stopLabel: (id) => `Stop ${id}` };
const body = (href) => href.split('&body=')[1];

assert.equal(STORAGE_KEY, 'mab_brief_v1');
const store = fakeStorage();
const b = create(store);
b.visit('origin'); b.visit('origin'); b.addOffer('audit'); b.addOffer('sales'); b.addOffer('audit');
assert.deepEqual(b.state().visited, ['origin']);
assert.deepEqual(b.state().offers, ['audit', 'sales']);
assert.deepEqual(create(store).state().offers, ['audit', 'sales']);

b.setEstimate({ inputs: { teamSize: 10, hoursPerWeek: 3, hourlyCost: 50 }, hoursPerYear: 1440, dollarsPerYear: 72000 });
const text = b.toText(lookup);
assert.match(text, /Offer audit/); assert.match(text, /Stop origin/); assert.match(text, /1,440 hours/);
assert.match(text, /illustration/i);

const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
const m = create(throwing); m.addOffer('audit'); m.visit('proof');
assert.deepEqual(m.state().offers, ['audit']);
assert.doesNotThrow(() => m.clear());
const half = { getItem: () => '{"visited":[],"offers":["old"]}', setItem() { throw new Error('quota'); } };
const h = create(half); h.addOffer('new');
assert.deepEqual(h.state().offers, ['old', 'new']);
assert.deepEqual(create(undefined).state(), { visited: [], offers: [], estimate: null });

const nasty = { offerName: () => 'R&D "Audit"\nline 🚀 #1?', stopLabel: (x) => x };
const href = b.mailtoHref('mark@mabaistrategies.com', nasty);
assert.ok(href.startsWith('mailto:mark@mabaistrategies.com?subject='));
assert.ok(!/[\n"# ]/.test(href.slice('mailto:'.length)));
assert.equal(href.split('&').length, 2);
assert.match(decodeURIComponent(body(href)), /R&D "Audit"/);

for (let i = 0; i < 400; i++) b.addOffer('offer-' + i);
const long = b.mailtoHref('a@b.co', lookup);
assert.ok(body(long).length <= 1800);
assert.doesNotThrow(() => decodeURIComponent(body(long)));

assert.deepEqual(create({ getItem: () => '{not json', setItem() {} }).state().offers, []);
assert.deepEqual(create({ getItem: () => '{"visited":"x","offers":[1,null,"audit"]}', setItem() {} }).state(), { visited: [], offers: ['audit'], estimate: null });
b.clear();
assert.deepEqual(b.state(), { visited: [], offers: [], estimate: null });
console.log('briefing.test.cjs: PASS');
