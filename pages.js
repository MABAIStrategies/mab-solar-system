/**
 * Renders the data-driven parts of the standard pages from content.js.
 * Each block runs only if its mount point exists, so one file serves every page.
 */
(function () {
  "use strict";

  const M = window.MAB;
  if (!M) return;
  const $ = (id) => document.getElementById(id);
  const esc = (value) =>
    String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  // Only https links we wrote ourselves are ever used as hrefs.
  const safeUrl = (value) => (typeof value === "string" && /^https:\/\//.test(value) ? value : null);
  const list = (items) => `<ul>${(items || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;

  function buyButton(item, label) {
    const pay = safeUrl(item.payLink);
    return pay
      ? `<a class="btn primary-solid" data-track="paylink_clicked" href="${esc(pay)}" target="_blank" rel="noopener">Start now</a>`
      : `<a class="btn" data-track="booking_clicked" href="${esc(M.contact.cal)}" target="_blank" rel="noopener">${esc(label || "Book a call")}</a>`;
  }

  // Proof: two groups, never merged.
  const proof = $("proof-groups");
  if (proof && M.proof) {
    proof.innerHTML = [
      ["Founder's career record", M.proof.career],
      ["Built at MAB", M.proof.built],
    ]
      .map(([title, items]) => `<div class="proof-group"><h3>${esc(title)}</h3>${list(items)}</div>`)
      .join("");
  }

  const values = $("about-values");
  if (values && M.about) values.innerHTML = (M.about.values || []).map((v) => `<span>${esc(v)}</span>`).join("");

  // Services page
  const services = $("services");
  if (services) {
    services.innerHTML = M.offers
      .filter((o) => o.id !== "briefing")
      .map((o) => `<article class="card" id="offer-${esc(o.id)}"><h3>${esc(o.name)}</h3><p>${esc(o.blurb)}</p>${list(o.specs)}</article>`)
      .join("");
  }
  const tiers = $("tiers");
  if (tiers) {
    tiers.innerHTML = M.tiers
      .map(
        (t) => `<article class="tier${t.badge ? " featured" : ""}">
        ${t.badge ? `<span class="badge">${esc(t.badge)}</span>` : ""}
        <h3>${esc(t.name)}</h3>
        <div class="price">${esc(t.price)} <span>${esc(t.unit)}</span></div>
        <p class="muted">${esc(t.desc)}</p>
        ${list(t.features)}
        ${buyButton(t)}
      </article>`
      )
      .join("");
  }
  const terms = $("tier-terms");
  if (terms) terms.textContent = M.tierTerms || "";
  const standalone = $("standalone");
  if (standalone) {
    standalone.innerHTML = M.standalone
      .map(
        (s) => `<article class="tier">
        <h3>${esc(s.name)}</h3>
        <div class="price">${esc(s.price)}</div>
        ${list(s.features)}
        ${buyButton(s)}
      </article>`
      )
      .join("");
  }
  const stack = $("stack");
  if (stack && M.stack) {
    stack.innerHTML = [...M.stack.models, ...M.stack.agents, ...M.stack.systems].map((x) => `<span>${esc(x)}</span>`).join("");
  }
  const estimator = $("estimator");
  if (estimator && window.MABModule && window.MABModule.mountEstimator) {
    const briefing = window.MABBriefing ? window.MABBriefing.create(safeStorage()) : null;
    window.MABModule.mountEstimator(estimator, briefing);
  }

  function safeStorage() {
    try {
      return window.sessionStorage;
    } catch (_) {
      return null;
    }
  }

  // Systems gallery
  const grid = $("grid");
  const filters = $("filters");
  const search = $("search");
  if (grid && filters && search) {
    const types = ["All", ...new Set(M.vaultItems.map((v) => v.type))];
    let active = "All";
    let query = "";
    const paint = () => {
      const items = M.vaultItems.filter((v) => {
        const hay = `${v.name} ${v.blurb} ${v.tags.join(" ")}`.toLowerCase();
        return (active === "All" || v.type === active) && (!query || hay.includes(query));
      });
      grid.innerHTML = items.length
        ? items
            .map(
              (v) => `<article class="card">
          <p class="type">${esc(v.type)}</p>
          <h3>${esc(v.name)}</h3>
          <p>${esc(v.blurb)}</p>
          <p class="tags">${v.tags.map((t) => `<i>${esc(t)}</i>`).join("")}</p>
        </article>`
            )
            .join("")
        : '<p class="empty">No systems match. Clear the search or pick another type.</p>';
    };
    types.forEach((type) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = type;
      b.setAttribute("aria-pressed", String(type === active));
      b.addEventListener("click", () => {
        active = type;
        filters.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
        paint();
      });
      filters.appendChild(b);
    });
    search.addEventListener("input", () => {
      query = search.value.trim().toLowerCase();
      paint();
    });
    paint();
  }

  // Client billing
  const billing = $("billing-action");
  if (billing) {
    const url = safeUrl(M.billing && M.billing.portalLoginUrl);
    billing.innerHTML = url
      ? `<a class="btn primary-solid" data-track="billing_opened" href="${esc(url)}" target="_blank" rel="noopener">Manage billing</a>`
      : `<a class="btn primary-solid" href="mailto:${esc(M.contact.email)}?subject=${encodeURIComponent("Billing question")}">Email billing</a>`;
    const paid = $("paid-notice");
    if (paid && new URLSearchParams(location.search).get("paid") === "1") paid.hidden = false;
  }
})();
