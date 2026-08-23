(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MABWorldData = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const WORLD_DEFS = [
    {
      stationId: "origin",
      theme: "arctic",
      eyebrow: "WORLD 01 · THE MEMORY OF SCALE",
      title: "Ice Age",
      subtitle: "Ancient scale. Modern precision.",
      image: "assets/worlds/arctic.webp",
      detailImage: "assets/worlds/arctic-detail.webp",
      palette: { ink: "#effbff", accent: "#8fe8ff", glow: "#d9f7ff", shadow: "#06121e" },
      atmosphere: "Snow crystals, blue ice and megafauna move around a system built to survive pressure.",
      chapters: [
        { tag: "THRESHOLD", title: "Enter at glacial scale", body: "The journey begins close enough to see frost move across the terrain—not from a distant telescope." },
        { tag: "FIELD SIGNAL", title: "Massive systems leave tracks", body: "Woolly mammoths and sabertooth hunters make scale legible. In business, operating drag leaves tracks too." },
        { tag: "MAB PRINCIPLE", title: "Find the load-bearing constraint", body: "We begin with the bottleneck that keeps recurring, then design the smallest autonomous system that removes it." },
        { tag: "RETURN VECTOR", title: "Complete the orbit", body: "The rift is ahead. Follow it back to the hub from the far side of the planet." },
      ],
    },
    {
      stationId: "mechanism",
      theme: "lava",
      eyebrow: "WORLD 02 · PRESSURE INTO PROPULSION",
      title: "The Forge",
      subtitle: "Four phases. One compounding machine.",
      image: "assets/worlds/lava.webp",
      detailImage: "assets/worlds/lava-detail.webp",
      palette: { ink: "#fff6ea", accent: "#ff7a18", glow: "#ffd089", shadow: "#170703" },
      atmosphere: "Molten rivers, fractured obsidian and meteor trails turn pressure into visible motion.",
      chapters: [
        { tag: "DIAGNOSE", title: "Read the pressure", body: "Trace revenue friction, repetitive work and handoff failure until the real constraint is visible." },
        { tag: "ARCHITECT", title: "Cut channels for flow", body: "Agents, data and approvals get a durable operating path before anything is automated." },
        { tag: "AUTOMATE · AMPLIFY", title: "Let the machine compound", body: "Ship, measure, reinforce. The system improves because the feedback loop is part of the build." },
        { tag: "RETURN VECTOR", title: "Cross the cooling rim", body: "The outbound rift is forming beyond the meteor field." },
      ],
    },
    {
      stationId: "services",
      theme: "ocean",
      eyebrow: "WORLD 03 · DEPTH OF CAPABILITY",
      title: "Pelagic Systems",
      subtitle: "A living stack for the agentic enterprise.",
      image: "assets/worlds/ocean.webp",
      detailImage: "assets/worlds/ocean-detail.webp",
      palette: { ink: "#edffff", accent: "#36e6ff", glow: "#8cf7e5", shadow: "#03121c" },
      atmosphere: "Schools of fish, rays, reefs and wet volcanic rock create a world that never feels static.",
      chapters: [
        { tag: "SHALLOW WATER", title: "See the system moving", body: "Autonomous agents, workflow automation, sales systems, audits and architecture operate as one ecology." },
        { tag: "THE REEF", title: "Specialists coordinate", body: "Each capability has a narrow role. Orchestration makes the whole environment intelligent." },
        { tag: "THE DEEP", title: "Infrastructure below the spectacle", body: "Guardrails, data contracts and measurable outcomes keep production systems alive under pressure." },
        { tag: "RETURN VECTOR", title: "Ride the current home", body: "The current bends into a luminous rift on the far side of the reef." },
      ],
    },
    {
      stationId: "proof",
      theme: "desert",
      eyebrow: "WORLD 04 · SIGNAL BEFORE SCALE",
      title: "The First Signal",
      subtitle: "Small organisms. Measurable impact.",
      image: "assets/worlds/desert.webp",
      detailImage: "assets/worlds/desert-detail.webp",
      palette: { ink: "#fff7e8", accent: "#ffbf58", glow: "#ff6f91", shadow: "#190b06" },
      atmosphere: "An arid macro-landscape collapses into a living microscopic world hidden inside mineral pools.",
      chapters: [
        { tag: "MACRO", title: "The landscape looks empty", body: "Operational waste often hides in plain sight—spread thin across hundreds of repeated decisions." },
        { tag: "MICRO", title: "Life appears under magnification", body: "The smallest recurring event can be the highest-leverage automation target." },
        { tag: "EVIDENCE", title: "$12M+ impact. 250+ deployments.", body: "Fifteen hours returned per week and payback measured in production—not a mirage, a record." },
        { tag: "RETURN VECTOR", title: "Follow the organism ring", body: "The microscopic current resolves into a rift back to deep space." },
      ],
    },
    {
      stationId: "command",
      theme: "jungle",
      eyebrow: "WORLD 05 · LIVING SYSTEMS",
      title: "Prehistoric Canopy",
      subtitle: "Agents that adapt, hunt and compound.",
      image: "assets/worlds/jungle.webp",
      detailImage: "assets/worlds/jungle-detail.webp",
      palette: { ink: "#f0ffe8", accent: "#9dff63", glow: "#44ffc1", shadow: "#04130a" },
      atmosphere: "Wet leaves, mist, giant ferns and dinosaurs make every layer feel inhabited and close.",
      chapters: [
        { tag: "UNDERSTORY", title: "Every leaf carries signal", body: "The smallest skills and utilities become reusable building blocks instead of forgotten experiments." },
        { tag: "PREDATOR PATH", title: "Agents act with purpose", body: "Each system senses, decides and executes inside explicit boundaries." },
        { tag: "THE CANOPY", title: "Command keeps growing", body: "Clients unlock a living gallery of agents, skills, workflows and applications that compound over time." },
        { tag: "RETURN VECTOR", title: "The canopy tears open", body: "Circle the habitat and approach the rift from behind the ancient trees." },
      ],
    },
    {
      stationId: "enterprise",
      theme: "city",
      eyebrow: "WORLD 06 · HUMAN THROUGHPUT",
      title: "The Operating City",
      subtitle: "Automation that gives human attention back.",
      image: "assets/worlds/city.webp",
      detailImage: "assets/worlds/city-detail.webp",
      palette: { ink: "#f4f8ff", accent: "#67d5ff", glow: "#ff5ca8", shadow: "#070817" },
      atmosphere: "Crowds, rain, autonomous transit and glass towers show technology inside the human operating system.",
      chapters: [
        { tag: "STREET LEVEL", title: "Work is a moving network", body: "Sales, service, operations and leadership already exchange signals every minute." },
        { tag: "COORDINATION", title: "Remove the traffic between teams", body: "Agents handle retrieval, routing and follow-through while people keep judgment and relationships." },
        { tag: "CAPACITY", title: "Give the city time back", body: "Recovered attention becomes faster delivery, stronger pipeline and room for higher-value decisions." },
        { tag: "RETURN VECTOR", title: "Take the outbound lane", body: "The city grid curves into a rift above the opposite platform." },
      ],
    },
    {
      stationId: "convergence",
      theme: "singularity",
      eyebrow: "WORLD 07 · THE AGENTSPHERE",
      title: "Convergence",
      subtitle: "Every autonomous system, one field.",
      image: "assets/worlds/singularity.webp",
      detailImage: "assets/worlds/singularity-detail.webp",
      palette: { ink: "#fffaf0", accent: "#ffe278", glow: "#8cf7ff", shadow: "#020207" },
      atmosphere: "An accretion disk bends around a black core while thousands of agents exchange live signals.",
      chapters: [
        { tag: "ORBIT", title: "Specialized agents enter the field", body: "Research, sales, operations and delivery remain distinct—but they share context and intent." },
        { tag: "AGENTSPHERE", title: "Coordination becomes the advantage", body: "The system routes work to the right intelligence, tool and human at the right moment." },
        { tag: "EVENT HORIZON", title: "Decision has a cost", body: "A strategic briefing maps the highest-ROI automations and prices the cost of waiting." },
        { tag: "RETURN VECTOR", title: "Slingshot back to the hub", body: "Complete the final arc and let the singularity throw you back into space." },
      ],
    },
  ];

  const BY_STATION = Object.fromEntries(WORLD_DEFS.map((world) => [world.stationId, world]));

  function worldForStation(stationId) {
    return BY_STATION[stationId] || null;
  }

  return { WORLD_DEFS, worldForStation };
});
