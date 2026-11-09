const assert = require('node:assert/strict');
const THREE = require('../assets/vendor/three.min.js');
const { IDS, build } = require('../wireframes.js');

assert.deepEqual(IDS, ['scan', 'lattice', 'transformer', 'funnel', 'browser', 'hub', 'brief']);
for (const id of IDS) {
  const w = build(id, THREE, { accent: '#55ddff', glow: '#ffffff' });
  assert.ok(w.group.isGroup && w.group.children.length > 0, id);
  let verts = 0;
  w.group.traverse((o) => { if (o.geometry) verts += o.geometry.attributes.position.count; });
  assert.ok(verts > 0 && verts < 4000, `${id} vertex count ${verts}`);
  assert.doesNotThrow(() => { w.update(0); w.update(12.5); w.update(1e6); }, id);
  w.group.traverse((o) => {
    if (!o.geometry) return;
    for (const v of o.geometry.attributes.position.array) assert.ok(Number.isFinite(v), `${id} finite positions`);
    assert.ok(Number.isFinite(o.position.x + o.scale.x + o.material.opacity), `${id} finite transform`);
  });
  assert.doesNotThrow(() => w.dispose(), id);
}
assert.ok(build('nope', THREE).group.children.length > 0);
assert.doesNotThrow(() => build('scan', THREE));
console.log('wireframes.test.cjs: PASS');
