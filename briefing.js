(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MABBriefing = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const STORAGE_KEY = "mab_brief_v1";
  const MAX_BODY = 1800; // encoded characters; keeps mailto links inside what mail clients accept
  const SUBJECT = "Briefing request from the MAB timeline";

  const strings = (value) =>
    Array.isArray(value) ? value.filter((item) => typeof item === "string" && item) : [];

  function normalize(raw) {
    const src = raw && typeof raw === "object" ? raw : {};
    const est = src.estimate && typeof src.estimate === "object" ? src.estimate : null;
    return { visited: strings(src.visited), offers: strings(src.offers), estimate: est };
  }

  function create(storage) {
    let memory = normalize(null);
    let storageFailed = false; // once a write fails, memory is the only truth

    // Storage can be missing, blocked or hold junk. Every path falls back to memory.
    function load() {
      try {
        const raw = !storageFailed && storage && storage.getItem(STORAGE_KEY);
        if (raw) memory = normalize(JSON.parse(raw));
      } catch (_) {
        /* keep in-memory state */
      }
      return memory;
    }

    function save() {
      try {
        if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(memory));
      } catch (_) {
        storageFailed = true; // private mode or quota: the brief still works for this visit
      }
    }

    function push(list, id) {
      if (typeof id !== "string" || !id) return;
      load();
      if (!memory[list].includes(id)) {
        memory[list].push(id);
        save();
      }
    }

    function toText(lookup) {
      const names = lookup || {};
      const offerName = typeof names.offerName === "function" ? names.offerName : (id) => id;
      const stopLabel = typeof names.stopLabel === "function" ? names.stopLabel : (id) => id;
      const s = load();
      const lines = ["MAB briefing request", ""];
      lines.push("Interested in:");
      if (s.offers.length) s.offers.forEach((id) => lines.push(`- ${offerName(id)}`));
      else lines.push("- Not selected yet");
      lines.push("", "Stops explored:");
      if (s.visited.length) s.visited.forEach((id) => lines.push(`- ${stopLabel(id)}`));
      else lines.push("- None yet");
      const e = s.estimate;
      if (e && e.inputs && Number.isFinite(e.hoursPerYear) && Number.isFinite(e.dollarsPerYear)) {
        const n = (v) => Number(v).toLocaleString("en-US");
        lines.push(
          "",
          "Estimate (illustration from my inputs, not a promised saving):",
          `- Team: ${n(e.inputs.teamSize)} people, ${n(e.inputs.hoursPerWeek)} manual hours each per week`,
          `- About ${n(e.hoursPerYear)} hours a year, roughly $${n(e.dollarsPerYear)} at $${n(e.inputs.hourlyCost)}/hour`
        );
      }
      return lines.join("\n");
    }

    function mailtoHref(email, lookup) {
      const lines = toText(lookup).split("\n");
      let body = "";
      for (const line of lines) {
        const next = body + encodeURIComponent(line + "\n");
        if (next.length > MAX_BODY) break;
        body = next;
      }
      return `mailto:${email}?subject=${encodeURIComponent(SUBJECT)}&body=${body}`;
    }

    return {
      visit: (stationId) => push("visited", stationId),
      addOffer: (offerId) => push("offers", offerId),
      setEstimate(estimate) {
        load();
        memory.estimate = estimate && typeof estimate === "object" ? estimate : null;
        save();
      },
      state() {
        const s = load();
        return { visited: [...s.visited], offers: [...s.offers], estimate: s.estimate };
      },
      toText,
      mailtoHref,
      clear() {
        memory = normalize(null);
        try {
          if (storage && storage.removeItem) storage.removeItem(STORAGE_KEY);
        } catch (_) {
          /* nothing to clear */
        }
      },
    };
  }

  return { STORAGE_KEY, create };
});
