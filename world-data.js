(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MABWorldData = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Seven landings: six dated moments in recent AI history, then today.
  // Each stop tells the event in plain language (`story`), then says why it matters to a
  // business and which offer it leads to (`bridge`). `caption` is the one-sentence version.
  // `theme` only drives the planet's look in the space scene.
  const WORLD_DEFS = [
    {
      stationId: "origin",
      theme: "arctic",
      order: 1,
      title: "AlexNet",
      headline: "The day machines learned to see",
      dateISO: "2012-09-30",
      dateLabel: "Sep 30, 2012",
      caption:
        "A neural network called AlexNet wins the ImageNet photo contest by more than ten points, and computers can finally tell what they are looking at.",
      story:
        "Before 2012, a computer could not reliably tell a dog from a car. Then three researchers in Toronto trained a neural network on 1.2 million photos using two gaming graphics cards. At that year's ImageNet contest it got 15.3% of the images wrong. The runner-up missed 26.2%. The whole field changed direction within a year.",
      bridge:
        "Nothing else in AI moved until a machine could see what was in front of it. Your business works the same way. The AI Readiness Audit shows you where the hours and dollars are going before you spend anything on automation.",
      sourceUrl: "https://image-net.org/challenges/LSVRC/2012/",
      offerId: "audit",
      wireframe: "scan",
      palette: { ink: "#effbff", accent: "#8fe8ff", glow: "#d9f7ff", shadow: "#06121e" },
    },
    {
      stationId: "mechanism",
      theme: "lava",
      order: 2,
      title: "AlphaGo vs. Lee Sedol",
      headline: "The move no human would play",
      dateISO: "2016-03-10",
      dateLabel: "Mar 10, 2016",
      caption:
        "In game two against Go champion Lee Sedol, the AlphaGo program plays a 37th move that no human would have chosen, and wins.",
      story:
        "Go is a 2,500-year-old board game with more possible positions than there are atoms in the universe. In 2016, DeepMind's AlphaGo program faced Lee Sedol, one of the best players alive. Its 37th move of game two looked so wrong that the commentators called it a mistake. AlphaGo's own math put the odds of a human playing it at 1 in 10,000. It won the game, and the match.",
      bridge:
        "AlphaGo was not a general chatbot. It was built to do one job better than anyone. That is what a custom AI agent is: trained on your process, working in your tools, and checking with your people before anything important goes out.",
      sourceUrl: "https://www.blog.google/technology/ai/alphagos-ultimate-challenge/",
      offerId: "agents",
      wireframe: "lattice",
      palette: { ink: "#fff9ec", accent: "#e9c46a", glow: "#fff1c9", shadow: "#0b0906" },
    },
    {
      stationId: "services",
      theme: "ocean",
      order: 3,
      title: "The Transformer",
      headline: "The blueprint everything is built on",
      dateISO: "2017-06-12",
      dateLabel: "Jun 12, 2017",
      caption:
        "Eight Google researchers publish “Attention Is All You Need” and introduce the Transformer, the design nearly every AI tool since is built on.",
      story:
        "In 2017, eight Google researchers published a paper called “Attention Is All You Need.” Their idea: stop reading a sentence one word at a time, and let the model weigh every word against every other word at once. They named the design the Transformer. Their best model trained in three and a half days. It is the “T” in GPT, and it sits under nearly every AI tool you have heard of.",
      bridge:
        "The breakthrough was not more horsepower. It was a better blueprint. Fractional AI Architecture gives you a senior architect who designs how your data, models and tools fit together, so what you build this year still stands next year.",
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
      headline: "An AI learns to negotiate",
      dateISO: "2022-11-22",
      dateLabel: "Nov 22, 2022",
      caption:
        "Meta's Cicero program reaches human-level play in Diplomacy, a board game you can only win by negotiating in plain language.",
      story:
        "Diplomacy is a board game with no dice. You win by talking: making deals, building alliances, and reading who will keep their word. In 2022, Meta's Cicero program joined an online league and played 40 games against 82 people. It negotiated in plain English, scored more than double the human average, and ranked in the top 10% of regular players.",
      bridge:
        "Selling is the same game: the right message, to the right person, at the right moment. AI Sales Systems put that to work in your pipeline, with prospect research, personalized outreach and follow-up that does not get dropped.",
      sourceUrl: "https://doi.org/10.1126/science.ade9097",
      offerId: "sales",
      wireframe: "funnel",
      palette: { ink: "#fff7e8", accent: "#ffbf58", glow: "#ffe2a8", shadow: "#190b06" },
    },
    {
      stationId: "command",
      theme: "jungle",
      order: 5,
      title: "ChatGPT",
      headline: "AI gets a front door",
      dateISO: "2022-11-30",
      dateLabel: "Nov 30, 2022",
      caption:
        "OpenAI releases ChatGPT as a free chat box anyone can type into, and a million people sign up in five days.",
      story:
        "Models like the one behind ChatGPT had been available to developers for more than two years. Almost nobody outside the industry noticed. Then OpenAI put a plain chat box in front of one and made it free. A million people signed up in five days. The engine was not new. What changed was that anyone could walk up and use it.",
      bridge:
        "The engine did not change. The front door did. Conversion Web Experiences build that front door for your business: a site that explains what you do, answers the buyer's questions and turns visits into booked calls.",
      sourceUrl: "https://openai.com/index/chatgpt/",
      offerId: "web",
      wireframe: "browser",
      palette: { ink: "#f0fff5", accent: "#7dffb0", glow: "#c9ffe0", shadow: "#04100a" },
    },
    {
      stationId: "enterprise",
      theme: "city",
      order: 6,
      title: "Model Context Protocol",
      headline: "One plug for every tool",
      dateISO: "2024-11-25",
      dateLabel: "Nov 25, 2024",
      caption:
        "Anthropic releases the Model Context Protocol, an open standard that lets AI plug into the software where work gets done.",
      story:
        "By 2024, AI could write, reason and plan, but it was locked out of the places where work happens. Every connection to a CRM, an inbox or a database had to be custom built. Then Anthropic released the Model Context Protocol as an open standard: one common plug between AI and business software. Within months, OpenAI, Google and Microsoft had adopted it.",
      bridge:
        "AI is only useful when it can reach your systems. Workflow Automation connects your CRM, inbox, spreadsheets and back office, so work moves from one to the next without someone copying and pasting it.",
      sourceUrl: "https://www.anthropic.com/news/model-context-protocol",
      offerId: "automation",
      wireframe: "hub",
      palette: { ink: "#f4f8ff", accent: "#67d5ff", glow: "#bfeeff", shadow: "#070817" },
    },
    {
      stationId: "convergence",
      theme: "singularity",
      order: 7,
      title: "Today",
      headline: "Your move",
      dateISO: null,
      dateLabel: null,
      live: true,
      caption: "The next entry on this timeline is yours.",
      story:
        "Every stop on this timeline looked small the day it happened. A contest entry. One move in a board game. A research paper. A chat box. Each one changed what a business can get done with the same people and the same hours. The next entry will not come from a lab. It is whatever you decide to do with all of this.",
      bridge:
        "Start with thirty minutes with Mark. Bring one workflow that eats your team's time. You leave with a roadmap for it whether you hire us or not.",
      sourceUrl: null,
      offerId: "briefing",
      wireframe: "brief",
      palette: { ink: "#fffaf0", accent: "#ffe278", glow: "#fff0b8", shadow: "#0d0a04" },
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
