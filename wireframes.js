(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MABWireframes = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const IDS = ["scan", "lattice", "transformer", "funnel", "browser", "hub", "brief"];
  const TAU = Math.PI * 2;
  const ease = (x) => {
    const t = Math.max(0, Math.min(1, x));
    return t * t * (3 - 2 * t);
  };

  // Small toolkit bound to one THREE instance and one palette.
  function kit(THREE, opts) {
    const accent = new THREE.Color((opts && opts.accent) || "#55ddff");
    const glow = new THREE.Color((opts && opts.glow) || "#ffffff");

    function segments(points, color, opacity) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      const material = new THREE.LineBasicMaterial({
        color: color || accent,
        transparent: true,
        opacity: opacity == null ? 0.7 : opacity,
        depthWrite: false,
      });
      return new THREE.LineSegments(geometry, material);
    }

    function dots(points, color, size) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      const material = new THREE.PointsMaterial({
        color: color || glow,
        size: size || 0.07,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      });
      return new THREE.Points(geometry, material);
    }

    // Rectangle outline in the XY plane, as line segments.
    function rect(x, y, w, h, z) {
      const d = z || 0;
      const a = [x, y, d], b = [x + w, y, d], c = [x + w, y + h, d], e = [x, y + h, d];
      return [...a, ...b, ...b, ...c, ...c, ...e, ...e, ...a];
    }

    function gridXZ(size, cells, y) {
      const out = [];
      const half = size / 2;
      for (let i = 0; i <= cells; i++) {
        const p = -half + (size * i) / cells;
        out.push(-half, y, p, half, y, p, p, y, -half, p, y, half);
      }
      return out;
    }

    function ring(radius, y, steps) {
      const out = [];
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * TAU;
        const b = ((i + 1) / steps) * TAU;
        out.push(Math.cos(a) * radius, y, Math.sin(a) * radius, Math.cos(b) * radius, y, Math.sin(b) * radius);
      }
      return out;
    }

    function boxEdges(w, h, d) {
      const box = new THREE.BoxGeometry(w, h, d);
      const edges = new THREE.EdgesGeometry(box);
      box.dispose();
      return edges;
    }

    function edgeMesh(geometry, color, opacity) {
      return new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({
          color: color || accent,
          transparent: true,
          opacity: opacity == null ? 0.7 : opacity,
          depthWrite: false,
        })
      );
    }

    return { THREE, accent, glow, segments, dots, rect, gridXZ, ring, boxEdges, edgeMesh };
  }

  // Audit: stacked scan planes, a sweep passing through, one cell flagged as the bottleneck.
  function scan(k) {
    const g = new k.THREE.Group();
    const levels = [-0.9, -0.45, 0, 0.45, 0.9];
    levels.forEach((y) => g.add(k.segments(k.gridXZ(2.2, 6, y), k.accent, 0.28)));
    const cell = 2.2 / 6;
    const flag = k.segments(
      [
        0, 0, 0, cell, 0, 0, cell, 0, 0, cell, 0, cell,
        cell, 0, cell, 0, 0, cell, 0, 0, cell, 0, 0, 0,
        0, 0, 0, cell, 0, cell, cell, 0, 0, 0, 0, cell,
      ],
      k.glow,
      1
    );
    flag.position.set(cell * 0.5 - 0.0, 0, -cell * 1.5);
    g.add(flag);
    const sweep = k.segments(k.gridXZ(2.3, 1, 0), k.glow, 0.9);
    g.add(sweep);
    return {
      group: g,
      update(t) {
        sweep.position.y = Math.sin(t * 0.9) * 0.95;
        flag.material.opacity = 0.45 + 0.55 * Math.abs(Math.sin(t * 2.2));
        g.rotation.y = t * 0.18;
        g.rotation.x = 0.42;
      },
    };
  }

  // Agents: a 19×19 board. Stones appear in order; the last one lands where nobody expected.
  function lattice(k) {
    const g = new k.THREE.Group();
    const size = 2.4;
    const board = k.segments(k.gridXZ(size, 18, 0), k.accent, 0.3);
    g.add(board);
    const step = size / 18;
    const at = (col, row) => [-size / 2 + col * step, 0.02, -size / 2 + row * step];
    const moves = [[3, 3], [15, 3], [15, 15], [3, 15], [9, 3], [14, 9], [5, 9], [13, 13], [10, 9]];
    const pts = [];
    moves.forEach((m) => pts.push(...at(m[0], m[1])));
    const stones = k.dots(pts, k.accent, 0.1);
    g.add(stones);
    const [mx, , mz] = at(10, 9);
    const mark = k.segments(k.ring(0.14, 0.03, 24), k.glow, 1);
    mark.position.set(mx, 0, mz);
    g.add(mark);
    const beam = k.segments([mx, 0.03, mz, mx, 1.1, mz], k.glow, 0.8);
    g.add(beam);
    return {
      group: g,
      update(t) {
        const cycle = (t % 7) / 7;
        const shown = Math.min(moves.length, Math.floor(cycle * (moves.length + 3)) + 1);
        stones.geometry.setDrawRange(0, shown);
        const landed = shown >= moves.length;
        mark.visible = beam.visible = landed;
        const pulse = 1 + 0.5 * Math.abs(Math.sin(t * 3));
        mark.scale.set(pulse, 1, pulse);
        beam.material.opacity = 0.3 + 0.5 * Math.abs(Math.sin(t * 3));
        g.rotation.x = 0.85;
        g.rotation.z = Math.sin(t * 0.25) * 0.25;
      },
    };
  }

  // Architecture: encoder and decoder stacks with attention beams crossing between layers.
  function transformer(k) {
    const g = new k.THREE.Group();
    const layers = 6;
    const edge = k.boxEdges(0.8, 0.2, 0.5);
    const beams = [];
    for (let i = 0; i < layers; i++) {
      const y = -0.9 + i * 0.36;
      [-0.75, 0.75].forEach((x) => {
        const block = k.edgeMesh(edge, k.accent, 0.55);
        block.position.set(x, y, 0);
        g.add(block);
      });
      const target = -0.9 + ((i * 2 + 3) % layers) * 0.36;
      const beam = k.segments([-0.35, y, 0, 0.35, target, 0], k.glow, 0.2);
      beams.push(beam);
      g.add(beam);
    }
    g.add(k.segments([-0.75, -1.25, 0, -0.75, -1.02, 0, 0.75, 1.02, 0, 0.75, 1.25, 0], k.accent, 0.8));
    return {
      group: g,
      update(t) {
        beams.forEach((beam, i) => {
          beam.material.opacity = 0.12 + 0.88 * Math.pow(Math.max(0, Math.sin(t * 1.6 - i * 0.9)), 3);
        });
        g.rotation.y = Math.sin(t * 0.3) * 0.5;
      },
    };
  }

  // Sales: a four-stage funnel with deals moving down it.
  function funnel(k) {
    const g = new k.THREE.Group();
    const stages = [[1.2, 0.9], [0.85, 0.3], [0.55, -0.3], [0.3, -0.9]];
    const frame = [];
    stages.forEach(([r, y]) => frame.push(...k.ring(r, y, 40)));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      for (let s = 0; s < stages.length - 1; s++) {
        const [r1, y1] = stages[s];
        const [r2, y2] = stages[s + 1];
        frame.push(Math.cos(a) * r1, y1, Math.sin(a) * r1, Math.cos(a) * r2, y2, Math.sin(a) * r2);
      }
    }
    g.add(k.segments(frame, k.accent, 0.4));
    const count = 26;
    const deals = k.dots(new Array(count * 3).fill(0), k.glow, 0.08);
    g.add(deals);
    const radiusAt = (y) => {
      const u = (0.9 - y) / 1.8;
      return 1.2 - u * 0.9;
    };
    return {
      group: g,
      update(t) {
        const pos = deals.geometry.attributes.position;
        for (let i = 0; i < count; i++) {
          const phase = (t * 0.12 + i / count) % 1;
          const y = 0.9 - phase * 1.8;
          const a = i * 2.399 + t * 0.4;
          const r = radiusAt(y) * 0.8;
          pos.setXYZ(i, Math.cos(a) * r, y, Math.sin(a) * r);
        }
        pos.needsUpdate = true;
        g.rotation.y = t * 0.15;
        g.rotation.x = 0.3;
      },
    };
  }

  // Web: a browser window whose panels slide into place from depth.
  function browser(k) {
    const g = new k.THREE.Group();
    g.add(k.segments([...k.rect(-1.3, -0.85, 2.6, 1.7), -1.3, 0.6, 0, 1.3, 0.6, 0], k.accent, 0.8));
    g.add(k.dots([-1.15, 0.725, 0, -1.02, 0.725, 0, -0.89, 0.725, 0], k.glow, 0.07));
    const panels = [
      k.rect(-1.15, 0.05, 2.3, 0.42),
      k.rect(-1.15, -0.7, 0.7, 0.62),
      k.rect(-0.35, -0.7, 0.7, 0.62),
      k.rect(0.45, -0.7, 0.7, 0.62),
    ].map((points) => {
      const panel = k.segments(points, k.glow, 0);
      g.add(panel);
      return panel;
    });
    return {
      group: g,
      update(t) {
        const cycle = t % 6;
        panels.forEach((panel, i) => {
          const p = ease((cycle - i * 0.5) / 0.9) * (1 - ease((cycle - 5.2) / 0.6));
          panel.position.z = (1 - p) * 1.4;
          panel.material.opacity = p * 0.9;
        });
        g.rotation.y = Math.sin(t * 0.35) * 0.45;
        g.rotation.x = Math.sin(t * 0.22) * 0.12;
      },
    };
  }

  // Automation: a core with connectors reaching out and docking into app nodes.
  function hub(k) {
    const g = new k.THREE.Group();
    const coreSolid = new k.THREE.IcosahedronGeometry(0.42, 0);
    const core = k.edgeMesh(new k.THREE.EdgesGeometry(coreSolid), k.glow, 0.95);
    coreSolid.dispose();
    g.add(core);
    const nodeEdges = k.boxEdges(0.24, 0.24, 0.24);
    const arms = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      const dir = new k.THREE.Vector3(Math.cos(a), (i % 2 ? 0.45 : -0.45), Math.sin(a)).normalize();
      const line = k.segments([0, 0, 0, dir.x, dir.y, dir.z], k.accent, 0.7);
      const node = k.edgeMesh(nodeEdges, k.accent, 0.8);
      node.position.copy(dir).multiplyScalar(1.25);
      g.add(line);
      g.add(node);
      arms.push({ line, node });
    }
    return {
      group: g,
      update(t) {
        arms.forEach((arm, i) => {
          const reach = ease(((t * 0.5 + i * 0.37) % 3) / 1.1);
          arm.line.scale.setScalar(0.42 + reach * (1.13 - 0.42));
          arm.node.material.opacity = 0.3 + reach * 0.7;
          arm.node.rotation.y = t * 0.6 + i;
        });
        core.rotation.x = t * 0.4;
        core.rotation.y = t * 0.55;
        g.rotation.y = t * 0.12;
      },
    };
  }

  // Briefing: loose lines pulling together into a one-page brief.
  function brief(k) {
    const g = new k.THREE.Group();
    g.add(k.segments(k.rect(-0.8, -1.1, 1.6, 2.2), k.accent, 0.85));
    const rows = 9;
    const target = [];
    const scatter = [];
    for (let i = 0; i < rows; i++) {
      const y = 0.8 - i * 0.2;
      const width = i === 0 ? 0.7 : 1.2 - ((i * 37) % 5) * 0.12;
      target.push(-0.6, y, 0, -0.6 + width, y, 0);
      const sx = Math.sin(i * 12.9898) * 2.2;
      const sy = Math.cos(i * 78.233) * 1.8;
      const sz = Math.sin(i * 39.425) * 1.6;
      scatter.push(sx, sy, sz, sx + width, sy + Math.sin(i) * 0.4, sz);
    }
    const lines = k.segments(scatter.slice(), k.glow, 0.9);
    g.add(lines);
    return {
      group: g,
      update(t) {
        const cycle = t % 8;
        const p = ease(cycle / 3) * (1 - ease((cycle - 7) / 1));
        const pos = lines.geometry.attributes.position;
        for (let i = 0; i < target.length; i++) {
          pos.array[i] = scatter[i] + (target[i] - scatter[i]) * p;
        }
        pos.needsUpdate = true;
        g.rotation.y = Math.sin(t * 0.3) * 0.4;
      },
    };
  }

  const BUILDERS = { scan, lattice, transformer, funnel, browser, hub, brief };

  function build(id, THREE, opts) {
    const make = BUILDERS[id] || BUILDERS.scan;
    const made = make(kit(THREE, opts));
    made.update(0);
    return {
      group: made.group,
      update: made.update,
      dispose() {
        const seen = new Set();
        made.group.traverse((node) => {
          [node.geometry, node.material].forEach((res) => {
            if (res && !seen.has(res)) {
              seen.add(res);
              res.dispose();
            }
          });
        });
      },
    };
  }

  return { IDS, build };
});
