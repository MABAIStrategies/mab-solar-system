(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MABRoi = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const DEFAULTS = { teamSize: 10, hoursPerWeek: 3, hourlyCost: 50, weeksPerYear: 48 };
  const LIMITS = { teamSize: [1, 1000], hoursPerWeek: [0, 40], hourlyCost: [0, 500] };

  // Accepts numbers or numeric strings (range inputs report strings). Anything else,
  // including blanks and non-finite values, falls back to the default.
  function clean(value, key) {
    const usable =
      typeof value === "number" || (typeof value === "string" && value.trim() !== "");
    let n = usable ? Number(value) : NaN;
    if (Number.isNaN(n)) n = DEFAULTS[key];
    const [min, max] = LIMITS[key];
    return Math.min(max, Math.max(min, n));
  }

  const fmt = (n) => Number(n).toLocaleString("en-US");

  function estimate(input) {
    const src = input && typeof input === "object" ? input : {};
    const inputs = {
      teamSize: Math.round(clean(src.teamSize, "teamSize")),
      hoursPerWeek: clean(src.hoursPerWeek, "hoursPerWeek"),
      hourlyCost: clean(src.hourlyCost, "hourlyCost"),
      weeksPerYear: DEFAULTS.weeksPerYear,
    };
    const hoursPerYear = Math.round(inputs.teamSize * inputs.hoursPerWeek * inputs.weeksPerYear);
    const dollarsPerYear = Math.round(
      inputs.teamSize * inputs.hoursPerWeek * inputs.weeksPerYear * inputs.hourlyCost
    );
    const formula =
      `${fmt(inputs.teamSize)} × ${fmt(inputs.hoursPerWeek)} × ${inputs.weeksPerYear} = ` +
      `${fmt(hoursPerYear)} hours a year, × $${fmt(inputs.hourlyCost)} = $${fmt(dollarsPerYear)}`;
    return { inputs, hoursPerYear, dollarsPerYear, formula };
  }

  return { DEFAULTS, LIMITS, estimate };
});
