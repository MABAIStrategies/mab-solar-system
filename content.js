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

  // Pricing guide. `payLink` takes a Stripe Payment Link URL; null shows "Book a call".
  // An item Mark has not priced shows words, never a number.
  pricing: [
    {
      id: "start",
      title: "Start here",
      items: [
        {
          id: "audit",
          name: "AI Readiness Audit",
          price: "$2,000",
          desc: "Find where the hours go before anything gets built.",
          features: [
            "1.5-hour discovery meeting with a MAB representative",
            "Detailed readout and printed blueprint within 48 hours",
            "1-hour follow-up strategy meeting with Mark",
          ],
          payLink: null,
        },
        {
          id: "audit-workflow",
          name: "Audit + Workflow Bundle",
          price: "Ask for pricing",
          desc: "The discovery meeting, plus your first workflow live the same week.",
          features: ["Discovery meeting", "One workflow built and implemented within 72 hours"],
          payLink: null,
        },
      ],
    },
    {
      id: "retainers",
      title: "Monthly retainers",
      items: [
        {
          id: "junior",
          name: "Junior Dev Retainer",
          price: "$1,000",
          unit: "/ month",
          desc: "A steady build cadence for a team getting started.",
          features: ["One workflow built and implemented each month", "6-month minimum"],
          payLink: null,
        },
        {
          id: "google",
          name: "Google Special",
          price: "$800",
          unit: "/ month",
          badge: "GOOGLE WORKSPACE",
          desc: "For teams that run on Google.",
          features: ["One Google-specific workflow each month", "8-month minimum"],
          payLink: null,
        },
        {
          id: "senior",
          name: "Senior Dev Retainer",
          price: "$5,000–$25,000",
          unit: "build",
          desc: "One end-to-end system, architected and built, then kept running.",
          features: [
            "1 to 3 months of architecture, with a deposit each month",
            "Build cost paid in full by the end of month 3 unless contracted otherwise",
            "Retainer after the build: $500 / month for system work, $1,000 / month for consulting and strategy",
            "Minimum retainer: 6 months after 1 month of architecture, 9 months after 2, 12 months after 3",
            "Architecture time does not count toward the retainer term",
          ],
          payLink: null,
        },
      ],
    },
    {
      id: "training",
      title: "AI strategy and company training",
      items: [
        {
          id: "discovery",
          name: "Departmental Discovery and Scoping",
          price: "$500",
          unit: "per department",
          desc: "Scope where AI fits, one department or the whole company.",
          features: ["Select departments: $500 each", "Full company: $1,000–$2,000"],
          payLink: null,
        },
        {
          id: "exec-training",
          name: "Executive and Leader Training",
          price: "$1,000",
          unit: "per 5 seats",
          desc: "For the people who set direction and sign off on spend.",
          features: ["1–5 seats: $1,000", "6–10 seats: $2,000", "11–15 seats: $3,000, and so on"],
          payLink: null,
        },
        {
          id: "team-coaching",
          name: "Department and Team Coaching",
          price: "$120",
          unit: "per seat, per session",
          desc: "Hands-on sessions for the people doing the work.",
          features: ["Priced per seat for each session", "Built around your team's own workflows"],
          payLink: null,
        },
      ],
    },
    {
      id: "custom",
      title: "Custom work and the library",
      items: [
        {
          id: "custom-build",
          name: "Custom Agent or Agentic Workflow",
          price: "Talk to sales",
          desc: "Something specific to your business that isn't on a shelf.",
          features: ["Scoped with our sales team", "Quoted after discovery"],
          payLink: null,
        },
        {
          id: "library",
          name: "Buy From Our Library",
          price: "From $250",
          desc: "Agents, workflows, skills and apps we've already built, ready to adapt.",
          features: ["Price listed on each card as it is published", "Fitted to your tools before it ships"],
          payLink: null,
          href: "/command",
          cta: "Browse the library",
        },
      ],
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
  // Add `price: "$1,200"` to an item to show it on its card; without one the card says "Price on request".
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
      body: "Three researchers and two gaming graphics cards teach a computer to tell what is in a photo, and win the field's biggest contest by a mile. Seeing the problem clearly is still step one. That is the AI Readiness Audit.",
      route: null,
      atmosphere: "arctic",
    },
    {
      id: "mechanism",
      name: "2016 · AlphaGo",
      kicker: "STOP 02 · MAR 10, 2016",
      title: "The move no human\nwould play.",
      body: "A program built to play one 2,500-year-old board game makes a move the experts call a mistake, then beats one of the best players alive. That is what an AI agent built for one job can do. We build them for yours.",
      route: null,
      atmosphere: "lava",
    },
    {
      id: "services",
      name: "2017 · Transformer",
      kicker: "STOP 03 · JUN 12, 2017",
      title: "The blueprint\neverything is built on.",
      body: "Eight researchers publish one design, and nearly every AI tool since is built on it. The win was a better blueprint, not more horsepower. Fractional AI Architecture gets yours right the first time.",
      route: "services.html",
      routeLabel: "Services & pricing",
      atmosphere: "ocean",
    },
    {
      id: "proof",
      name: "2022 · Cicero",
      kicker: "STOP 04 · NOV 22, 2022",
      title: "An AI learns\nto negotiate.",
      body: "In a board game you can only win by talking people into deals, an AI finishes in the top 10%. Right message, right person, right moment. That is what AI Sales Systems do in your pipeline.",
      route: null,
      atmosphere: "desert",
    },
    {
      id: "command",
      name: "2022 · ChatGPT",
      kicker: "STOP 05 · NOV 30, 2022",
      title: "AI gets\na front door.",
      body: "The engine had been around for two years. Then someone put a plain chat box on it and a million people showed up in five days. Conversion Web Experiences build that front door for your business.",
      route: "command.html",
      routeLabel: "See systems we build",
      atmosphere: "jungle",
    },
    {
      id: "enterprise",
      name: "2024 · MCP",
      kicker: "STOP 06 · NOV 25, 2024",
      title: "One plug\nfor every tool.",
      body: "AI could think but could not reach the software where work happens, until one open standard gave it a common plug. Workflow Automation makes that connection across your CRM, inbox and back office.",
      route: null,
      atmosphere: "city",
    },
    {
      id: "convergence",
      name: "Today",
      kicker: "STOP 07 · TODAY",
      title: "Your move.",
      body: "You've seen six moments that changed what software can do. The seventh is the workflow you bring to a 30-minute briefing.",
      route: "portal.html",
      routeLabel: "Client billing",
      primaryCal: true,
      atmosphere: "singularity",
    },
  ],
};
