const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { WORLD_DEFS } = require('../world-data.js');

const root = path.resolve(__dirname, '..');
const jsPath = path.join(root, 'world-journey.js');
const cssPath = path.join(root, 'worlds.css');
assert.ok(fs.existsSync(jsPath), 'world journey controller exists');
assert.ok(fs.existsSync(cssPath), 'world journey stylesheet exists');

const js = fs.readFileSync(jsPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(js, /worldForStation\(/, 'world opens from a hub station id');
assert.match(js, /orbitAt\(/, 'world scroll drives the tested circular path');
assert.match(js, /mab:world-open/, 'world notifies the hub when it takes over');
assert.match(js, /mab:world-close/, 'rift return restores the hub');
assert.match(js, /exitRift\s*>\s*0\.9/, 'completed orbit arms the outbound rift');
assert.match(js, /scrollTo\(\{\s*top:\s*0/, 'each world begins at its entry rift');
assert.ok(index.includes('href="worlds.css"'), 'world stylesheet is loaded');

for (const world of WORLD_DEFS) {
  for (const asset of [world.image, world.detailImage]) {
    const file = path.join(root, ...asset.split('/'));
    assert.ok(fs.existsSync(file), `${asset} exists locally`);
    assert.ok(fs.statSync(file).size > 50_000, `${asset} contains a real image, not a placeholder`);
  }
  assert.ok(css.includes(`[data-theme="${world.theme}"]`), `${world.theme} has a specific atmosphere treatment`);
}

assert.match(css, /\.world-rift/, 'rift has a visible rendered treatment');
assert.match(css, /\.world-fx\.meteors/, 'lava world contains meteor motion');
assert.match(css, /\.world-fx\.droplets/, 'ocean and jungle can show close surface droplets');
assert.match(css, /\.world-fx\.agent-network/, 'singularity contains an agent-network layer');

console.log('world-journey.test.cjs: PASS');
