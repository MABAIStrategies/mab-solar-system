/* MAB AI Strategies: single source for offers, proof, pricing and contact. */
window.MAB = {
  brand: "MAB AI Strategies",
  company: "MAB AI Strategies LLC",
  tagline: "Converting chaos into consistency, and consistency into currency.",
  heroSub:
    "Custom AI agents, automated workflows and sales systems, built around the tools you already run and measured in hours and dollars.",

  // One offer per landing. `id` matches `offerId` in world-data.js.
  offers: [
    {
      id: "audit",
      name: "AI Readiness Audit",
      blurb:
        "Before anything gets automated, we find where the hours actually go. You get a ranked list of what's worth automating and what isn't.",
      specs: [
        "Process review and bottleneck sizing",
        "Automation roadmap ranked by return",
        "Executive readout call included",
      ],
    },
    {
      id: "agents",
      name: "Custom AI Agents",
      blurb:
        "Agents built for one job in your business, wired into your tools, with a person approving the calls that need judgment.",
      specs: [
        "Multi-step reasoning and tool use",
        "Human review points and audit logs",
        "Built on your stack, not bolted on top",
      ],
    },
    {
      id: "architecture",
      name: "Fractional AI Architecture",
      blurb:
        "Senior AI leadership without the full-time hire. Strategy, stack decisions and build ownership from one accountable person.",
      specs: [
        "Strategy through deployment ownership",
        "Vendor-neutral stack selection",
        "Governance your security team can sign off on",
      ],
    },
    {
      id: "sales",
      name: "AI Sales Systems",
      blurb:
        "Research, outreach and pipeline hygiene handled by the system, so reps spend their time in conversations.",
      specs: [
        "Account research and first-touch drafts",
        "CRM enrichment, scoring and next steps",
        "Sequences with human approval gates",
      ],
    },
    {
      id: "web",
      name: "Conversion Web Experiences",
      blurb:
        "Sites like this one: built to hold attention, explain the offer and hand you a prepared conversation.",
      specs: [
        "Scroll-driven 3D storytelling",
        "Built-in scheduling and lead capture",
        "Fast on mobile, measured end to end",
      ],
    },
    {
      id: "automation",
      name: "Workflow Automation",
      blurb:
        "The repetitive work between your systems, run automatically: intake, handoffs, follow-up and reporting.",
      specs: [
        "Runs around the clock with failure recovery",
        "Connects CRM, inbox, sheets and ERP",
        "Every run logged and measurable",
      ],
    },
    {
      id: "briefing",
      name: "Strategic Briefing",
      blurb:
        "Thirty minutes with Mark on your workflow. You leave with a roadmap whether you hire us or not.",
      specs: [
        "30 minutes · free · ROI roadmap included",
        "Bring the brief you built on the way here",
        "No obligation",
      ],
      // The plain page has no brief builder, so it points to the estimator instead.
      specsFlat: [
        "30 minutes · free · ROI roadmap included",
        "Size your opportunity first with the estimator",
        "No obligation",
      ],
    },
  ],

  // Two groups, never mixed: Mark's career record, and what MAB has built.
  proof: {
    career: ["$12M+ ARR generated", "#2 national ranking", "750+ enterprise accounts"],
    built: ["100+ AI agents", "300+ business automations"],
  },

  tiers: [
    {
      name: "Foundation",
      price: "$2,500",
      unit: "/ month",
      badge: "",
      desc: "Your first automation layer and repeatable processes.",
      features: [
        "AI Readiness Audit (up to 5 processes)",
        "Up to 2 automation workflows / month",
        "Integration with existing tools (CRM / ATS)",
        "Monthly strategy call + async support",
        "ROI measurement & reporting dashboard",
      ],
      cta: "Start Building",
      payLink: null,
    },
    {
      name: "Accelerator",
      price: "$5,500",
      unit: "/ month",
      badge: "MOST POPULAR",
      desc: "For operators automating across several teams.",
      features: [
        "Full AI Readiness Audit (unlimited processes)",
        "Up to 6 automation workflows / month",
        "1 custom AI agent build / quarter",
        "Real-time data synthesis dashboard",
        "Multi-system integration (CRM, ATS, ERP)",
        "Weekly strategy calls + async Slack channel",
      ],
      cta: "Deploy the System",
      payLink: null,
    },
    {
      name: "Principal",
      price: "Custom",
      unit: "/ month",
      badge: "ENTERPRISE",
      desc: "A fractional Chief AI Officer embedded in your org.",
      features: [
        "Everything in Accelerator",
        "Unlimited workflows & agent builds",
        "Fractional Chief AI Officer (named resource)",
        "Board-level AI strategy & briefings",
        "Custom model fine-tuning on proprietary data",
        "SOC 2 / GDPR-aligned compliance architecture",
        "Dedicated Slack + priority async response",
      ],
      cta: "Architect the Future",
      payLink: null,
    },
  ],
  tierTerms: "Billed monthly, cancel anytime after 90 days.",

  standalone: [
    {
      name: "AI Readiness Audit",
      price: "$2,000",
      features: ["1–2 weeks delivery", "Full written ROI roadmap", "Executive readout call included"],
      payLink: null,
    },
    {
      name: "Single Workflow or Agent",
      price: "$3,500+",
      features: ["5–15 business days", "Full integration + documentation", "30-day post-deploy support"],
      payLink: null,
    },
    {
      name: "Keynote / Workshop / Board",
      price: "Custom",
      features: ["Tailored to the room", "Availability by email"],
      payLink: null,
    },
  ],

  // Stripe-hosted. Filled in once the live links exist; null renders the fallback.
  billing: { portalLoginUrl: null },

  about: {
    name: "Mark Bockrath",
    role: "Founder & CEO · Principal AI Architect",
    paras: [
      "Mark spent his career leading enterprise sales teams before building AI systems full time. He kept seeing the same thing: talented people spending their week being human middleware between systems.",
      "MAB AI Strategies builds the agents, workflows and data plumbing that take that work off their plate, then measures the result in hours and dollars.",
      "Strategy, sales and delivery are one chain here. If a plan can't survive implementation, it isn't done.",
    ],
    values: [
      "PRECISION OVER HYPE",
      "MEASURABLE ROI FIRST",
      "DIRECT PARTNERSHIP",
      "VENDOR-NEUTRAL",
      "INTEGRITY-LED",
    ],
  },

  stack: {
    models: ["Claude", "GPT", "Gemini", "Open-weight models where data must stay local"],
    agents: ["LangGraph", "CrewAI", "AG2", "OpenAI Agents SDK", "Claude Agent SDK", "Google ADK"],
    systems: [
      "Zapier",
      "Google Workspace",
      "Apps Script",
      "Python",
      "FastAPI",
      "Node.js",
      "PostgreSQL",
      "Docker",
      "n8n",
      "AWS",
      "GCP",
      "Azure",
    ],
  },

  contact: {
    email: "mark@mabaistrategies.com",
    cal: "https://calendar.app.google/kuwKF2VrDuyvdfN9A",
    linkedin: "https://www.linkedin.com/in/mark-bockrath-a5a1b2196/",
    x: "https://x.com/mab_ai_CEO",
  },

  // Representative system patterns, not client deployments.
  vaultItems: [
    { type: "Agent", name: "Hiring Autopilot", blurb: "Vets candidates, runs outreach, handles onboarding handoffs.", tags: ["ATS", "LangGraph", "Human review"] },
    { type: "Workflow", name: "Invoice Reconciliation Loop", blurb: "Pulls AR, matches POs, flags exceptions to Slack.", tags: ["ERP", "Finance"] },
    { type: "Skill", name: "CRM Hygiene Pack", blurb: "Nightly dedupe, enrichment, and next-action scoring.", tags: ["CRM", "RAG"] },
    { type: "Web App", name: "ROI War Room", blurb: "Live dashboard of automation hours and dollars recovered.", tags: ["FastAPI", "Postgres"] },
    { type: "Agent", name: "Outbound Research Cell", blurb: "Multi-agent research plus personalized first-touch drafts.", tags: ["CrewAI", "Gmail"] },
    { type: "Workflow", name: "Support Triage Mesh", blurb: "Classifies tickets, drafts replies, escalates edge cases.", tags: ["Helpdesk", "Claude"] },
    { type: "Skill", name: "Board Brief Compiler", blurb: "Weekly exec brief from ops and finance signals.", tags: ["RAG", "PDF"] },
    { type: "Web App", name: "Client Phase Tracker", blurb: "Shared project phases, artifacts, and invoice status.", tags: ["Portal", "Stripe"] },
    { type: "Agent", name: "Deal Intelligence Scout", blurb: "Scores opportunities, surfaces risk, drafts next moves.", tags: ["CRM", "Pipeline"] },
    { type: "Workflow", name: "Sales Sequence Fabric", blurb: "Multi-channel sequences with approval gates and stop rules.", tags: ["Outbound", "Zapier"] },
    { type: "Skill", name: "Meeting → CRM Sync", blurb: "Transcript to structured fields, tasks, and follow-ups.", tags: ["Transcripts", "CRM"] },
    { type: "Web App", name: "Systems Gallery", blurb: "Filterable library of ready-to-adapt systems and templates.", tags: ["Library"] },
  ],

  // Hub panels, one per station, in flight order (chronological).
  stops: [
    {
      id: "origin",
      name: "2012 · AlexNet",
      kicker: "STOP 01 · SEP 30, 2012",
      title: "Machines learn\nto see.",
      body: "A neural network wins ImageNet by a margin nobody expected. Seeing the problem clearly is still step one, which is where the AI Readiness Audit starts.",
      route: null,
      atmosphere: "arctic",
    },
    {
      id: "mechanism",
      name: "2016 · Move 37",
      kicker: "STOP 02 · MAR 10, 2016",
      title: "A move no human\nwould play.",
      body: "AlphaGo plays a move the commentators first took for a mistake, then wins. Custom agents find paths like that in the one job you point them at.",
      route: null,
      atmosphere: "lava",
    },
    {
      id: "services",
      name: "2017 · Transformer",
      kicker: "STOP 03 · JUN 12, 2017",
      title: "The architecture\neverything is built on.",
      body: "One paper sets the foundation for the decade that follows. Architecture decisions carry that kind of weight in your stack too.",
      route: "services.html",
      routeLabel: "Services & pricing",
      atmosphere: "ocean",
    },
    {
      id: "proof",
      name: "2022 · Cicero",
      kicker: "STOP 04 · NOV 22, 2022",
      title: "AI learns\nto negotiate.",
      body: "An agent holds its own at the table by reading intent and making its case in plain language. That's the core of a sales system.",
      route: null,
      atmosphere: "desert",
    },
    {
      id: "command",
      name: "2022 · ChatGPT",
      kicker: "STOP 05 · NOV 30, 2022",
      title: "The interface makes\nthe model matter.",
      body: "The model existed for months. A simple front door put it in everyone's hands. Experience is the difference between capable and used.",
      route: "command.html",
      routeLabel: "See systems we build",
      atmosphere: "jungle",
    },
    {
      id: "enterprise",
      name: "2024 · MCP",
      kicker: "STOP 06 · NOV 25, 2024",
      title: "Agents plug into\nthe tools you use.",
      body: "An open standard connects models to the systems where work lives. Workflow automation is that connection, built for your business.",
      route: null,
      atmosphere: "city",
    },
    {
      id: "convergence",
      name: "Today",
      kicker: "STOP 07 · TODAY",
      title: "The next entry\nis yours.",
      body: "You've seen six moments that changed what software can do. The seventh is the workflow you bring to a 30-minute briefing.",
      route: "portal.html",
      routeLabel: "Client billing",
      primaryCal: true,
      atmosphere: "singularity",
    },
  ],
};
