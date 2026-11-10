const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const BANNED = require('./banned.cjs');
const { WORLD_DEFS } = require('../world-data.js');

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'content.js'), 'utf8'), sandbox);
const MAB = JSON.parse(JSON.stringify(sandbox.window.MAB));

const ids = MAB.offers.map((o) => o.id);
assert.deepEqual(ids, ['audit', 'agents', 'architecture', 'sales', 'web', 'automation', 'briefing']);
for (const w of WORLD_DEFS) assert.ok(ids.includes(w.offerId), w.offerId);
for (const o of MAB.offers) {
  assert.ok(o.name && o.blurb, o.id);
  assert.equal(o.specs.length, 3, o.id);
}
assert.deepEqual(MAB.proof.career, ['$12M+ ARR generated', '#2 national ranking', '750+ enterprise accounts']);
assert.deepEqual(MAB.proof.built, ['100+ AI agents', '300+ business automations']);
// Pricing guide (Mark, 2026-11-10). Exact figures; an item with no figure from Mark shows no number.
assert.ok(!('tiers' in MAB) && !('standalone' in MAB) && !('tierTerms' in MAB), 'old tier tables are gone');
assert.deepEqual(MAB.pricing.map((g) => g.id), ['start', 'retainers', 'training', 'custom']);
const items = Object.fromEntries(MAB.pricing.flatMap((g) => g.items).map((i) => [i.id, i]));
assert.deepEqual(Object.keys(items), ['audit', 'audit-workflow', 'junior', 'google', 'senior', 'discovery', 'exec-training', 'team-coaching', 'custom-build', 'library']);
assert.deepEqual(Object.fromEntries(Object.entries(items).map(([k, v]) => [k, [v.price, v.unit || '']])), {
  audit: ['$2,000', ''],
  'audit-workflow': ['Ask for pricing', ''],
  junior: ['$1,000', '/ month'],
  google: ['$800', '/ month'],
  senior: ['$5,000–$25,000', 'build'],
  discovery: ['$500', 'per department'],
  'exec-training': ['$1,000', 'per 5 seats'],
  'team-coaching': ['$120', 'per seat, per session'],
  'custom-build': ['Talk to sales', ''],
  library: ['From $250', ''],
});
const text = (id) => items[id].features.join(' | ');
assert.match(text('audit'), /1\.5-hour discovery meeting/); assert.match(text('audit'), /within 48 hours/); assert.match(text('audit'), /1-hour follow-up strategy meeting with Mark/);
assert.match(text('audit-workflow'), /within 72 hours/);
assert.match(text('junior'), /6-month minimum/); assert.match(text('junior'), /One workflow built and implemented each month/);
assert.match(text('google'), /8-month minimum/); assert.match(text('google'), /Google-specific/);
assert.match(text('senior'), /\$500 \/ month/); assert.match(text('senior'), /\$1,000 \/ month/);
assert.match(text('senior'), /6 months.*9 months.*12 months/); assert.match(text('senior'), /does not count/);
assert.match(text('discovery'), /\$1,000–\$2,000/);
assert.match(text('exec-training'), /6–10 seats: \$2,000/); assert.match(text('exec-training'), /11–15 seats: \$3,000/);
for (const i of Object.values(items)) assert.ok('payLink' in i, i.id);
assert.deepEqual(Object.values(items).filter((i) => i.payLink !== null).map((i) => i.id), [], 'no Stripe links wired yet');
assert.equal(items.library.href, '/command');
assert.ok('portalLoginUrl' in MAB.billing);
assert.ok(!('portalDemo' in MAB) && !('quote' in MAB) && !('stats' in MAB) && !('phases' in MAB));
assert.deepEqual(MAB.stops.map((s) => s.id), WORLD_DEFS.map((w) => w.stationId));
const blob = JSON.stringify(MAB);
for (const s of BANNED) assert.ok(!blob.includes(s), `banned string in content.js: ${s}`);
console.log('content.test.cjs: PASS');
