#!/usr/bin/env node
/**
 * Writes the parts of the static pages that are derived from data, so they cannot drift:
 *   - nav and footer on every page
 *   - the crawlable timeline and JSON-LD in index.html
 *   - sitemap.xml
 * Output is committed. Run `node scripts/build-static.cjs` after changing content.js or
 * world-data.js; `--check` exits 1 if any file is out of date (used by the test suite).
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const SITE = "https://mabaistrategies.com";
const check = process.argv.includes("--check");

const { WORLD_DEFS } = require(path.join(root, "world-data.js"));
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "content.js"), "utf8"), sandbox);
const MAB = JSON.parse(JSON.stringify(sandbox.window.MAB));

const esc = (v) =>
  String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// path -> { nav key, in sitemap }
const PAGES = {
  "index.html": { key: "journey", url: "/" },
  "services.html": { key: "services", url: "/services" },
  "command.html": { key: "systems", url: "/command" },
  "about.html": { key: "about", url: "/about" },
  "contact.html": { key: "contact", url: "/contact" },
  "portal.html": { key: "billing", url: null },
  "privacy.html": { key: "", url: "/privacy" },
  "terms.html": { key: "", url: "/terms" },
  "refunds.html": { key: "", url: "/refunds" },
  "404.html": { key: "", url: null },
};

const NAV = [
  ["journey", "/", "Journey"],
  ["services", "/services", "Services"],
  ["systems", "/command", "Systems"],
  ["about", "/about", "About"],
  ["billing", "/portal", "Client billing"],
];

function nav(active) {
  const links = NAV.map(
    ([key, href, label]) => `    <a${key === active ? ' class="on" aria-current="page"' : ""} href="${href}">${label}</a>`
  ).join("\n");
  return `<header class="site-nav" id="site-nav">
  <nav class="nav-pill" aria-label="Main">
    <a class="brand" href="/" aria-label="MAB AI Strategies home"><img src="/assets/mab-logo-256.png" alt="" width="30" height="30"><span>MAB <em>AI Strategies</em></span></a>
${links}
    <a class="nav-cta show-m" href="${esc(MAB.contact.cal)}" target="_blank" rel="noopener">Briefing</a>
  </nav>
</header>`;
}

function footer() {
  const year = "2026";
  return `<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <img src="/assets/mab-logo-256.png" alt="" width="44" height="44" loading="lazy">
      <p><strong>${esc(MAB.company)}</strong><br>${esc(MAB.tagline)}</p>
    </div>
    <nav aria-label="Site">
      <a href="/">Journey</a>
      <a href="/services">Services</a>
      <a href="/command">Systems</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
      <a href="/portal">Client billing</a>
    </nav>
    <nav aria-label="Connect">
      <a href="mailto:${esc(MAB.contact.email)}">${esc(MAB.contact.email)}</a>
      <a href="${esc(MAB.contact.cal)}" target="_blank" rel="noopener">Book a briefing</a>
      <a href="${esc(MAB.contact.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
      <a href="${esc(MAB.contact.x)}" target="_blank" rel="noopener">X</a>
    </nav>
    <nav aria-label="Legal">
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/refunds">Refund &amp; Return Policy</a>
    </nav>
  </div>
  <p class="footer-legal">© ${year} ${esc(MAB.company)}</p>
</footer>`;
}

function timeline() {
  const offer = (id) => MAB.offers.find((o) => o.id === id);
  const articles = WORLD_DEFS.map((w) => {
    const o = offer(w.offerId);
    const time = w.live
      ? `<time data-live-date>Today</time>`
      : `<time datetime="${w.dateISO}">${esc(w.dateLabel)}</time>`;
    const source = w.sourceUrl
      ? ` <a class="tl-source" href="${esc(w.sourceUrl)}" target="_blank" rel="noopener">Source</a>`
      : "";
    return `    <article class="tl-stop" id="stop-${w.stationId}" data-station="${w.stationId}" style="--tl-accent:${w.palette.accent}">
      <p class="tl-kicker">Stop ${String(w.order).padStart(2, "0")} · ${esc(w.title)}</p>
      <h2>${time}</h2>
      <p class="tl-caption">${esc(w.caption)}${source}</p>
      <div class="tl-offer">
        <h3>${esc(o.name)}</h3>
        <p>${esc(o.blurb)}</p>
        <ul>${o.specs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
        <a class="btn${w.live ? " primary-solid" : ""}" href="${w.live ? esc(MAB.contact.cal) : "/services"}"${w.live ? ' target="_blank" rel="noopener"' : ""}>${w.live ? "Book the briefing" : "See services and pricing"}</a>
      </div>
    </article>`;
  }).join("\n");
  const chips = (label, list) => list.map((t) => `<li><strong>${esc(t)}</strong><span>${label}</span></li>`).join("");
  return `<main id="timeline" class="timeline" tabindex="-1">
  <header class="tl-hero">
    <img src="/assets/mab-logo.png" alt="MAB AI Strategies" width="160" height="160">
    <h1>${esc(MAB.tagline)}</h1>
    <p>${esc(MAB.heroSub)}</p>
    <p class="tl-lede">Six moments that changed what software can do, and what each one means for your business.</p>
    <div class="tl-hero-actions">
      <a class="btn primary-solid" href="${esc(MAB.contact.cal)}" target="_blank" rel="noopener">Book a briefing</a>
      <a class="btn" href="/?flat=0" data-launch-journey>Launch the 3D journey</a>
    </div>
  </header>
  <div class="tl-stops">
${articles}
  </div>
  <section class="tl-proof" aria-label="Track record">
    <ul>${chips("Founder's career record", MAB.proof.career)}${chips("Built at MAB", MAB.proof.built)}</ul>
  </section>
</main>`;
}

function jsonLd() {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: MAB.company,
    url: SITE + "/",
    logo: SITE + "/assets/mab-logo.png",
    slogan: MAB.tagline,
    email: MAB.contact.email,
    sameAs: [MAB.contact.linkedin, MAB.contact.x],
    founder: { "@type": "Person", name: MAB.about.name },
  };
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: MAB.about.name,
    jobTitle: "Founder & CEO",
    worksFor: { "@type": "Organization", name: MAB.company, url: SITE + "/" },
    image: SITE + "/assets/mark-bockrath.jpg",
    sameAs: [MAB.contact.linkedin, MAB.contact.x],
  };
  const services = {
    "@context": "https://schema.org",
    "@graph": MAB.offers
      .filter((o) => o.id !== "briefing")
      .map((o) => ({
        "@type": "Service",
        name: o.name,
        description: o.blurb,
        provider: { "@type": "Organization", name: MAB.company, url: SITE + "/" },
        url: SITE + "/services",
      })),
  };
  return [org, person, services]
    .map((d) => `<script type="application/ld+json">${JSON.stringify(d).replaceAll("<", "\\u003c")}</script>`)
    .join("\n");
}

function sitemap() {
  const urls = Object.values(PAGES)
    .filter((p) => p.url)
    .map((p) => `  <url><loc>${SITE}${p.url}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// Replace the text between <!-- name:start --> and <!-- name:end -->.
function inject(html, name, content, file) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const a = html.indexOf(start);
  const b = html.indexOf(end);
  if (a === -1 || b === -1 || b < a) throw new Error(`${file}: missing ${name} markers`);
  return html.slice(0, a + start.length) + "\n" + content + "\n" + html.slice(b);
}

const stale = [];
function write(file, next) {
  const full = path.join(root, file);
  const prev = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
  if (prev === next) return;
  if (check) stale.push(file);
  else fs.writeFileSync(full, next);
}

for (const [file, page] of Object.entries(PAGES)) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) throw new Error(`${file} is listed in PAGES but does not exist`);
  let html = fs.readFileSync(full, "utf8");
  html = inject(html, "nav", nav(page.key), file);
  html = inject(html, "footer", footer(), file);
  if (file === "index.html") {
    html = inject(html, "timeline", timeline(), file);
    html = inject(html, "jsonld", jsonLd(), file);
  }
  write(file, html);
}
write("sitemap.xml", sitemap());

if (check && stale.length) {
  console.error(`Out of date: ${stale.join(", ")}. Run: node scripts/build-static.cjs`);
  process.exit(1);
}
console.log(check ? "build-static: up to date" : "build-static: written");
