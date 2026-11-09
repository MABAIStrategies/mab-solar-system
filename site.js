/**
 * Shared by every page: analytics hook and click tracking.
 * MABTrack(name, props) is safe to call anywhere; it never throws and does nothing
 * until Vercel Web Analytics has loaded.
 */
(function () {
  "use strict";

  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:";

  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  window.MABTrack = function (name, props) {
    try {
      const data = {};
      Object.entries(props || {}).forEach(([key, value]) => {
        if (value != null && typeof value !== "object") data[key] = String(value).slice(0, 120);
      });
      window.va("event", { name: String(name).slice(0, 60), data });
    } catch (_) {
      /* analytics must never break the page */
    }
  };

  // Vercel serves this script only on deployed sites.
  if (!local) {
    const s = document.createElement("script");
    s.defer = true;
    s.src = "/_vercel/insights/script.js";
    document.head.appendChild(s);
  }

  document.addEventListener("click", (event) => {
    const el = event.target instanceof Element ? event.target.closest("[data-track]") : null;
    if (el && !el.closest(".mab-module")) window.MABTrack(el.dataset.track, { page: location.pathname });
  });
})();
