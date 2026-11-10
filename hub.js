/**
 * Hub v4 — window-pane stations, still landing, snap/hold at stops
 * CONTENT stays primary on the glass; surface is atmosphere behind it.
 */
(function () {
  "use strict";

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const M = window.MAB;
  if (!M) return;

  const cut = document.getElementById("cut-layer");
  const stage = document.getElementById("aperture-stage");
  const body = document.getElementById("aperture-body");
  const surfaceLayer = document.getElementById("surface-layer");
  const voidSvg = document.getElementById("void-svg");
  const maskHole = document.getElementById("maskHole");
  const edgeRect = document.getElementById("edgeRect");
  const edgeInner = document.getElementById("edgeInner");
  const coldHud = document.getElementById("cold-hud");
  const siteNav = document.getElementById("site-nav");
  const journeyEnd = document.getElementById("journey-end");
  if (journeyEnd) {
    journeyEnd.inert = true;
    const back = journeyEnd.querySelector("button");
    if (back) back.addEventListener("click", () => {
      if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.6 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  const rail = document.getElementById("journey-rail");
  const toast = document.getElementById("toast");
  const reward = document.getElementById("anomaly-reward");
  const runwayStops = [...document.querySelectorAll(".runway-stop")];

  const stationStops = M.stops;
  const contentById = {};
  M.stops.forEach((s) => {
    contentById[s.id] = s;
  });

  const THEME_BY_ID = {
    origin: "arctic",
    mechanism: "lava",
    services: "ocean",
    proof: "desert",
    command: "jungle",
    enterprise: "city",
    convergence: "singularity",
  };

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // ── Panels (content first) ──
  const panels = {};
  function buildPanelHTML(stop) {
    let extra = "";
    const stopWorld = window.MABWorldData?.worldForStation(stop.id);
    const stopOffer = stopWorld && (M.offers || []).find((o) => o.id === stopWorld.offerId);
    if (stopOffer) {
      extra = `<div class="phase-row"><div class="phase-chip"><b>WHAT IT MEANS FOR YOU</b><span>${stopOffer.name}</span></div></div>`;
    }
    const actions = [];
    const world = window.MABWorldData?.worldForStation(stop.id);
    if (world) {
      actions.push(
        `<button class="btn world-enter" type="button" data-world-station="${stop.id}"><span>Land at ${world.title}</span><small>See the moment and what it means for you</small></button>`
      );
    }
    if (stop.primaryCal || stop.id === "convergence") {
      actions.push(
        `<a class="btn primary-solid" href="${M.contact.cal}" target="_blank" rel="noopener">Schedule briefing</a>`
      );
    }
    if (stop.route) {
      actions.push(
        `<a class="btn" href="${stop.route}">${stop.routeLabel || "Enter"}</a>`
      );
    }

    const titleHtml = stop.title
      .split("\n")
      .map((line, i, arr) =>
        i === arr.length - 1
          ? `<span class="grad-aurora">${line}</span>`
          : line
      )
      .join("<br>");

    return `
      <p class="kicker"><span class="dot"></span>${stop.kicker}</p>
      <h2 class="stop-title">${titleHtml}</h2>
      <p class="stop-body">${stop.body}</p>
      ${extra}
      ${actions.length ? `<div class="stop-actions">${actions.join("")}</div>` : ""}
    `;
  }

  stationStops.forEach((stop) => {
    const el = document.createElement("div");
    el.className = "stop-panel";
    el.dataset.id = stop.id;
    el.innerHTML = buildPanelHTML(stop);
    body.appendChild(el);
    panels[stop.id] = el;
  });

  // Rail
  const railMeta = stationStops.map((s, index) => ({
    id: s.id,
    name: s.name,
    origin: index === 0,
  }));
  railMeta.forEach((item) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "jr-item" + (item.origin ? " origin" : "");
    b.dataset.id = item.id;
    b.innerHTML = `<span>${item.name}</span><i class="jr-dot"></i>`;
    b.addEventListener("click", () => jumpToId(item.id));
    rail.appendChild(b);
  });

  function jumpToId(id) {
    const el = document.querySelector(`.runway-stop[data-id="${id}"]`);
    if (!el) return;
    // Aim for section center; transit skips intermediate station holds.
    const top = el.offsetTop + el.offsetHeight * 0.5 - innerHeight * 0.5;
    userHasScrolled = true;
    transitTargetId = id;
    if (window.MABSpace && window.MABSpace.setMouseEnabled) {
      window.MABSpace.setMouseEnabled(true);
    }
    if (window.__lenis) window.__lenis.scrollTo(top, { duration: 1.35 });
    else window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }

  // ── Aperture ──
  let activeId = null;
  let userHasScrolled = false;
  let transitTargetId = null;

  function setHole(w, h, op, blur) {
    cut.style.setProperty("--hole-w", w + "px");
    cut.style.setProperty("--hole-h", h + "px");
    cut.style.setProperty("--hole-op", String(op));
    cut.style.setProperty("--hole-blur", (blur || 0) + "px");

    const vw = innerWidth;
    const vh = innerHeight;
    const x = (vw - w) / 2;
    const y = (vh - h) / 2;
    const r = Math.min(20, w * 0.035);

    voidSvg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
    voidSvg.setAttribute("width", vw);
    voidSvg.setAttribute("height", vh);

    [maskHole, edgeRect, edgeInner].forEach((node) => {
      if (!node) return;
      node.setAttribute("x", x);
      node.setAttribute("y", y);
      node.setAttribute("width", Math.max(0, w));
      node.setAttribute("height", Math.max(0, h));
      node.setAttribute("rx", r);
      node.setAttribute("ry", r);
    });

    stage.classList.toggle("interactive", op > 0.55);
  }

  function setActivePanel(id) {
    if (id === activeId) return;
    activeId = id;
    Object.keys(panels).forEach((k) => {
      panels[k].classList.toggle("on", k === id);
    });
    rail.querySelectorAll(".jr-item").forEach((el) => {
      el.classList.toggle(
        "on",
        el.dataset.id === id || (id === null && el.dataset.id === "origin")
      );
    });
    // Surface theme under the glass
    if (surfaceLayer && id) {
      const theme = THEME_BY_ID[id] || contentById[id]?.atmosphere || "ocean";
      surfaceLayer.dataset.theme = theme;
    }
  }

  // ── Scroll progress + station proximity ──
  let progress = 0;
  let nearStationOpen = 0;

  function applyProgress(p) {
    progress = p;
    if (window.MABSpace) window.MABSpace.setProgress(p);

    // Enable mouse look only after user actually scrolls the journey
    if (p > 0.012 && !userHasScrolled) {
      userHasScrolled = true;
      if (window.MABSpace && window.MABSpace.setMouseEnabled) {
        window.MABSpace.setMouseEnabled(true);
      }
    }

    const cold = Math.max(0, 1 - p / 0.08);
    coldHud.classList.toggle("away", cold < 0.15);
    coldHud.style.opacity = String(cold);
    siteNav.classList.toggle("solid", p > 0.04);

    const docH = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const y = p * docH;

    let best = null;
    let bestOpen = 0;

    runwayStops.forEach((sec) => {
      const id = sec.dataset.id;
      const top = sec.offsetTop;
      const h = sec.offsetHeight;
      const mid = top + h * 0.5;
      const viewMid = y + innerHeight * 0.5;
      const dist = Math.abs(viewMid - mid);
      // Wider open zone for reading content
      let open = 1 - dist / (h * 0.42);
      open = Math.max(0, Math.min(1, open));
      if (id === "exit") open = 0;
      if (id === "origin" && !userHasScrolled) open = 0;
      if (open > bestOpen) {
        bestOpen = open;
        best = id;
      }
    });

    nearStationOpen = bestOpen;

    // Aperture opens fully when at station (content priority)
    const ease = bestOpen * bestOpen * (3 - 2 * bestOpen);
    const maxW = Math.min(1120, innerWidth * 0.92);
    const maxH = Math.min(680, innerHeight * 0.82);
    const w = maxW * ease;
    const h = maxH * ease;
    const op = ease > 0.02 ? Math.min(1, ease * 1.12) : 0;
    // Almost no blur when open — content must stay sharp
    const blur = ease > 0.5 ? 0 : (1 - ease) * 6;

    setHole(w, h, op, blur);

    // End of the runway: offer a next step instead of empty space.
    if (journeyEnd) {
      const atEnd = progress >= 0.985 && !document.body.classList.contains("world-open");
      journeyEnd.classList.toggle("show", atEnd);
      journeyEnd.inert = !atEnd;
    }

    if (best && bestOpen > 0.18 && contentById[best] && best !== "exit") {
      setActivePanel(best);
    } else if (bestOpen < 0.1) {
      setActivePanel(null);
      rail.querySelectorAll(".jr-item").forEach((el) => {
        el.classList.toggle("on", el.dataset.id === "origin" && progress < 0.1);
      });
    }

    if (best && bestOpen > 0.93 && contentById[best]) {
      const isTransitDestination = !transitTargetId || transitTargetId === best;
      if (transitTargetId === best) transitTargetId = null;
      if (isTransitDestination) engageStationHold(best);
    } else if (bestOpen < 0.5 && stationHold.stationId()) {
      clearStationArrival();
    }
  }

  // Station hold: time-based, never wheel-strength-based.
  const stationHold = window.MABStationHold.createTimedStationHold({ durationMs: 2_000 });
  const dwell = document.createElement("div");
  dwell.id = "station-dwell";
  dwell.setAttribute("role", "status");
  dwell.setAttribute("aria-live", "polite");
  dwell.innerHTML = `<span class="dwell-orbit"><i></i></span><span class="dwell-copy"><b>ARRIVAL HOLD</b><em>2.0s to read the station</em></span>`;
  document.body.appendChild(dwell);

  let holdTimer = 0;
  let dwellFrame = 0;

  function stationCenter(id) {
    const sec = document.querySelector(`.runway-stop[data-id="${id}"]`);
    return sec ? sec.offsetTop + sec.offsetHeight * 0.5 - innerHeight * 0.5 : null;
  }

  function releaseTimedHold() {
    clearTimeout(holdTimer);
    document.body.classList.remove("station-holding");
    dwell.classList.remove("holding");
    dwell.classList.add("released");
    const label = dwell.querySelector("em");
    if (label) label.textContent = "Released · scroll normally to continue";
    if (!document.body.classList.contains("world-open") && window.__lenis) {
      try { window.__lenis.start(); } catch (_) {}
    }
    setTimeout(() => dwell.classList.remove("released"), 1200);
  }

  function updateDwell() {
    if (!stationHold.isLocked()) {
      releaseTimedHold();
      return;
    }
    const remaining = stationHold.remainingMs();
    const elapsed = 1 - remaining / stationHold.durationMs();
    dwell.style.setProperty("--dwell-progress", String(Math.max(0, Math.min(1, elapsed))));
    const label = dwell.querySelector("em");
    if (label) label.textContent = `${(remaining / 1000).toFixed(1)}s to read the station`;
    dwellFrame = requestAnimationFrame(updateDwell);
  }

  function engageStationHold(id) {
    if (!id || id === "exit" || document.body.classList.contains("world-open")) return;
    if (!stationHold.enter(id)) return;

    const target = stationCenter(id);
    if (target !== null) {
      if (window.__lenis) window.__lenis.scrollTo(target, { immediate: true });
      else window.scrollTo(0, target);
    }

    if (window.__lenis) {
      try { window.__lenis.stop(); } catch (_) {}
    }
    clearTimeout(holdTimer);
    cancelAnimationFrame(dwellFrame);
    document.body.classList.add("station-holding");
    dwell.classList.remove("released");
    dwell.classList.add("holding");
    dwell.style.setProperty("--dwell-progress", "0");
    updateDwell();
    holdTimer = setTimeout(releaseTimedHold, stationHold.durationMs() + 40);
  }

  function clearStationArrival() {
    const parkedId = stationHold.stationId();
    if (!parkedId) return;
    stationHold.leave(parkedId);
    clearTimeout(holdTimer);
    cancelAnimationFrame(dwellFrame);
    document.body.classList.remove("station-holding");
    dwell.classList.remove("holding", "released");
  }

  function onWheel(e) {
    if (document.body.classList.contains("world-open")) return;
    if (!stationHold.isLocked()) transitTargetId = null;
    if (!userHasScrolled && Math.abs(e.deltaY) > 2) {
      userHasScrolled = true;
      if (window.MABSpace && window.MABSpace.setMouseEnabled) {
        window.MABSpace.setMouseEnabled(true);
      }
    }
    if (!stationHold.isLocked()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const target = stationCenter(stationHold.stationId());
    if (target !== null) {
      if (window.__lenis) window.__lenis.scrollTo(target, { immediate: true });
      else window.scrollTo(0, target);
    }
  }

  function onTouchMove(e) {
    if (!document.body.classList.contains("world-open") && stationHold.isLocked()) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }

  function initScroll() {
    // Capture-phase blockers discard input during the timed hold; no force is accumulated.
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });

    if (reduce || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      const onScroll = () => {
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        applyProgress(scrollY / max);
      };
      addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    let lenis = null;
    if (typeof Lenis !== "undefined") {
      lenis = new Lenis({
        duration: 1.18,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.05,
        syncTouch: true,
      });
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);


      if (document.body.classList.contains("intro-active")) {
        try {
          lenis.stop();
        } catch (_) {}
      }
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }

    ScrollTrigger.create({
      trigger: "#runway",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.65,
      onUpdate: (self) => applyProgress(self.progress),
    });

    // Snap helpers via ScrollTrigger
    runwayStops.forEach((sec) => {
      if (sec.dataset.id === "origin" || sec.dataset.id === "exit") return;
      ScrollTrigger.create({
        trigger: sec,
        start: "center center",
        end: "center center",
        // markers for debug off
      });
    });

    applyProgress(0);
    addEventListener("resize", () => {
      ScrollTrigger.refresh();
      applyProgress(progress);
    });
  }

  function bootHub() {
    // Landing still frame — mouse off until scroll
    if (window.MABSpace && window.MABSpace.setMouseEnabled) {
      window.MABSpace.setMouseEnabled(false);
    }
    initScroll();
    if (window.__lenis) {
      try {
        window.__lenis.start();
      } catch (_) {}
    }
    window.scrollTo(0, 0);
    applyProgress(0);
  }

  if (document.body.classList.contains("intro-active")) {
    window.addEventListener("mab:intro-done", bootHub, { once: true });
  } else {
    bootHub();
  }

  body.addEventListener("click", (event) => {
    const enter = event.target.closest("[data-world-station]");
    if (!enter) return;
    event.preventDefault();
    const stationId = enter.dataset.worldStation;
    if (window.MABWorldJourney) window.MABWorldJourney.open(stationId);
  });

  window.addEventListener("mab:world-open", () => {
    if (window.__lenis) {
      try { window.__lenis.stop(); } catch (_) {}
    }
  });
  window.addEventListener("mab:world-close", () => {
    if (window.__lenis) {
      try { window.__lenis.start(); } catch (_) {}
    }
  });

  window.MABHub = {
    jumpToId,
    getActiveId: () => activeId,
    activeStation: () => activeId,
    stationHoldRemaining: () => stationHold.remainingMs(),
  };

  // Keyboard
  addEventListener("keydown", (e) => {
    if (document.body.classList.contains("world-open")) return;
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
    const ids = [...stationStops.map((s) => s.id), "exit"];
    const cur = activeId || "origin";
    const i = Math.max(0, ids.indexOf(cur));
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      if (stationHold.isLocked()) {
        showToast(`${(stationHold.remainingMs() / 1000).toFixed(1)}s arrival hold`);
        return;
      }
      jumpToId(ids[Math.min(ids.length - 1, i + 1)]);
    }
    if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      if (stationHold.isLocked()) {
        showToast(`${(stationHold.remainingMs() / 1000).toFixed(1)}s arrival hold`);
        return;
      }
      jumpToId(ids[Math.max(0, i - 1)]);
    }
    if (e.key === "Escape" && reward.classList.contains("open")) {
      reward.classList.remove("open");
    }
  });

  // Anomaly copy
  const LOOT = [
    {
      title: "Start with one workflow",
      body: "Don’t open with a broad AI program. Pick the one handoff your team repeats every day and automate that first. It’s narrow enough to ship fast and important enough to measure.",
      detail: "That’s how every engagement here starts.",
    },
    {
      title: "Price the hours first",
      body: "People doing the work × manual hours a week × 48 weeks. That number tells you whether a workflow is worth automating before anyone writes a line of code.",
      detail: "The first stop on the timeline has an estimator that does the math with you.",
    },
    {
      title: "Skip the queue",
      body: "You intercepted a field probe, so use it. Book the free 30-minute briefing and mention the intercept.",
      detail: "You leave with a roadmap either way.",
    },
  ];

  window.addEventListener("mab:shuttle", () => {
    const item = LOOT[Math.floor(Math.random() * LOOT.length)];
    document.getElementById("reward-title").textContent = item.title;
    const paras = reward.querySelectorAll(".reward-copy p");
    if (paras[0]) paras[0].textContent = item.body;
    if (paras[1]) paras[1].textContent = item.detail;
    const lootEl = document.getElementById("reward-loot");
    if (lootEl) lootEl.hidden = true;
    localStorage.setItem("mab_anomaly_loot", "1");
    reward.classList.add("open");
    showToast("Probe intercepted");
  });

  document.getElementById("reward-close").onclick = () => {
    reward.classList.remove("open");
  };
  reward.addEventListener("click", (e) => {
    if (e.target === reward) reward.classList.remove("open");
  });

  setHole(0, 0, 0, 0);
  setActivePanel(null);
})();
