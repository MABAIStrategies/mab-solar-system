(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MABStationHold = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function createTimedStationHold(options) {
    const opts = options || {};
    const durationMs = Math.max(2000, Number(opts.durationMs) || 2000);
    const now =
      typeof opts.now === "function"
        ? opts.now
        : () =>
            typeof performance !== "undefined" && performance.now
              ? performance.now()
              : Date.now();

    let currentId = null;
    let parked = false;
    let lockedUntil = 0;

    return {
      enter(id) {
        if (!id || (parked && currentId === id)) return false;
        currentId = id;
        parked = true;
        lockedUntil = now() + durationMs;
        return true;
      },
      leave(id) {
        if (id && currentId !== id) return false;
        currentId = null;
        parked = false;
        lockedUntil = 0;
        return true;
      },
      isLocked() {
        return parked && now() < lockedUntil;
      },
      remainingMs() {
        return parked ? Math.max(0, Math.ceil(lockedUntil - now())) : 0;
      },
      stationId() {
        return currentId;
      },
      durationMs() {
        return durationMs;
      },
    };
  }

  return { createTimedStationHold };
});
