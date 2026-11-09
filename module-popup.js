/**
 * Offer module: the dialog that opens on each landing.
 * Shows a 3D wireframe of the offer, what it is, and one next step.
 * The audit module carries the estimator; the briefing module carries the visitor's brief.
 */
(function () {
  "use strict";

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const track = (name, props) => {
    try {
      if (typeof window.MABTrack === "function") window.MABTrack(name, props || {});
    } catch (_) {
      /* analytics must never break the page */
    }
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  const money = (n) => "$" + Number(n).toLocaleString("en-US");
  const count = (n) => Number(n).toLocaleString("en-US");

  const root = document.createElement("div");
  root.className = "mab-module";
  root.hidden = true;
  root.innerHTML = `
    <div class="mab-module-scrim" data-module-close></div>
    <div class="mab-module-card" role="dialog" aria-modal="true" aria-labelledby="module-title" tabindex="-1">
      <button class="mab-module-x" type="button" data-module-close aria-label="Close">×</button>
      <div class="mab-module-viz"><canvas aria-hidden="true"></canvas></div>
      <div class="mab-module-body"></div>
    </div>`;
  document.body.appendChild(root);

  const card = root.querySelector(".mab-module-card");
  const canvas = root.querySelector("canvas");
  const viz = root.querySelector(".mab-module-viz");
  const body = root.querySelector(".mab-module-body");

  let current = null; // { onClose, opener }
  let stage = null; // { renderer, wire, raf, onVisibility, onResize }

  // --- 3D wireframe -------------------------------------------------------

  function startWireframe(world) {
    stopWireframe();
    const THREE = window.THREE;
    const frames = window.MABWireframes;
    viz.classList.remove("no-gl");
    if (!THREE || !frames) {
      viz.classList.add("no-gl");
      return;
    }
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch (_) {
      viz.classList.add("no-gl"); // no WebGL: the module still reads fine without the model
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0.25, 4.6);
    camera.lookAt(0, 0, 0);
    const wire = frames.build(world.wireframe, THREE, {
      accent: world.palette.accent,
      glow: world.palette.glow,
    });
    scene.add(wire.group);

    function resize() {
      const w = Math.max(1, viz.clientWidth);
      const h = Math.max(1, viz.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const started = performance.now();
    function draw() {
      wire.update(reduceMotion ? 2.6 : (performance.now() - started) / 1000);
      renderer.render(scene, camera);
    }
    function loop() {
      draw();
      stage.raf = requestAnimationFrame(loop);
    }
    function onVisibility() {
      if (!stage || reduceMotion) return;
      cancelAnimationFrame(stage.raf);
      if (!document.hidden) loop();
    }
    function onLost(event) {
      event.preventDefault();
      viz.classList.add("no-gl");
      stopWireframe();
    }

    stage = { renderer, wire, raf: 0, onVisibility, onResize: resize, onLost };
    canvas.addEventListener("webglcontextlost", onLost);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize, { passive: true });
    resize();
    if (reduceMotion) draw();
    else loop();
  }

  function stopWireframe() {
    if (!stage) return;
    cancelAnimationFrame(stage.raf);
    document.removeEventListener("visibilitychange", stage.onVisibility);
    window.removeEventListener("resize", stage.onResize);
    canvas.removeEventListener("webglcontextlost", stage.onLost);
    stage.wire.dispose();
    stage.renderer.dispose();
    stage = null;
  }

  // --- Content ------------------------------------------------------------

  function estimatorMarkup() {
    const roi = window.MABRoi;
    if (!roi) return "";
    const d = roi.DEFAULTS;
    const l = roi.LIMITS;
    const row = (key, label, min, max, step, value, unit) => `
      <label class="est-row">
        <span>${label}</span>
        <input type="range" name="${key}" min="${min}" max="${max}" step="${step}" value="${value}">
        <output data-out="${key}">${unit === "$" ? "$" + value : value}</output>
      </label>`;
    return `
      <form class="mab-estimator" novalidate>
        <p class="est-title">Rough size of the opportunity</p>
        ${row("teamSize", "People doing the manual work", l.teamSize[0], 200, 1, d.teamSize, "")}
        ${row("hoursPerWeek", "Manual hours each, per week", l.hoursPerWeek[0], l.hoursPerWeek[1], 0.5, d.hoursPerWeek, "")}
        ${row("hourlyCost", "Loaded cost per hour", 15, 250, 5, d.hourlyCost, "$")}
        <div class="est-result" aria-live="polite">
          <strong data-est="dollars"></strong>
          <span data-est="hours"></span>
        </div>
        <p class="est-formula" data-est="formula"></p>
        <p class="est-note">Illustration from your inputs, not a promised saving.</p>
      </form>`;
  }

  function wireEstimator(briefing) {
    const form = body.querySelector(".mab-estimator");
    const roi = window.MABRoi;
    if (!form || !roi) return;
    let touched = false;
    function paint() {
      const data = Object.fromEntries(new FormData(form).entries());
      const est = roi.estimate(data);
      form.querySelector('[data-out="teamSize"]').textContent = count(est.inputs.teamSize);
      form.querySelector('[data-out="hoursPerWeek"]').textContent = count(est.inputs.hoursPerWeek);
      form.querySelector('[data-out="hourlyCost"]').textContent = money(est.inputs.hourlyCost);
      form.querySelector('[data-est="dollars"]').textContent = `${money(est.dollarsPerYear)} a year`;
      form.querySelector('[data-est="hours"]').textContent = `${count(est.hoursPerYear)} hours a year`;
      form.querySelector('[data-est="formula"]').textContent = est.formula;
      if (touched && briefing) briefing.setEstimate(est);
    }
    form.addEventListener("input", () => {
      if (!touched) track("estimator_used");
      touched = true;
      paint();
    });
    form.addEventListener("submit", (event) => event.preventDefault());
    paint();
  }

  function briefLookup() {
    const M = window.MAB || {};
    const data = window.MABWorldData;
    return {
      offerName: (id) => ((M.offers || []).find((o) => o.id === id) || {}).name || id,
      stopLabel: (id) => {
        const w = data && data.worldForStation(id);
        if (!w) return id;
        return `${data.dateFor(w).label} · ${w.title}`;
      },
    };
  }

  function briefMarkup(briefing) {
    const M = window.MAB || {};
    const contact = M.contact || {};
    const text = briefing ? briefing.toText(briefLookup()) : "";
    const mail = briefing && contact.email ? briefing.mailtoHref(contact.email, briefLookup()) : "";
    return `
      <div class="mab-brief">
        <p class="est-title">Your brief so far</p>
        <pre class="brief-text" tabindex="0">${escapeHtml(text)}</pre>
        <div class="module-actions">
          <a class="btn primary-solid" data-track="booking_clicked" href="${escapeHtml(contact.cal || "#")}" target="_blank" rel="noopener">Book the briefing</a>
          ${mail ? `<a class="btn" data-track="brief_emailed" href="${escapeHtml(mail)}">Email this brief to Mark</a>` : ""}
          <button class="btn ghost" type="button" data-copy-brief>Copy brief</button>
        </div>
        <p class="est-note" data-copy-status aria-live="polite"></p>
      </div>`;
  }

  function render(world, offer, briefing) {
    const dates = window.MABWorldData.dateFor(world);
    const isBrief = offer.id === "briefing";
    const inBrief = briefing && briefing.state().offers.includes(offer.id);
    const cal = ((window.MAB || {}).contact || {}).cal || "#";
    body.innerHTML = `
      <p class="module-kicker"><time datetime="${escapeHtml(dates.iso)}">${escapeHtml(dates.label)}</time> · ${escapeHtml(world.title)}</p>
      <h2 id="module-title">${escapeHtml(offer.name)}</h2>
      <p class="module-blurb">${escapeHtml(offer.blurb)}</p>
      <ul class="module-specs">${offer.specs.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
      ${offer.id === "audit" ? estimatorMarkup() : ""}
      ${
        isBrief
          ? briefMarkup(briefing)
          : `<div class="module-actions">
              <button class="btn primary-solid" type="button" data-add-brief ${inBrief ? "disabled" : ""}>${inBrief ? "In your brief" : "Add to my brief"}</button>
              <a class="btn" data-track="booking_clicked" href="${escapeHtml(cal)}" target="_blank" rel="noopener">Book a briefing</a>
            </div>`
      }`;

    if (offer.id === "audit") wireEstimator(briefing);

    const add = body.querySelector("[data-add-brief]");
    if (add) {
      add.addEventListener("click", () => {
        if (briefing) briefing.addOffer(offer.id);
        track("offer_added", { offer: offer.id });
        close("added");
      });
    }
    const copy = body.querySelector("[data-copy-brief]");
    if (copy) {
      copy.addEventListener("click", async () => {
        const status = body.querySelector("[data-copy-status]");
        const text = briefing ? briefing.toText(briefLookup()) : "";
        try {
          await navigator.clipboard.writeText(text);
          status.textContent = "Copied. Paste it into the booking notes.";
        } catch (_) {
          // Clipboard blocked: select the text so the visitor can copy it by hand.
          const pre = body.querySelector(".brief-text");
          const range = document.createRange();
          range.selectNodeContents(pre);
          const sel = getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          status.textContent = "Selected. Press Ctrl or Cmd + C to copy.";
        }
      });
    }
    body.querySelectorAll("[data-track]").forEach((el) => {
      el.addEventListener("click", () => track(el.dataset.track, { offer: offer.id }));
    });
  }

  // --- Open / close -------------------------------------------------------

  function focusables() {
    return [...card.querySelectorAll('a[href], button:not([disabled]), input, [tabindex="0"]')].filter(
      (el) => el.offsetParent !== null
    );
  }

  function open(options) {
    const opts = options || {};
    if (!opts.world || !opts.offer) return false;
    if (current) close("replaced");
    current = { onClose: opts.onClose, opener: document.activeElement };
    root.style.setProperty("--world-ink", opts.world.palette.ink);
    root.style.setProperty("--world-accent", opts.world.palette.accent);
    root.style.setProperty("--world-glow", opts.world.palette.glow);
    root.style.setProperty("--world-shadow", opts.world.palette.shadow);
    render(opts.world, opts.offer, opts.briefing);
    root.hidden = false;
    document.body.classList.add("module-open");
    requestAnimationFrame(() => {
      root.classList.add("open");
      startWireframe(opts.world);
      card.focus({ preventScroll: true });
    });
    track(opts.offer.id === "briefing" ? "brief_opened" : "module_opened", { offer: opts.offer.id });
    return true;
  }

  function close(reason) {
    if (!current) return false;
    const done = current;
    current = null;
    root.classList.remove("open");
    document.body.classList.remove("module-open");
    stopWireframe();
    root.hidden = true;
    if (done.opener && document.contains(done.opener) && typeof done.opener.focus === "function") {
      done.opener.focus({ preventScroll: true });
    }
    if (typeof done.onClose === "function") done.onClose(reason || "manual");
    return true;
  }

  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-module-close]")) close("manual");
  });

  // Capture phase: Esc closes the module before the landing behind it hears the key.
  document.addEventListener(
    "keydown",
    (event) => {
      if (!current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        close("escape");
        return;
      }
      if (event.key === "Tab") {
        const items = focusables();
        if (!items.length) {
          event.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || active === card)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        } else if (!card.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    true
  );

  window.MABModule = { open, close, isOpen: () => !!current, escapeHtml };
})();
