/**
 * Seven landings on the AI-history timeline.
 * A station click descends to one dated event: the date and a one-sentence caption,
 * then (after the station hold) the offer module that event introduces.
 * Closing the landing returns the visitor to the same place in the space hub.
 */
(function () {
  "use strict";

  const dataApi = window.MABWorldData;
  if (!dataApi) return;

  const { WORLD_DEFS, worldForStation, dateFor } = dataApi;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const HOLD_MS = 2000;
  const escapeHtml =
    (window.MABModule && window.MABModule.escapeHtml) ||
    ((v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`));
  const track = (name, props) => {
    try {
      if (typeof window.MABTrack === "function") window.MABTrack(name, props || {});
    } catch (_) {
      /* analytics must never break the page */
    }
  };

  // One brief for the whole visit. sessionStorage access itself can throw when blocked.
  let store = null;
  try {
    store = window.sessionStorage;
  } catch (_) {
    store = null;
  }
  const briefing = window.MABBriefing ? window.MABBriefing.create(store) : null;
  window.MABBrief = briefing;

  const root = document.createElement("section");
  root.id = "world-journey";
  root.setAttribute("aria-hidden", "true");
  root.setAttribute("aria-label", "AI history landing");
  root.tabIndex = -1;
  root.innerHTML = `
    <div class="world-backdrop" aria-hidden="true">
      <div class="world-surface"></div>
      <div class="world-grid"></div>
      <div class="world-vignette"></div>
      <div class="world-rift world-rift--entry"><i class="rift-ring"></i><i class="rift-ring"></i><i class="rift-ring"></i></div>
    </div>
    <div class="world-chrome">
      <div class="world-brand">
        <img src="assets/mab-logo-256.png" alt="" width="34" height="34">
        <span><b>MAB AI STRATEGIES</b><em class="world-brand-location"></em></span>
      </div>
      <button class="world-close" type="button" data-world-close><span aria-hidden="true">×</span> RETURN TO HUB</button>
    </div>
    <div class="world-caption">
      <p class="caption-kicker"></p>
      <time class="caption-date"></time>
      <p class="caption-text"></p>
      <div class="caption-actions">
        <button class="btn primary-solid caption-open" type="button" data-world-module>
          <i class="hold-ring" aria-hidden="true"></i><span></span>
        </button>
        <button class="btn" type="button" data-world-next hidden></button>
        <a class="caption-source" target="_blank" rel="noopener" hidden>Source ↗</a>
      </div>
    </div>`;
  document.body.appendChild(root);

  const surface = root.querySelector(".world-surface");
  const locationLabel = root.querySelector(".world-brand-location");
  const kicker = root.querySelector(".caption-kicker");
  const dateEl = root.querySelector(".caption-date");
  const captionEl = root.querySelector(".caption-text");
  const openButton = root.querySelector("[data-world-module]");
  const openLabel = openButton.querySelector("span");
  const nextButton = root.querySelector("[data-world-next]");
  const sourceLink = root.querySelector(".caption-source");
  const closeButton = root.querySelector("[data-world-close]");

  const hold = window.MABStationHold
    ? window.MABStationHold.createTimedStationHold({ durationMs: HOLD_MS })
    : null;

  let activeWorld = null;
  let savedHubY = 0;
  let holdFrame = 0;
  let holdTimer = 0;
  let moduleSeen = false;

  const offerFor = (world) =>
    ((window.MAB || {}).offers || []).find((offer) => offer.id === world.offerId) || null;

  function nextWorld(world) {
    const i = WORLD_DEFS.indexOf(world);
    return i >= 0 && i < WORLD_DEFS.length - 1 ? WORLD_DEFS[i + 1] : null;
  }

  function stopHold() {
    cancelAnimationFrame(holdFrame);
    clearTimeout(holdTimer);
    holdFrame = 0;
    holdTimer = 0;
    if (hold) hold.leave();
    openButton.classList.remove("holding");
    openButton.style.removeProperty("--hold");
  }

  // The module opens by itself once the station hold releases; the button skips the wait.
  // A timer decides when; the animation frame only paints the progress ring, so a slow
  // frame rate can never delay the module.
  function startHold() {
    const ms = hold ? hold.durationMs() : HOLD_MS;
    if (hold) hold.enter(activeWorld.stationId);
    openButton.classList.add("holding");
    const started = performance.now();
    const paint = () => {
      openButton.style.setProperty("--hold", String(Math.min(1, (performance.now() - started) / ms)));
      holdFrame = requestAnimationFrame(paint);
    };
    holdFrame = requestAnimationFrame(paint);
    holdTimer = window.setTimeout(() => {
      stopHold();
      openModule("hold");
    }, ms);
  }

  function openModule(trigger) {
    if (!activeWorld || !window.MABModule || window.MABModule.isOpen()) return;
    stopHold();
    const world = activeWorld;
    const offer = offerFor(world);
    if (!offer) return;
    moduleSeen = true;
    window.MABModule.open({
      world,
      offer,
      briefing,
      onClose: () => {
        if (activeWorld !== world) return;
        root.classList.add("module-seen");
        openLabel.textContent = `Reopen: ${offer.name}`;
        const next = nextWorld(world);
        nextButton.hidden = !next;
        if (next) nextButton.textContent = `Next stop: ${next.title} →`;
      },
    });
    track("module_trigger", { stop: world.stationId, trigger });
  }

  function open(stationId) {
    const world = worldForStation(stationId);
    if (!world) return false;
    if (activeWorld) return activeWorld.stationId === stationId;

    activeWorld = world;
    moduleSeen = false;
    savedHubY = window.scrollY;
    const offer = offerFor(world);
    const dates = dateFor(world);

    root.dataset.theme = world.theme;
    root.classList.remove("exiting", "module-seen");
    root.style.setProperty("--world-ink", world.palette.ink);
    root.style.setProperty("--world-accent", world.palette.accent);
    root.style.setProperty("--world-glow", world.palette.glow);
    root.style.setProperty("--world-shadow", world.palette.shadow);
    surface.style.backgroundImage = `url("assets/worlds/${world.theme}.webp")`;

    locationLabel.textContent = `AI HISTORY · ${dates.iso.slice(0, 4)}`;
    kicker.textContent = `STOP ${String(world.order).padStart(2, "0")} OF ${String(WORLD_DEFS.length).padStart(2, "0")} · ${world.title.toUpperCase()}`;
    dateEl.dateTime = dates.iso;
    dateEl.textContent = dates.label;
    captionEl.textContent = world.caption;
    openLabel.textContent = offer ? `What this means for you: ${offer.name}` : "Continue";
    nextButton.hidden = true;
    sourceLink.hidden = !world.sourceUrl;
    if (world.sourceUrl) sourceLink.href = world.sourceUrl;

    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("world-open");
    requestAnimationFrame(() => {
      root.classList.add("active");
      openButton.focus({ preventScroll: true });
      startHold();
    });

    if (briefing) briefing.visit(stationId);
    track("stop_visited", { stop: stationId });
    window.dispatchEvent(
      new CustomEvent("mab:world-open", { detail: { stationId, theme: world.theme } })
    );
    return true;
  }

  function close(reason, after) {
    if (!activeWorld) return false;
    const world = activeWorld;
    stopHold();
    activeWorld = null; // set first so the module's onClose is a no-op for this landing
    if (window.MABModule && window.MABModule.isOpen()) window.MABModule.close("landing-closed");
    root.classList.add("exiting");

    window.setTimeout(
      () => {
        root.classList.remove("active", "exiting", "module-seen");
        root.setAttribute("aria-hidden", "true");
        document.body.classList.remove("world-open");
        window.scrollTo(0, savedHubY);
        if (window.__lenis) {
          try { window.__lenis.scrollTo(savedHubY, { immediate: true }); } catch (_) {}
        }
        window.dispatchEvent(
          new CustomEvent("mab:world-close", {
            detail: { stationId: world.stationId, theme: world.theme, reason: reason || "manual" },
          })
        );
        if (typeof after === "function") after();
      },
      reduceMotion ? 80 : 620
    );
    return true;
  }

  closeButton.addEventListener("click", () => close("manual"));
  openButton.addEventListener("click", () => openModule("click"));
  nextButton.addEventListener("click", () => {
    const next = activeWorld && nextWorld(activeWorld);
    if (!next) return;
    close("next", () => {
      if (window.MABHub && typeof window.MABHub.jumpToId === "function") {
        window.MABHub.jumpToId(next.stationId);
      }
    });
  });
  addEventListener("keydown", (event) => {
    if (!activeWorld || event.key !== "Escape") return;
    event.preventDefault();
    close("escape");
  });

  window.MABWorldJourney = {
    open,
    close,
    isOpen: () => !!activeWorld,
    activeWorld: () => activeWorld,
    moduleSeen: () => moduleSeen,
  };
})();
