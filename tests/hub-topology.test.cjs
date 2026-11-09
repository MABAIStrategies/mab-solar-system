const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { WORLD_DEFS } = require('../world-data.js');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const content = fs.readFileSync(path.join(root, 'content.js'), 'utf8');
const space = fs.readFileSync(path.join(root, 'space-scene.js'), 'utf8');

for (const world of WORLD_DEFS) {
  assert.ok(index.includes(`data-id="${world.stationId}"`), `${world.stationId} has a runway stop`);
  assert.ok(content.includes(`id: "${world.stationId}"`), `${world.stationId} has hub content`);
  assert.ok(space.includes(`id: "${world.stationId}"`), `${world.stationId} has a rendered planet`);
  const planetTexture = path.join(root, 'assets', 'worlds', 'planets', `${world.theme}.webp`);
  assert.ok(fs.existsSync(planetTexture), `${world.theme} has a local seamless planet texture`);
  assert.ok(fs.statSync(planetTexture).size > 50_000, `${world.theme} planet texture is not a placeholder`);
}

assert.match(space, /const START_CAMERA_Z\s*=\s*[0-4](?:\.\d+)?\s*;/, 'opening camera starts close to the first planet');
assert.match(space, /id:\s*"origin"[\s\S]{0,180}z:\s*-[0-9](?:\.\d+)?[\s\S]{0,100}r:\s*(?:0\.[89]|[1-9])/, 'first planet is close and visually substantial');
assert.match(space, /new THREE\.ShaderMaterial\([\s\S]{0,900}glowColor/, 'planets retain a Fresnel atmosphere shader');
assert.match(space, /getCloudTexture\(\)/, 'living worlds retain independent cloud shells');

for (const script of ['station-hold.js', 'world-data.js', 'world-journey.js']) {
  assert.ok(index.includes(`"${script}"`), `${script} is loaded by the page`);
}

console.log('hub-topology.test.cjs: PASS');
