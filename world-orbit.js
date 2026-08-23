(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MABWorldOrbit = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const clamp01 = (n) => Math.max(0, Math.min(1, n));
  const smooth = (n) => {
    const t = clamp01(n);
    return t * t * (3 - 2 * t);
  };

  function orbitAt(rawProgress) {
    const progress = clamp01(Number(rawProgress) || 0);
    const angle = progress * Math.PI * 2 - Math.PI / 2;
    const radiusX = 8.5;
    const radiusY = 4.5;
    const depthPulse = Math.sin(progress * Math.PI);

    return {
      progress,
      angle,
      x: Math.cos(angle) * radiusX,
      y: Math.sin(angle) * radiusY,
      zoom: 1.035 + depthPulse * 0.16,
      roll: Math.sin(angle + Math.PI / 2) * 1.4,
      parallaxX: Math.cos(angle) * -3.2,
      parallaxY: Math.sin(angle) * -2.1,
      entryRift: 1 - smooth(progress / 0.16),
      exitRift: smooth((progress - 0.8) / 0.2),
      approachSide: progress < 0.5 ? -1 : 1,
    };
  }

  return { orbitAt };
});
