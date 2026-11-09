/**
 * MAB Solar System v3
 * - Fast first paint (simple spheres → async hi-fi maps)
 * - Non-linear camera ride (pitch/yaw/strafe, not straight Z)
 * - Strongly differentiated planet themes
 * - Piloted anomaly craft + clean reward signal from hub
 */
(function () {
  "use strict";

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("space-canvas");
  if (!canvas || typeof THREE === "undefined") {
    window.MABSpace = {
      setProgress() {},
      getProgress: () => 0,
      reduceMotion,
      ready: true,
    };
    window.dispatchEvent(new CustomEvent("mab:scene-ready"));
    return;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    alpha: false,
  });
  renderer.setClearColor(0x010208, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x010208, 0.011);

  const START_CAMERA_Z = 2.5;
  const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.08, 1100);
  camera.position.set(0.18, 0.62, START_CAMERA_Z);

  // Lights
  scene.add(new THREE.AmbientLight(0x12182a, 0.4));
  const key = new THREE.DirectionalLight(0xf4f8ff, 1.45);
  key.position.set(5, 9, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x66e0ff, 0.65);
  rim.position.set(-7, 2, -5);
  scene.add(rim);

  const themeLights = [];
  function addPoint(color, intensity, x, y, z) {
    const l = new THREE.PointLight(color, intensity, 55, 2);
    l.position.set(x, y, z);
    scene.add(l);
    themeLights.push(l);
    return l;
  }
  addPoint(0xa5e7ff, 0.95, 1, 0, -6); // arctic
  addPoint(0xff4f17, 1.35, -3, 1, -27); // lava
  addPoint(0x38d9ff, 1.2, 3, 0, -49); // ocean
  addPoint(0xffa238, 1.15, -2, 1, -71); // desert
  addPoint(0x48ff86, 1.1, 2, 0.5, -93); // jungle
  addPoint(0x55cfff, 1.15, -3, 0.5, -115); // city
  addPoint(0xffd86a, 1.45, 0, 1, -139); // singularity

  // ── Fast procedural textures (512–768, vectorized-ish loops) ──
  function hash(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, oct) {
    let v = 0, a = 0.5, f = 1;
    for (let i = 0; i < (oct || 4); i++) {
      v += a * noise(x * f, y * f);
      f *= 2.05;
      a *= 0.5;
    }
    return v;
  }

  function makeMap(theme, size) {
    size = size || 640;
    const width = size * 2;
    const height = size;
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    const img = ctx.createImageData(width, height);
    const d = img.data;

    for (let y = 0; y < height; y++) {
      const lat = (y / Math.max(1, height - 1) - 0.5) * 2;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const lon = (x / Math.max(1, width - 1)) * Math.PI * 2 - Math.PI;
        const wrapX = Math.cos(lon);
        const wrapY = Math.sin(lon);

        let r, g, b;
        // Circle coordinates make the seam continuous at -π / +π.
        const n = fbm(
          wrapX * 2.5 + theme.seed,
          wrapY * 2.5 + lat * 3.2 + theme.seed,
          4
        );
        const n2 = fbm(
          wrapX * 8.5 + 3,
          wrapY * 8.5 + lat * 7.5 + 2,
          3
        );

        switch (theme.kind) {
          case "lava": {
            // obsidian crust split by incandescent lava channels
            const crack = Math.max(0, 1 - Math.abs(Math.sin((n * 13 + n2 * 7) * Math.PI)) * 12);
            const heat = Math.pow(Math.max(0, n2 - 0.54) / 0.46, 2);
            r = 18 + n * 18 + crack * 230 + heat * 130;
            g = 8 + n2 * 10 + crack * 62 + heat * 35;
            b = 7 + crack * 4;
            break;
          }
          case "ocean": {
            const deep = n * 0.55 + n2 * 0.2;
            r = 8 + deep * 30;
            g = 60 + deep * 120;
            b = 110 + deep * 130;
            // foam / shallows
            if (n > 0.62) {
              r = 180; g = 230; b = 240;
            }
            // storm swirls
            if (n2 > 0.78) {
              r *= 0.5; g *= 0.7; b *= 1.1;
            }
            break;
          }
          case "desert": {
            const dune = Math.sin(lat * 14 + n * 6) * 0.5 + 0.5;
            r = 140 + dune * 90 + n2 * 30;
            g = 90 + dune * 70 + n * 20;
            b = 40 + dune * 25;
            // rock plateaus
            if (n > 0.7) {
              r = 90; g = 70; b = 55;
            }
            break;
          }
          case "jungle": {
            const veg = n * 0.7 + n2 * 0.3;
            r = 18 + veg * 40;
            g = 70 + veg * 140;
            b = 30 + veg * 50;
            // canopy highlights
            if (n2 > 0.65) {
              r = 60; g = 180; b = 70;
            }
            // river veins
            if (Math.abs(n - 0.45) < 0.03) {
              r = 30; g = 90; b = 140;
            }
            // cloud wisps
            if (n > 0.82) {
              r = 220; g = 240; b = 245;
            }
            break;
          }
          case "arctic": {
            const ice = n * 0.6 + Math.abs(lat) * 0.4;
            r = 160 + ice * 70;
            g = 190 + ice * 50;
            b = 220 + ice * 35;
            if (n2 > 0.7) {
              r = 80; g = 110; b = 140; // crevasse
            }
            break;
          }
          case "city": {
            const blocks = Math.max(
              0,
              1 - Math.min(Math.abs((n * 34) % 1 - 0.5), Math.abs((n2 * 46) % 1 - 0.5)) * 10
            );
            const district = n * 0.55 + n2 * 0.45;
            r = 18 + district * 26 + blocks * 120;
            g = 28 + district * 40 + blocks * 150;
            b = 52 + district * 60 + blocks * 190;
            if (n2 > 0.82) { r = 255; g = 72; b = 170; }
            break;
          }
          case "singularity": {
            // dark body with hot accretion tones near equator
            const ring = Math.exp(-Math.pow(lat * 4.5, 2));
            r = 5 + ring * 205 + n * 18;
            g = 4 + ring * 136 + n2 * 12;
            b = 9 + ring * 48;
            break;
          }
          default: {
            r = 80 + n * 100;
            g = 90 + n2 * 80;
            b = 120 + n * 60;
          }
        }

        d[i] = Math.min(255, Math.max(0, r));
        d[i + 1] = Math.min(255, Math.max(0, g));
        d[i + 2] = Math.min(255, Math.max(0, b));
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return tex;
  }

  function makeGlow(color, size) {
    const s = size || 256;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, color);
    g.addColorStop(0.3, color.replace(/[\d.]+\)$/, "0.4)"));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  let cloudTexture;
  function getCloudTexture() {
    if (cloudTexture) return cloudTexture;
    const width = 512;
    const height = 256;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const image = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      const lat = (y / (height - 1) - 0.5) * 2;
      for (let x = 0; x < width; x++) {
        const lon = (x / (width - 1)) * Math.PI * 2 - Math.PI;
        const c = Math.cos(lon);
        const s = Math.sin(lon);
        const cloud = fbm(c * 4.2 + 19, s * 4.2 + lat * 5.8 + 8, 4);
        const alpha = Math.max(0, Math.min(255, (cloud - 0.49) * 760));
        const i = (y * width + x) * 4;
        image.data[i] = 238;
        image.data[i + 1] = 248;
        image.data[i + 2] = 255;
        image.data[i + 3] = alpha;
      }
    }
    ctx.putImageData(image, 0, 0);
    cloudTexture = new THREE.CanvasTexture(canvas);
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    cloudTexture.wrapS = THREE.RepeatWrapping;
    cloudTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return cloudTexture;
  }

  function makeGalaxy(seed) {
    const s = 768;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d");
    const core = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.16);
    core.addColorStop(0, "rgba(255,240,210,0.95)");
    core.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, s, s);
    ctx.globalCompositeOperation = "lighter";
    const arms = [
      [120, 100, 255],
      [0, 200, 255],
      [255, 120, 180],
    ];
    for (let arm = 0; arm < 3; arm++) {
      const col = arms[arm];
      for (let i = 0; i < 700; i++) {
        const t = i / 700;
        const ang = t * Math.PI * 2.6 + arm * 2.0 + seed;
        const rad = t * s * 0.4;
        const j = (hash(i * 0.1, arm + seed) - 0.5) * 36;
        const x = s / 2 + Math.cos(ang) * rad + j;
        const y = s / 2 + Math.sin(ang) * rad * 0.52 + j * 0.4;
        const a = (1 - t) * 0.28 * (0.5 + hash(x, y));
        ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.7 + hash(i, arm) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ── Stars (moderate count for perf) ──
  const starGroup = new THREE.Group();
  scene.add(starGroup);
  const starMats = [
    "rgba(255,255,255,0.95)",
    "rgba(170,210,255,0.95)",
    "rgba(255,230,190,0.9)",
    "rgba(200,180,255,0.9)",
  ].map(
    (col) =>
      new THREE.SpriteMaterial({
        map: makeGlow(col, 96),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
  );
  const STAR_N = reduceMotion ? 280 : 900;
  for (let i = 0; i < STAR_N; i++) {
    const sp = new THREE.Sprite(starMats[i % starMats.length].clone());
    const r = 35 + Math.random() * 150;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    sp.position.set(
      r * Math.sin(ph) * Math.cos(th),
      r * Math.sin(ph) * Math.sin(th) * 0.55,
      -Math.random() * 220
    );
    const sc = 0.05 + Math.random() * (Math.random() > 0.98 ? 0.75 : 0.25);
    sp.scale.set(sc, sc, 1);
    sp.material.opacity = 0.25 + Math.random() * 0.7;
    starGroup.add(sp);
  }

  // Galaxies + nebulae (inspiration: deep field / jets)
  const galaxies = [];
  [
    { x: -20, y: 7, z: -40, s: 58, seed: 1.1 },
    { x: 24, y: -5, z: -78, s: 72, seed: 2.4 },
    { x: -14, y: 9, z: -110, s: 50, seed: 0.6 },
  ].forEach((g) => {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGalaxy(g.seed),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.5,
      })
    );
    sp.position.set(g.x, g.y, g.z);
    sp.scale.set(g.s, g.s * 0.55, 1);
    scene.add(sp);
    galaxies.push(sp);
  });

  [
    ["rgba(80,40,200,0.9)", -12, 4, -25, 30],
    ["rgba(0,180,255,0.85)", 14, -3, -55, 34],
    ["rgba(255,60,120,0.75)", -8, 2, -88, 28],
    ["rgba(40,200,100,0.7)", 10, -2, -105, 26],
  ].forEach((n, i) => {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlow(n[0], 384),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.16,
      })
    );
    sp.position.set(n[1], n[2], n[3]);
    sp.scale.set(n[4], n[4] * 0.6, 1);
    scene.add(sp);
    galaxies.push(sp);
  });

  // ── Planets (instant placeholders → async maps) ──
  const SEG = reduceMotion ? 48 : 96;
  const stations = [];

  const PLANET_DEFS = [
    {
      id: "origin",
      theme: "arctic",
      x: 1.05,
      y: -0.2,
      z: -6.2,
      r: 1.18,
      spin: 0.055,
      atmo: 0xa5e7ff,
      glow: "rgba(190,240,255,0.92)",
      ring: 0xbcefff,
      moons: 0,
      seed: 1.1,
    },
    {
      id: "mechanism",
      theme: "lava",
      x: -3.0,
      y: 0.9,
      z: -27,
      r: 1.3,
      spin: 0.115,
      atmo: 0xff5a12,
      glow: "rgba(255,72,12,0.92)",
      ring: null,
      moons: 2,
      seed: 2.3,
    },
    {
      id: "services",
      theme: "ocean",
      x: 3.5,
      y: -0.7,
      z: -49,
      r: 1.6,
      spin: 0.075,
      atmo: 0x38d9ff,
      glow: "rgba(56,217,255,0.88)",
      ring: 0x7df4fc,
      moons: 1,
      seed: 3.7,
    },
    {
      id: "proof",
      theme: "desert",
      x: -2.65,
      y: 1.25,
      z: -71,
      r: 1.15,
      spin: 0.13,
      atmo: 0xffa238,
      glow: "rgba(255,136,40,0.84)",
      ring: null,
      moons: 0,
      seed: 0.9,
    },
    {
      id: "command",
      theme: "jungle",
      x: 3.05,
      y: -0.35,
      z: -93,
      r: 1.72,
      spin: 0.065,
      atmo: 0x4dff88,
      glow: "rgba(66,255,125,0.84)",
      ring: 0x9dffb4,
      moons: 2,
      seed: 4.4,
    },
    {
      id: "enterprise",
      theme: "city",
      x: -3.15,
      y: 0.55,
      z: -115,
      r: 1.48,
      spin: 0.055,
      atmo: 0x56cfff,
      glow: "rgba(81,197,255,0.88)",
      ring: 0xff5cad,
      moons: 1,
      seed: 6.2,
    },
    {
      id: "convergence",
      theme: "singularity",
      x: 0.15,
      y: 0.25,
      z: -139,
      r: 1.58,
      spin: 0.045,
      atmo: 0xffe79a,
      glow: "rgba(255,221,122,0.94)",
      ring: 0xffe082,
      moons: 0,
      seed: 5.2,
      blackHole: true,
    },
  ];
  const firstPlanetTarget = new THREE.Vector3(
    PLANET_DEFS[0].x,
    PLANET_DEFS[0].y,
    PLANET_DEFS[0].z
  );

  function addPlanet(cfg) {
    const group = new THREE.Group();
    group.position.set(cfg.x, cfg.y, cfg.z);
    group.userData.theme = cfg.theme;
    group.userData.id = cfg.id;

    // Instant solid-color placeholder (hi-fi maps bake async)
    const colors = {
      arctic: 0xaadceb,
      lava: 0x471109,
      ocean: 0x083f68,
      desert: 0xb65c16,
      jungle: 0x124b2c,
      city: 0x162a4c,
      singularity: 0x120c08,
    };

    const mat = new THREE.MeshPhysicalMaterial({
      color: colors[cfg.theme] || 0x334455,
      roughness:
        cfg.theme === "ocean" ? 0.2 :
        cfg.theme === "arctic" ? 0.32 :
        cfg.theme === "lava" ? 0.68 : 0.45,
      metalness: cfg.theme === "city" ? 0.32 : cfg.theme === "lava" ? 0.18 : 0.08,
      clearcoat: cfg.theme === "ocean" ? 0.82 : cfg.theme === "arctic" ? 0.62 : 0.35,
      clearcoatRoughness: cfg.theme === "ocean" ? 0.12 : 0.25,
      emissive:
        cfg.theme === "lava" ? new THREE.Color(0x6a1300) :
        cfg.theme === "city" ? new THREE.Color(0x101f4a) :
        cfg.theme === "singularity" ? new THREE.Color(0x6a2600) : new THREE.Color(cfg.atmo),
      emissiveIntensity:
        cfg.theme === "singularity" ? 0.42 :
        cfg.theme === "lava" ? 0.26 :
        cfg.theme === "city" ? 0.14 : 0.025,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.r, SEG, SEG), mat);
    group.add(mesh);

    // Fresnel atmosphere: a real planetary rim instead of a flat translucent shell.
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(cfg.r * 1.12, 64, 64),
      new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(cfg.atmo) },
          strength: { value: cfg.theme === "lava" ? 0.82 : 0.62 },
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          uniform float strength;
          varying vec3 vNormal;
          void main() {
            float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.35);
            gl_FragColor = vec4(glowColor, rim * strength);
          }
        `,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    group.add(atmo);

    // Independent cloud/weather shell for living and inhabited worlds.
    if (["arctic", "ocean", "jungle", "city"].includes(cfg.theme)) {
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(cfg.r * 1.018, 72, 72),
        new THREE.MeshBasicMaterial({
          map: getCloudTexture(),
          color: cfg.theme === "city" ? 0xa9d8ff : 0xffffff,
          transparent: true,
          opacity: cfg.theme === "ocean" ? 0.3 : 0.22,
          alphaTest: 0.012,
          depthWrite: false,
        })
      );
      clouds.rotation.z = -0.06;
      group.add(clouds);
      group.userData.clouds = clouds;
    }

    // Halo
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlow(cfg.glow, 256),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.48,
      })
    );
    halo.scale.set(cfg.r * 6.2, cfg.r * 6.2, 1);
    group.add(halo);

    // Rings / accretion
    if (cfg.ring) {
      if (cfg.blackHole) {
        // Interstellar-style accretion disk (bright thin torus + wide ring)
        const disk = new THREE.Mesh(
          new THREE.RingGeometry(cfg.r * 1.35, cfg.r * 2.8, 128),
          new THREE.MeshBasicMaterial({
            color: cfg.ring,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        disk.rotation.x = Math.PI / 2.05;
        group.add(disk);
        const photon = new THREE.Mesh(
          new THREE.TorusGeometry(cfg.r * 1.55, cfg.r * 0.04, 24, 128),
          new THREE.MeshBasicMaterial({
            color: 0xfff3c4,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
          })
        );
        photon.rotation.x = Math.PI / 2.05;
        group.add(photon);
        group.userData.ring = disk;
        group.userData.photon = photon;

        // Event horizon already dark via material; add silhouette core
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(cfg.r * 0.55, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        group.add(core);
      } else {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(cfg.r * 1.55, cfg.r * 0.04, 24, 96),
          new THREE.MeshPhysicalMaterial({
            color: cfg.ring,
            emissive: new THREE.Color(cfg.ring),
            emissiveIntensity: 0.25,
            transparent: true,
            opacity: 0.75,
            roughness: 0.35,
            metalness: 0.4,
          })
        );
        ring.rotation.x = Math.PI * 0.48;
        ring.rotation.y = 0.35;
        group.add(ring);
        group.userData.ring = ring;
      }
    }

    if (cfg.moons) {
      for (let m = 0; m < cfg.moons; m++) {
        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(cfg.r * (0.09 + m * 0.03), 24, 24),
          new THREE.MeshStandardMaterial({ color: 0xc9d2dc, roughness: 0.75 })
        );
        group.add(moon);
        group.userData["moon" + m] = moon;
      }
    }

    scene.add(group);
    const st = {
      group,
      mesh,
      mat,
      id: cfg.id,
      theme: cfg.theme,
      spin: cfg.spin,
      baseX: cfg.x,
      baseY: cfg.y,
      z: cfg.z,
      r: cfg.r,
      seed: cfg.seed,
      kind: cfg.theme,
    };
    stations.push(st);
    return st;
  }

  PLANET_DEFS.forEach(addPlanet);

  // Blue energy tunnel wisps near mid journey (inspiration #2)
  const tunnelGroup = new THREE.Group();
  scene.add(tunnelGroup);
  for (let i = 0; i < 12; i++) {
    const tor = new THREE.Mesh(
      new THREE.TorusGeometry(2.2 + i * 0.15, 0.015, 8, 64),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.08 + (i % 3) * 0.03,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    tor.position.z = -48 - i * 1.2;
    tor.rotation.x = Math.PI / 2;
    tunnelGroup.add(tor);
  }

  // Path ribbon — curving ride
  const pathPts = [];
  for (let i = 0; i <= 140; i++) {
    const t = i / 140;
    pathPts.push(
      new THREE.Vector3(
        Math.sin(t * Math.PI * 3.1) * 2.4 + Math.sin(t * Math.PI * 1.3) * 0.8,
        Math.cos(t * Math.PI * 2.4) * 1.3 + Math.sin(t * Math.PI * 4) * 0.35,
        -t * 140
      )
    );
  }
  const pathCurve = new THREE.CatmullRomCurve3(pathPts);
  scene.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(pathCurve, 320, 0.012, 8, false),
      new THREE.MeshBasicMaterial({
        color: 0x88e0ff,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
  );

  // ── Piloted shuttle anomaly ──
  const shuttle = new THREE.Group();
  const hullMat = new THREE.MeshPhysicalMaterial({
    color: 0xe8eef6,
    metalness: 0.88,
    roughness: 0.2,
    clearcoat: 0.85,
  });
  const accentMat = new THREE.MeshPhysicalMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 1.1,
    metalness: 0.4,
    roughness: 0.25,
  });
  const fuse = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.34, 8, 16), hullMat);
  fuse.rotation.z = Math.PI / 2;
  shuttle.add(fuse);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.16, 16), hullMat);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 0.28;
  shuttle.add(nose);
  // Cockpit canopy
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshPhysicalMaterial({
      color: 0x66d9ff,
      transparent: true,
      opacity: 0.55,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.4,
    })
  );
  canopy.position.set(0.06, 0.045, 0);
  canopy.rotation.z = -0.3;
  shuttle.add(canopy);
  // Little pilot (helmet + body)
  const pilot = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.012, 0.02, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b })
  );
  body.position.y = -0.005;
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.014, 12, 12),
    new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.35,
      metalness: 0.3,
      roughness: 0.25,
    })
  );
  helmet.position.y = 0.018;
  // visor stripe
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.006, 0.018),
    new THREE.MeshBasicMaterial({ color: 0x0ea5e9 })
  );
  visor.position.set(0.01, 0.018, 0);
  pilot.add(body, helmet, visor);
  pilot.position.set(0.05, 0.02, 0);
  shuttle.add(pilot);

  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.014, 0.28), hullMat);
  wingL.position.set(-0.02, 0, 0.15);
  const wingR = wingL.clone();
  wingR.position.z = -0.15;
  shuttle.add(wingL, wingR);
  const eng = new THREE.Mesh(new THREE.SphereGeometry(0.048, 16, 16), accentMat);
  eng.position.x = -0.28;
  shuttle.add(eng);
  const engGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlow("rgba(0,229,255,0.95)", 128),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  engGlow.position.set(-0.36, 0, 0);
  engGlow.scale.set(0.5, 0.5, 1);
  shuttle.add(engGlow);
  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 12, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  shuttle.add(hit);
  shuttle.scale.setScalar(1.55);
  shuttle.visible = false;
  scene.add(shuttle);

  let shuttleState = { active: false, t: 0, clicked: false, nextAt: 4.5, cooldown: 0 };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  window.addEventListener("click", (e) => {
    if (
      e.target.closest(
        "a,button,input,textarea,select,.aperture-stage,.nav-pill,.journey-rail,#anomaly-reward,#intro,#world-journey"
      )
    )
      return;
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    // A parked viewer can enter by clicking the physical planet itself.
    const planetHit = raycaster.intersectObjects(
      stations.map((station) => station.mesh),
      false
    )[0];
    if (planetHit) {
      const station = stations.find((candidate) => candidate.mesh === planetHit.object);
      if (
        station &&
        window.MABHub?.activeStation?.() === station.id &&
        window.MABWorldJourney?.open(station.id)
      ) {
        return;
      }
    }

    if (!shuttle.visible || shuttleState.clicked) return;
    if (raycaster.intersectObject(hit, false).length) {
      shuttleState.clicked = true;
      shuttleState.t = 0;
      window.dispatchEvent(new CustomEvent("mab:shuttle"));
    }
  });

  // Camera / mouse — locked until user starts scrolling the journey
  let progress = 0;
  let mx = 0,
    my = 0,
    smx = 0,
    smy = 0;
  let mouseEnabled = false; // still frame on landing
  const camPos = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();

  window.addEventListener(
    "pointermove",
    (e) => {
      if (!mouseEnabled) return;
      mx = (e.clientX / innerWidth) * 2 - 1;
      my = (e.clientY / innerHeight) * 2 - 1;
    },
    { passive: true }
  );

  function setProgress(p) {
    progress = Math.max(0, Math.min(1, p));
  }

  function setMouseEnabled(on) {
    mouseEnabled = !!on;
    if (!mouseEnabled) {
      mx = my = 0;
      // ease smx/smy to 0 in frame loop
    }
  }

  function pathAt(t) {
    // Multi-axis ride while scrolling; at rest t~0 path is stable
    const x =
      Math.sin(t * Math.PI * 3.05) * 2.6 +
      Math.sin(t * Math.PI * 1.4) * 1.1 +
      Math.cos(t * Math.PI * 5.2) * 0.35;
    const y =
      Math.cos(t * Math.PI * 2.35) * 1.45 +
      Math.sin(t * Math.PI * 4.1) * 0.55 +
      Math.sin(t * Math.PI * 0.7) * 0.4;
    const z = START_CAMERA_Z - t * 156;
    return { x, y, z };
  }

  function resize() {
    const w = innerWidth,
      h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener("resize", resize);

  let last = performance.now();
  let elapsed = 0;

  function spawnShuttle() {
    shuttleState.active = true;
    shuttleState.t = 0;
    shuttleState.clicked = false;
    shuttle.visible = true;
    shuttle.scale.setScalar(1.55);
    accentMat.emissiveIntensity = 1.1;
    const p = pathAt(progress);
    shuttle.position.set(p.x - 6.5, p.y + 1.2, p.z - 5);
    shuttle.rotation.set(0.1, 0.25, 0);
  }

  // Expose API early so intro can complete even while maps bake
  window.MABSpace = {
    setProgress,
    getProgress: () => progress,
    setMouseEnabled,
    stations,
    camera,
    reduceMotion,
    ready: false,
  };

  // First frame ASAP with placeholders
  function firstPaint() {
    const p = pathAt(0);
    camera.position.set(p.x, p.y + 0.15, p.z);
    camera.lookAt(firstPlanetTarget);
    renderer.render(scene, camera);
    window.MABSpace.ready = true;
    window.dispatchEvent(new CustomEvent("mab:scene-ready"));
    if (window.MABIntro) window.MABIntro.setProgress(0.85);
  }
  firstPaint();

  // Async hi-fi planet skins (local seamless 2:1 textures, procedural fallback).
  const planetTextureLoader = new THREE.TextureLoader();
  let mapQueue = stations.map((s) => s);

  function applyPlanetTexture(st, tex) {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
    st.mat.map = tex;
    st.mat.bumpMap = tex;
    if (["lava", "city", "singularity"].includes(st.theme)) st.mat.emissiveMap = tex;
    st.mat.bumpScale =
      st.theme === "ocean" ? 0.012 :
      st.theme === "arctic" ? 0.028 :
      st.theme === "city" ? 0.055 : 0.038;
    st.mat.needsUpdate = true;
  }

  function finishPlanetMap() {
    const done = stations.length - mapQueue.length;
    if (window.MABIntro) {
      window.MABIntro.setProgress(0.85 + (done / stations.length) * 0.12);
    }
    setTimeout(bakeNextMap, 12);
  }

  function bakeNextMap() {
    if (!mapQueue.length) {
      if (window.MABIntro) window.MABIntro.setProgress(0.98);
      return;
    }
    const st = mapQueue.shift();
    planetTextureLoader.load(
      `assets/worlds/planets/${st.theme}.webp`,
      (tex) => {
        applyPlanetTexture(st, tex);
        finishPlanetMap();
      },
      undefined,
      () => {
        try {
          applyPlanetTexture(
            st,
            makeMap({ kind: st.kind, seed: st.seed }, reduceMotion ? 384 : 640)
          );
        } catch (error) {
          console.warn("planet texture failed", st.id, error);
        }
        finishPlanetMap();
      }
    );
  }
  setTimeout(bakeNextMap, 40);

  function frame(now) {
    // A landing covers the whole viewport: skip drawing the scene behind it.
    if (document.body.classList.contains("world-open")) {
      last = now;
      requestAnimationFrame(frame);
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += dt;
    smx += ((mouseEnabled ? mx : 0) - smx) * (mouseEnabled ? 0.05 : 0.12);
    smy += ((mouseEnabled ? my : 0) - smy) * (mouseEnabled ? 0.05 : 0.12);

    const p = pathAt(progress);
    const p2 = pathAt(Math.min(1, progress + 0.018));
    // Subtle mouse only when enabled; path motion only when progress moves
    const mScale = mouseEnabled ? 0.35 : 0;
    camPos.set(p.x + smx * mScale, p.y + 0.12 - smy * mScale * 0.7, p.z);
    // Snappier settle when locked (landing still frame)
    camera.position.lerp(camPos, reduceMotion || !mouseEnabled ? 0.2 : 0.1);
    lookTarget.set(p2.x * 0.85 + smx * mScale * 0.3, p2.y * 0.75 - smy * mScale * 0.2, p2.z);
    if (progress < 0.06) lookTarget.lerp(firstPlanetTarget, 1 - progress / 0.06);
    camera.lookAt(lookTarget);

    // Bank FOV with path curvature
    const curve = Math.abs(Math.sin(progress * Math.PI * 3));
    camera.fov = 50 + curve * 4 + progress * 2;
    camera.updateProjectionMatrix();

    for (const s of stations) {
      s.mesh.rotation.y += dt * s.spin;
      if (s.group.userData.clouds) {
        s.group.userData.clouds.rotation.y += dt * s.spin * 0.58;
      }
      if (s.group.userData.ring) s.group.userData.ring.rotation.z += dt * 0.05;
      if (s.group.userData.photon) s.group.userData.photon.rotation.z -= dt * 0.35;
      s.group.position.y = s.baseY + Math.sin(elapsed * 0.55 + s.z * 0.04) * 0.07;
      s.group.position.x = s.baseX + Math.cos(elapsed * 0.4 + s.z * 0.03) * 0.05;
      for (let m = 0; m < 3; m++) {
        const moon = s.group.userData["moon" + m];
        if (!moon) continue;
        const ang = elapsed * (0.45 + m * 0.12) + m;
        const rad = s.r * (1.85 + m * 0.45);
        moon.position.set(Math.cos(ang) * rad, Math.sin(ang * 0.65) * s.r * 0.28, Math.sin(ang) * rad);
      }
    }

    // Tunnel pulse near ocean station
    tunnelGroup.children.forEach((t, i) => {
      t.rotation.z += dt * (0.2 + i * 0.02);
      t.material.opacity = 0.06 + Math.sin(elapsed * 2 + i) * 0.04;
    });

    galaxies.forEach((g, i) => {
      g.material.rotation = elapsed * 0.012 * (i % 2 ? 1 : -1);
    });
    starGroup.rotation.y = smx * 0.02;
    starGroup.rotation.x = smy * 0.012;

    // Shuttle
    shuttleState.cooldown -= dt;
    if (!shuttleState.active && shuttleState.cooldown <= 0 && elapsed > shuttleState.nextAt) {
      spawnShuttle();
    }
    if (shuttleState.active) {
      shuttleState.t += dt;
      if (!shuttleState.clicked) {
        shuttle.position.x += dt * 2.7;
        shuttle.position.z -= dt * 1.0;
        shuttle.position.y += Math.sin(elapsed * 2.4) * 0.01;
        shuttle.rotation.z = Math.sin(elapsed * 1.6) * 0.1;
        // pilot subtle bob
        pilot.position.y = 0.02 + Math.sin(elapsed * 6) * 0.002;
        if (shuttleState.t > 7.5) {
          shuttleState.active = false;
          shuttle.visible = false;
          shuttleState.nextAt = elapsed + 8 + Math.random() * 10;
        }
      } else {
        shuttle.rotation.z += dt * 1.6;
        shuttle.position.x += dt * 3.2;
        shuttle.position.y += dt * 1.1;
        accentMat.emissiveIntensity = 2.4;
        engGlow.scale.setScalar(0.5 + shuttleState.t * 0.7);
        if (shuttleState.t > 1.0) {
          shuttleState.active = false;
          shuttle.visible = false;
          accentMat.emissiveIntensity = 1.1;
          engGlow.scale.set(0.5, 0.5, 1);
          shuttleState.cooldown = 4;
          shuttleState.nextAt = elapsed + 11 + Math.random() * 8;
        }
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  if (!reduceMotion) {
    last = performance.now();
    requestAnimationFrame(frame);
  } else {
    renderer.render(scene, camera);
  }
})();
