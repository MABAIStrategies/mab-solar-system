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

  // ---- Shapes shared by the builders below (all in the XY plane unless noted) ----
  function circle(r, steps, cx, cy, z) {
    const out = [];
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * TAU, b = ((i + 1) / steps) * TAU;
      out.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z || 0, cx + Math.cos(b) * r, cy + Math.sin(b) * r, z || 0);
    }
    return out;
  }
  function path(points, closed) {
    const out = [];
    const n = closed ? points.length : points.length - 1;
    for (let i = 0; i < n; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      out.push(a[0], a[1], a[2] || 0, b[0], b[1], b[2] || 0);
    }
    return out;
  }
  // Toothed wheel outline plus hub and spokes.
  function gear(r, teeth) {
    const pts = [];
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * TAU, step = TAU / teeth;
      const inner = r * 0.82;
      pts.push([Math.cos(a0) * inner, Math.sin(a0) * inner], [Math.cos(a0 + step * 0.18) * r, Math.sin(a0 + step * 0.18) * r]);
      pts.push([Math.cos(a0 + step * 0.5) * r, Math.sin(a0 + step * 0.5) * r], [Math.cos(a0 + step * 0.68) * inner, Math.sin(a0 + step * 0.68) * inner]);
    }
    const out = path(pts, true).concat(circle(r * 0.28, 16, 0, 0, 0));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU;
      out.push(Math.cos(a) * r * 0.28, Math.sin(a) * r * 0.28, 0, Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, 0);
    }
    return out;
  }

  // AI Readiness Audit: a magnifying glass travels along a five-step process and stops on
  // the step where work is piling up.
  function scan(k) {
    const g = new k.THREE.Group();
    const xs = [-1.6, -0.8, 0, 0.8, 1.6];
    const flow = [];
    xs.forEach((x, i) => {
      flow.push(...k.rect(x - 0.26, -0.18, 0.52, 0.36));
      if (i < xs.length - 1) flow.push(x + 0.26, 0, 0, x + 0.54, 0, 0, x + 0.46, 0.07, 0, x + 0.54, 0, 0, x + 0.46, -0.07, 0, x + 0.54, 0, 0);
    });
    g.add(k.segments(flow, k.accent, 0.55));
    // The bottleneck: step four, with a queue stacking up above it.
    const hot = k.segments(k.rect(xs[3] - 0.3, -0.22, 0.6, 0.44), k.glow, 1);
    g.add(hot);
    const queue = [0, 1, 2, 3].map((n) => {
      const bar = k.segments(k.rect(xs[3] - 0.2, 0.34 + n * 0.16, 0.4, 0.09), k.glow, 0.9);
      g.add(bar);
      return bar;
    });
    // Magnifying glass
    const lens = new k.THREE.Group();
    lens.add(k.segments(circle(0.5, 40, 0, 0, 0.25).concat(circle(0.44, 40, 0, 0, 0.25)), k.glow, 0.95));
    lens.add(k.segments([0.36, -0.36, 0.25, 0.86, -0.86, 0.25, 0.42, -0.3, 0.25, 0.92, -0.8, 0.25], k.glow, 0.95));
    g.add(lens);
    g.rotation.x = -0.22;
    return {
      group: g,
      update(t) {
        const cycle = (t * 0.22) % 1; // sweep across, then rest on the bottleneck
        const sweep = cycle < 0.55 ? ease(cycle / 0.55) : 1;
        lens.position.x = -1.9 + sweep * (xs[3] + 1.9);
        lens.position.y = 0.12 + Math.sin(t * 1.3) * 0.04;
        const found = cycle >= 0.55 ? 1 : 0;
        hot.material.opacity = found ? 0.55 + 0.45 * Math.abs(Math.sin(t * 3)) : 0.15;
        queue.forEach((bar, n) => { bar.material.opacity = found ? Math.min(1, Math.max(0, (cycle - 0.55) * 12 - n)) * 0.9 : 0.12; });
        g.rotation.y = Math.sin(t * 0.25) * 0.28;
      },
    };
  }

  // Custom AI Agents: one agent at the center reaching out to four tools in turn
  // (database, mail, calendar, document), with a signal running down each arm.
  function lattice(k) {
    const g = new k.THREE.Group();
    const core = k.edgeMesh(new k.THREE.EdgesGeometry(new k.THREE.IcosahedronGeometry(0.5, 0)), k.glow, 0.95);
    g.add(core);
    g.add(k.segments(circle(0.74, 48, 0, 0, 0), k.accent, 0.35));
    const spots = [[-1.55, 0.85], [1.55, 0.85], [-1.55, -0.85], [1.55, -0.85]];
    const icons = [
      // database: stacked discs
      [...circle(0.26, 20, 0, 0.16, 0), ...circle(0.26, 20, 0, 0, 0), ...circle(0.26, 20, 0, -0.16, 0)].map((v, i) => (i % 3 === 1 ? v * 0.45 + (i % 3 === 1 ? [0.16, 0, -0.16][Math.floor(i / 120)] * 0.9 : 0) : v)),
      // mail: envelope
      [...k.rect(-0.3, -0.2, 0.6, 0.4), -0.3, 0.2, 0, 0, -0.02, 0, 0, -0.02, 0, 0.3, 0.2, 0],
      // calendar: grid with header
      [...k.rect(-0.28, -0.26, 0.56, 0.52), -0.28, 0.12, 0, 0.28, 0.12, 0, -0.09, 0.12, 0, -0.09, -0.26, 0, 0.09, 0.12, 0, 0.09, -0.26, 0, -0.28, -0.07, 0, 0.28, -0.07, 0],
      // document: page with lines
      [...path([[-0.22, -0.3], [0.22, -0.3], [0.22, 0.18], [0.1, 0.3], [-0.22, 0.3]], true), -0.12, 0.1, 0, 0.1, 0.1, 0, -0.12, -0.02, 0, 0.12, -0.02, 0, -0.12, -0.14, 0, 0.06, -0.14, 0],
    ];
    const arms = spots.map(([x, y], n) => {
      const icon = k.segments(icons[n], k.accent, 0.5);
      icon.position.set(x, y, 0);
      g.add(icon);
      const len = Math.hypot(x, y);
      const from = 0.74 / len, to = 1 - 0.42 / len;
      g.add(k.segments([x * from, y * from, 0, x * to, y * to, 0], k.accent, 0.3));
      const pulse = k.dots([0, 0, 0], k.glow, 0.13);
      g.add(pulse);
      return { icon, pulse, x, y, from, to };
    });
    return {
      group: g,
      update(t) {
        core.rotation.set(t * 0.5, t * 0.7, 0);
        const turn = (t * 0.55) % 4;
        arms.forEach((arm, n) => {
          const local = turn - n;
          const on = local >= 0 && local < 1;
          const f = on ? arm.from + (arm.to - arm.from) * ease(local) : arm.from;
          arm.pulse.position.set(arm.x * f, arm.y * f, 0.02);
          arm.pulse.material.opacity = on ? 1 : 0;
          arm.icon.material.opacity = on && local > 0.7 ? 1 : 0.42;
          arm.icon.scale.setScalar(on && local > 0.7 ? 1.12 : 1);
        });
        g.rotation.y = Math.sin(t * 0.3) * 0.35;
        g.rotation.x = Math.sin(t * 0.21) * 0.12;
      },
    };
  }

  // Fractional AI Architecture: a tower drawn like a blueprint. Tiers of rings rise on
  // columns while a spiral climbs through them and dimension marks tick alongside.
  function transformer(k) {
    const g = new k.THREE.Group();
    const tiers = [[1.25, -1.0], [1.0, -0.45], [0.75, 0.1], [0.5, 0.65], [0.25, 1.2]];
    const rings = tiers.map(([r, y]) => {
      const ring = k.segments(k.ring(r, y, 36), k.accent, 0.6);
      g.add(ring);
      return ring;
    });
    const cols = [];
    for (let n = 0; n < tiers.length - 1; n++) {
      const [r0, y0] = tiers[n], [r1, y1] = tiers[n + 1];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        cols.push(Math.cos(a) * r0, y0, Math.sin(a) * r0, Math.cos(a) * r1, y1, Math.sin(a) * r1);
      }
    }
    g.add(k.segments(cols, k.accent, 0.32));
    const spiral = [];
    for (let i = 0; i < 90; i++) {
      const f0 = i / 90, f1 = (i + 1) / 90;
      const r = (f) => 1.25 - f * 1.0, y = (f) => -1.0 + f * 2.2;
      spiral.push(Math.cos(f0 * TAU * 3) * r(f0), y(f0), Math.sin(f0 * TAU * 3) * r(f0), Math.cos(f1 * TAU * 3) * r(f1), y(f1), Math.sin(f1 * TAU * 3) * r(f1));
    }
    const stair = k.segments(spiral, k.glow, 0.9);
    g.add(stair);
    // Dimension line with ticks, as on a drawing.
    const dim = [1.7, -1.0, 0, 1.7, 1.2, 0];
    tiers.forEach(([, y]) => dim.push(1.62, y, 0, 1.78, y, 0));
    const marks = k.segments(dim, k.glow, 0.6);
    g.add(marks);
    const beacon = k.dots([0, 1.38, 0], k.glow, 0.16);
    g.add(beacon);
    g.rotation.x = 0.3;
    g.scale.setScalar(0.74); // tall shape: keep it inside the panel header on short screens
    return {
      group: g,
      update(t) {
        const built = (t * 0.35) % (tiers.length + 1.5);
        rings.forEach((ring, n) => { ring.material.opacity = built > n ? 0.75 : 0.14; });
        stair.geometry.setDrawRange(0, Math.max(2, Math.floor(Math.min(1, built / tiers.length) * 90) * 2));
        beacon.material.opacity = built > tiers.length ? 0.5 + 0.5 * Math.abs(Math.sin(t * 4)) : 0;
        g.rotation.y = t * 0.22;
        marks.rotation.y = -t * 0.22; // the dimension line stays facing the viewer
      },
    };
  }

  // AI Sales Systems: a funnel. Leads drop in at the wide end, thin out stage by stage,
  // and closed deals come out of the spout.
  function funnel(k) {
    const g = new k.THREE.Group();
    const stages = [[1.35, 1.0], [1.0, 0.45], [0.66, -0.1], [0.36, -0.6], [0.16, -1.05]];
    stages.forEach(([r, y], n) => g.add(k.segments(k.ring(r, y, 36), n === 0 ? k.glow : k.accent, n === 0 ? 0.9 : 0.6)));
    const sides = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      for (let n = 0; n < stages.length - 1; n++) {
        const [r0, y0] = stages[n], [r1, y1] = stages[n + 1];
        sides.push(Math.cos(a) * r0, y0, Math.sin(a) * r0, Math.cos(a) * r1, y1, Math.sin(a) * r1);
      }
    }
    g.add(k.segments(sides, k.accent, 0.25));
    g.add(k.segments([0.16, -1.05, 0, 0.16, -1.35, 0, -0.16, -1.05, 0, -0.16, -1.35, 0], k.accent, 0.5));
    const COUNT = 26;
    const seeds = Array.from({ length: COUNT }, (_, i) => ({ a: (i * 2.399) % TAU, off: (i * 0.137) % 1, depth: i % 4 === 0 ? 1 : i % 4 === 1 ? 0.75 : i % 2 ? 0.5 : 0.3 }));
    const leads = k.dots(new Array(COUNT * 3).fill(0), k.glow, 0.09);
    g.add(leads);
    const won = k.dots([0, -1.5, 0], k.glow, 0.2);
    g.add(won);
    const rAt = (f) => { // radius along the funnel, f 0..1 from top to spout
      const x = f * (stages.length - 1), n = Math.min(stages.length - 2, Math.floor(x));
      return stages[n][0] + (stages[n + 1][0] - stages[n][0]) * (x - n);
    };
    g.rotation.x = 0.38;
    g.scale.setScalar(0.78);
    return {
      group: g,
      update(t) {
        const pos = leads.geometry.attributes.position;
        seeds.forEach((sd, i) => {
          const f = Math.min(sd.depth, ((t * 0.16 + sd.off) % 1) * 1.15); // most leads stall before the spout
          const r = rAt(f) * 0.7, a = sd.a + t * 0.5 + f * 4;
          pos.setXYZ(i, Math.cos(a) * r, 1.0 - f * 2.05, Math.sin(a) * r);
        });
        pos.needsUpdate = true;
        won.material.opacity = 0.35 + 0.65 * Math.abs(Math.sin(t * 2.4));
        won.position.y = -1.5 - ((t * 0.6) % 1) * 0.3;
        g.rotation.y = t * 0.2;
      },
    };
  }

  // Conversion Web Experiences: a browser window whose sections slide into place in
  // layers, then a cursor lands on the call-to-action and it pulses.
  function browser(k) {
    const g = new k.THREE.Group();
    const frame = [...k.rect(-1.5, -1.0, 3.0, 2.0), -1.5, 0.72, 0, 1.5, 0.72, 0, ...circle(0.05, 10, -1.32, 0.86, 0), ...circle(0.05, 10, -1.16, 0.86, 0), ...circle(0.05, 10, -1.0, 0.86, 0), ...k.rect(-0.7, 0.8, 1.9, 0.12)];
    g.add(k.segments(frame, k.accent, 0.75));
    const layer = (pts, z, color, opacity) => { const m = k.segments(pts, color, opacity); m.position.z = z; g.add(m); return m; };
    const hero = layer([...k.rect(-1.3, 0.0, 1.5, 0.55), -1.3, 0.38, 0, -0.2, 0.38, 0, -1.3, 0.24, 0, -0.5, 0.24, 0], 0.18, k.glow, 0.85);
    const art = layer([...circle(0.3, 28, 0.85, 0.27, 0), ...circle(0.46, 34, 0.85, 0.27, 0)], 0.36, k.accent, 0.7);
    const cards = [-1.3, -0.4, 0.5].map((x, n) => layer(k.rect(x, -0.85, 0.8, 0.6), 0.12 + n * 0.06, k.accent, 0.6));
    const cta = layer(k.rect(-1.3, -0.14, 0.62, 0.2), 0.42, k.glow, 1);
    const ripple = layer(circle(0.2, 24, -0.99, -0.04, 0), 0.44, k.glow, 0);
    const cursor = layer(path([[0, 0], [0, -0.34], [0.09, -0.26], [0.16, -0.4], [0.21, -0.37], [0.14, -0.24], [0.26, -0.24]], true), 0.5, k.glow, 1);
    g.rotation.x = -0.12;
    return {
      group: g,
      update(t) {
        const c = (t * 0.28) % 1;
        const slide = (m, start) => { const f = ease((c - start) / 0.16); m.position.y = (1 - f) * -0.5; m.material.opacity = f * 0.85; };
        slide(hero, 0.02); slide(art, 0.12);
        cards.forEach((m, n) => slide(m, 0.2 + n * 0.07));
        cta.material.opacity = c > 0.42 ? 1 : 0.1;
        const move = ease((c - 0.5) / 0.22);
        cursor.position.x = 1.1 - move * 2.0; cursor.position.y = -0.7 + move * 0.72;
        const click = c > 0.74 ? (c - 0.74) / 0.26 : -1;
        ripple.material.opacity = click >= 0 ? 1 - click : 0;
        ripple.scale.setScalar(click >= 0 ? 1 + click * 1.6 : 1);
        g.rotation.y = 0.5 + Math.sin(t * 0.4) * 0.22;
      },
    };
  }

  // Workflow Automation: three meshed gears turning, driving a belt that carries work
  // from one system to the next without anyone touching it.
  function hub(k) {
    const g = new k.THREE.Group();
    const defs = [[-0.75, 0.25, 0.7, 12, 1], [0.38, 0.52, 0.46, 8, -1.5], [0.9, -0.12, 0.34, 6, 2]];
    const gears = defs.map(([x, y, r, teeth, speed], n) => {
      const m = k.segments(gear(r, teeth), n === 0 ? k.glow : k.accent, n === 0 ? 0.9 : 0.7);
      m.position.set(x, y, 0);
      g.add(m);
      return { m, speed };
    });
    g.add(k.segments([-1.7, -0.92, 0, 1.7, -0.92, 0, -1.7, -1.06, 0, 1.7, -1.06, 0, ...circle(0.07, 12, -1.7, -0.99, 0), ...circle(0.07, 12, 1.7, -0.99, 0)], k.accent, 0.55));
    const boxes = [0, 1, 2, 3].map(() => { const b = k.segments(k.rect(-0.14, 0, 0.28, 0.24), k.glow, 0.95); g.add(b); return b; });
    g.rotation.x = -0.1;
    return {
      group: g,
      update(t) {
        gears.forEach(({ m, speed }) => { m.rotation.z = t * 0.6 * speed; });
        boxes.forEach((b, n) => {
          const f = (t * 0.18 + n / boxes.length) % 1;
          b.position.set(-1.6 + f * 3.2, -0.9, 0.02);
          b.material.opacity = Math.min(1, f * 8, (1 - f) * 8);
        });
        g.rotation.y = Math.sin(t * 0.35) * 0.4;
      },
    };
  }

  // The briefing: a page that writes itself line by line, then gets its check mark.
  function brief(k) {
    const g = new k.THREE.Group();
    g.add(k.segments(path([[-0.85, -1.15], [0.85, -1.15], [0.85, 0.8], [0.5, 1.15], [-0.85, 1.15]], true).concat([0.5, 1.15, 0, 0.5, 0.8, 0, 0.5, 0.8, 0, 0.85, 0.8, 0]), k.accent, 0.8));
    const widths = [1.1, 1.3, 0.9, 1.25, 0.7];
    const lines = widths.map((w, n) => { const m = k.segments([-0.62, 0.72 - n * 0.3, 0.02, -0.62 + w, 0.72 - n * 0.3, 0.02], k.glow, 0.9); g.add(m); return m; });
    const seal = k.segments(circle(0.3, 30, 0.38, -0.78, 0.04), k.glow, 0.9);
    const tick = k.segments(path([[0.24, -0.78, 0.04], [0.34, -0.9, 0.04], [0.54, -0.64, 0.04]]), k.glow, 1);
    g.add(seal, tick);
    return {
      group: g,
      update(t) {
        const c = (t * 0.2) % 1;
        lines.forEach((m, n) => { const f = ease((c - n * 0.12) / 0.12); m.scale.x = Math.max(0.001, f); m.position.x = -0.62 * (1 - Math.max(0.001, f)); });
        const done = c > 0.68;
        seal.material.opacity = done ? 0.9 : 0.12;
        tick.material.opacity = done ? 0.6 + 0.4 * Math.abs(Math.sin(t * 3)) : 0;
        g.rotation.y = Math.sin(t * 0.45) * 0.5;
        g.rotation.x = -0.08;
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
