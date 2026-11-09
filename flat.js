/**
 * Flat mode: the same seven stops as a plain scrolling page.
 * Used when motion is unwanted, the screen is small, WebGL is missing or lost, or the
 * visitor asks for it (?flat=1). ?flat=0 forces the 3D journey for the session.
 * Loaded in <head> before anything else so the 3D stage never boots in flat mode.
 */
(function () {
  "use strict";

  const KEY = "mab_flat_pref";
  const html = document.documentElement;

  function pref() {
    let stored = null;
    try {
      const param = new URLSearchParams(location.search).get("flat");
      if (param === "1" || param === "0") sessionStorage.setItem(KEY, param);
      stored = sessionStorage.getItem(KEY);
    } catch (_) {
      const param = /[?&]flat=([01])/.exec(location.search);
      stored = param ? param[1] : null;
    }
    return stored;
  }

  function hasWebGL() {
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch (_) {
      return false;
    }
  }

  function shouldUse() {
    if (!hasWebGL()) return true; // nothing to opt into
    const choice = pref();
    if (choice === "1") return true;
    if (choice === "0") return false;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    return Math.min(window.innerWidth, screen.width || Infinity) < 720;
  }

  let active = false;

  function fillLiveDate() {
    const data = window.MABWorldData;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const label = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    document.querySelectorAll("[data-live-date]").forEach((el) => {
      el.dateTime = iso;
      el.textContent = data ? data.dateFor({ live: true }, now).label : label;
    });
  }

  function enable() {
    if (active) return;
    active = true;
    html.classList.add("flat");
    html.classList.remove("intro-active");
    const run = () => {
      document.body.classList.remove("intro-active", "world-open", "module-open");
      if (window.MABModule && window.MABModule.isOpen()) window.MABModule.close("flat");
      fillLiveDate();
      // WebGL is gone, so the 3D journey cannot be offered.
      if (!hasWebGL()) document.querySelectorAll("[data-launch-journey]").forEach((el) => el.remove());
    };
    if (document.body) run();
    else document.addEventListener("DOMContentLoaded", run, { once: true });
  }

  window.MABFlat = { shouldUse, enable, isActive: () => active };

  if (shouldUse()) enable();
  else document.addEventListener("DOMContentLoaded", fillLiveDate, { once: true });

  // If the GPU drops the scene mid-visit, fall back instead of leaving a black page.
  document.addEventListener(
    "webglcontextlost",
    (event) => {
      if (event.target && event.target.id === "space-canvas") enable();
    },
    true
  );
})();
