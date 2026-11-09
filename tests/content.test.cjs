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
assert.deepEqual(MAB.tiers.map((t) => t.price), ['$2,500', '$5,500', 'Custom']);
assert.deepEqual(MAB.standalone.map((s) => s.price), ['$2,000', '$3,500+', 'Custom']);
for (const t of [...MAB.tiers, ...MAB.standalone]) assert.ok('payLink' in t, t.name);
assert.ok('portalLoginUrl' in MAB.billing);
assert.ok(!('portalDemo' in MAB) && !('quote' in MAB) && !('stats' in MAB) && !('phases' in MAB));
assert.deepEqual(MAB.stops.map((s) => s.id), WORLD_DEFS.map((w) => w.stationId));
const blob = JSON.stringify(MAB);
for (const s of BANNED) assert.ok(!blob.includes(s), `banned string in content.js: ${s}`);
console.log('content.test.cjs: PASS');
