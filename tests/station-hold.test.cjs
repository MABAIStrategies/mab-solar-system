const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createTimedStationHold } = require('../station-hold.js');

let now = 10_000;
const hold = createTimedStationHold({ durationMs: 2_000, now: () => now });

assert.equal(hold.enter('services'), true, 'first arrival begins a hold');
assert.equal(hold.stationId(), 'services');
assert.equal(hold.isLocked(), true, 'station locks immediately');
assert.equal(hold.remainingMs(), 2_000);

now = 11_999;
assert.equal(hold.isLocked(), true, 'station remains locked for the full two seconds');
assert.equal(hold.remainingMs(), 1);

now = 12_000;
assert.equal(hold.isLocked(), false, 'station releases based on elapsed time, not scroll strength');
assert.equal(hold.remainingMs(), 0);

assert.equal(hold.enter('services'), false, 'same arrival does not restart while still parked');
hold.leave('services');
assert.equal(hold.enter('services'), true, 'returning after leaving starts a fresh timed hold');

const hubSource = fs.readFileSync(path.resolve(__dirname, '..', 'hub.js'), 'utf8');
assert.doesNotMatch(hubSource, /leaveCharge/, 'hub no longer gates departure by accumulated wheel strength');
assert.doesNotMatch(hubSource, /wheelMultiplier\s*=\s*0\.(?:25|45)/, 'hub no longer makes wheel input artificially weak near stations');
assert.match(hubSource, /createTimedStationHold\(\{\s*durationMs:\s*2_000/, 'live hub uses a full two-second timed hold');

console.log('station-hold.test.cjs: PASS');
