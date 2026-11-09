(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MABWorldData = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Seven landings: six dated moments in recent AI history, then today.
  // `theme` still drives the planet's look in the space scene; only the landing changed.
  const WORLD_DEFS = [
    {
      stationId: "origin",
      theme: "arctic",
      order: 1,
      title: "AlexNet",
      dateISO: "2012-09-30",
      dateLabel: "Sep 30, 2012",
      caption:
        "AlexNet is entered in the ImageNet challenge and beats the runner-up by more than ten points: machines learn to see.",
      sourceUrl: "https://image-net.org/challenges/LSVRC/2012/",
      offerId: "audit",
      wireframe: "scan",
      palette: { ink: "#effbff", accent: "#8fe8ff", glow: "#d9f7ff", shadow: "#06121e" },
    },
    {
      stationId: "mechanism",
      theme: "lava",
      order: 2,
      title: "Move 37",
      dateISO: "2016-03-10",
      dateLabel: "Mar 10, 2016",
      caption:
        "In game two against Lee Sedol, AlphaGo plays Move 37, a move no human would have chosen.",
      sourceUrl: "https://www.blog.google/technology/ai/alphagos-ultimate-challenge/",
      offerId: "agents",
      wireframe: "lattice",
      palette: { ink: "#fff6ea", accent: "#ff7a18", glow: "#ffd089", shadow: "#170703" },
    },
    {
      stationId: "services",
      theme: "ocean",
      order: 3,
      title: "The Transformer",
      dateISO: "2017-06-12",
      dateLabel: "Jun 12, 2017",
      caption:
        "“Attention Is All You Need” introduces the Transformer, the architecture everything since is built on.",
      sourceUrl: "https://arxiv.org/abs/1706.03762",
      offerId: "architecture",
      wireframe: "transformer",
      palette: { ink: "#edffff", accent: "#36e6ff", glow: "#8cf7e5", shadow: "#03121c" },
    },
    {
      stationId: "proof",
      theme: "desert",
      order: 4,
      title: "Cicero",
      dateISO: "2022-11-22",
      dateLabel: "Nov 22, 2022",
      caption:
        "Meta's Cicero reaches human-level play in Diplomacy by negotiating in plain language.",
      sourceUrl: "https://doi.org/10.1126/science.ade9097",
      offerId: "sales",
      wireframe: "funnel",
      palette: { ink: "#fff7e8", accent: "#ffbf58", glow: "#ff6f91", shadow: "#190b06" },
    },
    {
      stationId: "command",
      theme: "jungle",
      order: 5,
      title: "ChatGPT",
      dateISO: "2022-11-30",
      dateLabel: "Nov 30, 2022",
      caption:
        "ChatGPT launches as a free research preview and the interface makes the model matter.",
      sourceUrl: "https://openai.com/index/chatgpt/",
      offerId: "web",
      wireframe: "browser",
      palette: { ink: "#f0ffe8", accent: "#9dff63", glow: "#44ffc1", shadow: "#04130a" },
    },
    {
      stationId: "enterprise",
      theme: "city",
      order: 6,
      title: "Model Context Protocol",
      dateISO: "2024-11-25",
      dateLabel: "Nov 25, 2024",
      caption:
        "Anthropic open-sources the Model Context Protocol and agents plug into the tools where work lives.",
      sourceUrl: "https://www.anthropic.com/news/model-context-protocol",
      offerId: "automation",
      wireframe: "hub",
      palette: { ink: "#f4f8ff", accent: "#67d5ff", glow: "#ff5ca8", shadow: "#070817" },
    },
    {
      stationId: "convergence",
      theme: "singularity",
      order: 7,
      title: "Today",
      dateISO: null,
      dateLabel: null,
      live: true,
      caption: "The next entry on this timeline is yours.",
      sourceUrl: null,
      offerId: "briefing",
      wireframe: "brief",
      palette: { ink: "#fffaf0", accent: "#ffe278", glow: "#8cf7ff", shadow: "#020207" },
    },
  ];

  const BY_STATION = Object.fromEntries(WORLD_DEFS.map((world) => [world.stationId, world]));

  function worldForStation(stationId) {
    return BY_STATION[stationId] || null;
  }

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Date shown on a landing. The live stop uses the visitor's local calendar day.
  function dateFor(world, now) {
    if (!world) return { iso: "", label: "" };
    if (!world.live) return { iso: world.dateISO, label: world.dateLabel };
    const d = now instanceof Date && !isNaN(now) ? now : new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return {
      iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      label: `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
    };
  }

  return { WORLD_DEFS, worldForStation, dateFor };
});
