/**
 * Seven full-screen planet environments.
 * A station click enters a native-scroll world, follows a closed circular camera path,
 * then crosses an outbound rift back to the same position in the space hub.
 */
(function () {
  "use strict";

  const dataApi = window.MABWorldData;
  const orbitApi = window.MABWorldOrbit;
  if (!dataApi || !orbitApi) return;

  const { worldForStation } = dataApi;
  const { orbitAt } = orbitApi;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const root = document.createElement("section");
  root.id = "world-journey";
  root.setAttribute("aria-hidden", "true");
  root.setAttribute("aria-label", "Planet environment journey");
  root.tabIndex = -1;

  function seeded(index, salt) {
    const n = Math.sin((index + 1) * 73.13 + salt * 191.91) * 43758.5453;
    return n - Math.floor(n);
  }

  function items(count, vars) {
    return Array.from({ length: count }, (_, index) => {
      const pairs = vars(index);
      const style = Object.entries(pairs)
        .map(([key, value]) => `${key}:${value}`)
        .join(";");
      return `<i style="${style}"></i>`;
    }).join("");
  }

  function networkSvg() {
    const nodes = Array.from({ length: 22 }, (_, index) => ({
      x: 8 + seeded(index, 1) * 84,
      y: 9 + seeded(index, 2) * 82,
      r: 0.22 + seeded(index, 3) * 0.38,
    }));
    const paths = nodes
      .map((node, index) => {
        const target = nodes[(index * 7 + 5) % nodes.length];
        const cx = (node.x + target.x) / 2 + (seeded(index, 8) - 0.5) * 18;
        const cy = (node.y + target.y) / 2 + (seeded(index, 9) - 0.5) * 15;
        return `<path d="M ${node.x.toFixed(2)} ${node.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${target.x.toFixed(2)} ${target.y.toFixed(2)}" style="animation-delay:${(-index * 0.31).toFixed(2)}s"></path>`;
      })
      .join("");
    const circles = nodes
      .map(
        (node, index) =>
          `<circle cx="${node.x.toFixed(2)}" cy="${node.y.toFixed(2)}" r="${node.r.toFixed(2)}" style="animation-delay:${(-index * 0.14).toFixed(2)}s"></circle>`
      )
      .join("");
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${paths}${circles}</svg>`;
  }

  root.innerHTML = `
    <div class="world-chrome">
      <div class="world-brand">
        <img src="assets/mab-logo.png" alt="">
        <span><b>MAB AI STRATEGIES</b><em class="world-brand-location">PLANETARY FIELD JOURNEY</em></span>
      </div>
      <button class="world-close" type="button" aria-label="Return to the space hub"><span>×</span> RETURN TO HUB</button>
    </div>
    <div class="world-progress" aria-hidden="true"><i></i><span>ENTRY</span></div>
    <div class="world-return-signal" aria-hidden="true"><b>OUTBOUND RIFT ACQUIRING</b><span>Complete the orbit to return to space</span></div>

    <div class="world-sticky">
      <div class="world-scene">
        <div class="world-image world-image-main"></div>
        <div class="world-image world-image-detail"></div>
        <div class="world-depth world-depth--rear"></div>
        <div class="world-atmosphere"></div>

        <div class="world-fx snow">${items(44, (i) => ({
          "--x": `${(seeded(i, 11) * 100).toFixed(1)}%`,
          "--s": `${(2 + seeded(i, 12) * 6).toFixed(1)}px`,
          "--d": `${(6 + seeded(i, 13) * 10).toFixed(1)}s`,
          "--delay": `${(-seeded(i, 14) * 14).toFixed(1)}s`,
          "--drift": `${(-5 + seeded(i, 15) * 15).toFixed(1)}vw`,
          "--b": `${(seeded(i, 16) * 1.2).toFixed(1)}px`,
        }))}</div>
        <div class="world-fx meteors">${items(9, (i) => ({
          "--y": `${(4 + seeded(i, 21) * 48).toFixed(1)}%`,
          "--l": `${(110 + seeded(i, 22) * 210).toFixed(0)}px`,
          "--d": `${(3.8 + seeded(i, 23) * 5.6).toFixed(1)}s`,
          "--delay": `${(-seeded(i, 24) * 12).toFixed(1)}s`,
        }))}</div>
        <div class="world-fx embers">${items(40, (i) => ({
          "--x": `${(seeded(i, 31) * 100).toFixed(1)}%`,
          "--s": `${(1.2 + seeded(i, 32) * 4).toFixed(1)}px`,
          "--d": `${(4 + seeded(i, 33) * 6).toFixed(1)}s`,
          "--delay": `${(-seeded(i, 34) * 10).toFixed(1)}s`,
          "--drift": `${(-5 + seeded(i, 35) * 10).toFixed(1)}vw`,
        }))}</div>
        <div class="world-fx bubbles">${items(28, (i) => ({
          "--x": `${(seeded(i, 41) * 100).toFixed(1)}%`,
          "--s": `${(5 + seeded(i, 42) * 24).toFixed(1)}px`,
          "--d": `${(7 + seeded(i, 43) * 10).toFixed(1)}s`,
          "--delay": `${(-seeded(i, 44) * 14).toFixed(1)}s`,
          "--drift": `${(-3 + seeded(i, 45) * 7).toFixed(1)}vw`,
        }))}</div>
        <div class="world-fx droplets">${items(18, (i) => ({
          "--x": `${(seeded(i, 51) * 96).toFixed(1)}%`,
          "--y": `${(seeded(i, 52) * 92).toFixed(1)}%`,
          "--s": `${(8 + seeded(i, 53) * 38).toFixed(1)}px`,
        }))}</div>
        <div class="world-fx microbes">${items(15, (i) => ({
          "--x": `${(seeded(i, 61) * 92).toFixed(1)}%`,
          "--y": `${(8 + seeded(i, 62) * 78).toFixed(1)}%`,
          "--s": `${(32 + seeded(i, 63) * 92).toFixed(1)}px`,
          "--d": `${(8 + seeded(i, 64) * 10).toFixed(1)}s`,
          "--delay": `${(-seeded(i, 65) * 12).toFixed(1)}s`,
          "--drift": `${(-8 + seeded(i, 66) * 16).toFixed(1)}vw`,
        }))}</div>
        <div class="world-fx rain">${items(70, (i) => ({
          "--x": `${(seeded(i, 71) * 100).toFixed(1)}%`,
          "--l": `${(45 + seeded(i, 72) * 130).toFixed(0)}px`,
          "--d": `${(0.65 + seeded(i, 73) * 0.9).toFixed(2)}s`,
          "--delay": `${(-seeded(i, 74) * 2).toFixed(2)}s`,
        }))}</div>
        <div class="world-fx city-lights">${items(12, (i) => ({
          "--y": `${(48 + seeded(i, 81) * 44).toFixed(1)}%`,
          "--l": `${(90 + seeded(i, 82) * 220).toFixed(0)}px`,
          "--d": `${(2.5 + seeded(i, 83) * 5).toFixed(1)}s`,
          "--delay": `${(-seeded(i, 84) * 7).toFixed(1)}s`,
          "--c": i % 2 ? "#ff4ca7" : "#57dcff",
        }))}</div>
        <div class="world-fx agent-network">${networkSvg()}</div>

        <div class="world-rift world-rift--entry" aria-hidden="true"><i class="rift-ring"></i><i class="rift-ring"></i><i class="rift-ring"></i></div>
        <div class="world-rift world-rift--exit" aria-hidden="true"><i class="rift-ring"></i><i class="rift-ring"></i><i class="rift-ring"></i></div>
        <div class="world-depth world-depth--near"></div>
      </div>
    </div>
    <div class="world-narrative"></div>
  `;
  document.body.appendChild(root);

  const mainImage = root.querySelector(".world-image-main");
  const detailImage = root.querySelector(".world-image-detail");
  const narrative = root.querySelector(".world-narrative");
  const closeButton = root.querySelector(".world-close");
  const progressLabel = root.querySelector(".world-progress span");
  const locationLabel = root.querySelector(".world-brand-location");
  const entryRift = root.querySelector(".world-rift--entry");
  const exitRift = root.querySelector(".world-rift--exit");

  let activeWorld = null;
  let savedHubY = 0;
  let exitTimer = 0;
  let exitArmed = false;
  let framePending = false;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderNarrative(world) {
    const chapterMarkup = world.chapters
      .map(
        (chapter, index) => `
          <section class="world-beat" data-beat="${index + 1}">
            <div class="world-beat-card">
              <div class="beat-index">${String(index + 1).padStart(2, "0")} · ${escapeHtml(chapter.tag)}</div>
              <h2>${escapeHtml(chapter.title)}</h2>
              <p>${escapeHtml(chapter.body)}</p>
            </div>
          </section>`
      )
      .join("");

    narrative.innerHTML = `
      <section class="world-beat world-beat--intro active" data-beat="0">
        <div class="world-beat-card">
          <div class="beat-index">${escapeHtml(world.eyebrow)}</div>
          <h2>${escapeHtml(world.title)}</h2>
          <p>${escapeHtml(world.subtitle)} ${escapeHtml(world.atmosphere)}</p>
        </div>
      </section>
      ${chapterMarkup}
      <section class="world-beat world-beat--exit" data-beat="${world.chapters.length + 1}">
        <div class="world-beat-card">
          <div class="beat-index">ORBIT COMPLETE · OPPOSITE APPROACH</div>
          <h2>Cross the rift.</h2>
          <p>Keep scrolling. The outbound rift will return you to ${escapeHtml(world.title)} in the main space hub.</p>
        </div>
      </section>`;
  }

  function preload(world) {
    [world.image, world.detailImage].forEach((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
    });
  }

  function setActiveBeat() {
    const center = innerHeight * 0.5;
    let closest = null;
    let distance = Infinity;
    root.querySelectorAll(".world-beat").forEach((beat) => {
      const rect = beat.getBoundingClientRect();
      const current = Math.abs(rect.top + rect.height * 0.5 - center);
      if (current < distance) {
        distance = current;
        closest = beat;
      }
    });
    root.querySelectorAll(".world-beat").forEach((beat) => {
      beat.classList.toggle("active", beat === closest);
    });
    if (closest && progressLabel) {
      const tag = closest.querySelector(".beat-index")?.textContent || "ORBIT";
      progressLabel.textContent = tag.split("·").pop().trim();
    }
  }

  function updateWorld() {
    framePending = false;
    if (!activeWorld) return;

    const maxScroll = Math.max(1, root.scrollHeight - root.clientHeight);
    const progress = Math.max(0, Math.min(1, root.scrollTop / maxScroll));
    const orbit = orbitAt(progress);
    const revealIn = Math.max(0, Math.min(1, (progress - 0.2) / 0.2));
    const revealOut = 1 - Math.max(0, Math.min(1, (progress - 0.76) / 0.17));
    const detailAlpha = revealIn * revealOut;

    root.style.setProperty("--world-progress", String(progress));
    root.style.setProperty("--detail-alpha", String(detailAlpha));
    root.style.setProperty("--orbit-x", `${orbit.x.toFixed(3)}vw`);
    root.style.setProperty("--orbit-y", `${orbit.y.toFixed(3)}vh`);
    root.style.setProperty("--orbit-zoom", orbit.zoom.toFixed(4));
    root.style.setProperty("--orbit-roll", `${orbit.roll.toFixed(3)}deg`);
    root.style.setProperty("--parallax-x", `${orbit.parallaxX.toFixed(3)}vw`);
    root.style.setProperty("--parallax-y", `${orbit.parallaxY.toFixed(3)}vh`);
    root.style.setProperty("--return-signal", String(orbit.exitRift));
    entryRift.style.setProperty("--rift-power", String(orbit.entryRift));
    entryRift.style.setProperty("--rift-spin", String(progress * -240));
    exitRift.style.setProperty("--rift-power", String(orbit.exitRift));
    exitRift.style.setProperty("--rift-spin", String(progress * 320));

    setActiveBeat();

    if (progress > 0.72) exitArmed = true;
    if (
      exitArmed &&
      orbit.exitRift > 0.9 &&
      root.scrollTop >= maxScroll - 4 &&
      !exitTimer
    ) {
      exitTimer = window.setTimeout(() => close("rift"), reduceMotion ? 250 : 950);
    }
  }

  function requestUpdate() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(updateWorld);
  }

  function open(stationId) {
    const world = worldForStation(stationId);
    if (!world) return false;
    if (activeWorld) return activeWorld.stationId === stationId;

    activeWorld = world;
    savedHubY = window.scrollY;
    exitArmed = false;
    clearTimeout(exitTimer);
    exitTimer = 0;

    preload(world);
    renderNarrative(world);
    root.dataset.theme = world.theme;
    root.style.setProperty("--world-ink", world.palette.ink);
    root.style.setProperty("--world-accent", world.palette.accent);
    root.style.setProperty("--world-glow", world.palette.glow);
    root.style.setProperty("--world-shadow", world.palette.shadow);
    mainImage.style.backgroundImage = `url("${world.image}")`;
    detailImage.style.backgroundImage = `url("${world.detailImage}")`;
    locationLabel.textContent = `${world.eyebrow} · CIRCULAR FIELD JOURNEY`;

    root.classList.remove("exiting");
    root.setAttribute("aria-hidden", "false");
    root.scrollTo({ top: 0, behavior: "auto" });
    document.body.classList.add("world-open");
    requestAnimationFrame(() => {
      root.classList.add("active");
      updateWorld();
      closeButton.focus({ preventScroll: true });
    });

    window.dispatchEvent(
      new CustomEvent("mab:world-open", { detail: { stationId, theme: world.theme } })
    );
    return true;
  }

  function close(reason) {
    if (!activeWorld) return false;
    const world = activeWorld;
    clearTimeout(exitTimer);
    exitTimer = 0;
    root.classList.add("exiting");

    window.setTimeout(
      () => {
        root.classList.remove("active", "exiting");
        root.setAttribute("aria-hidden", "true");
        document.body.classList.remove("world-open");
        root.scrollTop = 0;
        window.scrollTo(0, savedHubY);
        if (window.__lenis) {
          try { window.__lenis.scrollTo(savedHubY, { immediate: true }); } catch (_) {}
        }
        activeWorld = null;
        window.dispatchEvent(
          new CustomEvent("mab:world-close", {
            detail: { stationId: world.stationId, theme: world.theme, reason: reason || "manual" },
          })
        );
      },
      reduceMotion ? 80 : 620
    );
    return true;
  }

  root.addEventListener("scroll", requestUpdate, { passive: true });
  closeButton.addEventListener("click", () => close("manual"));
  addEventListener("resize", requestUpdate, { passive: true });
  addEventListener("keydown", (event) => {
    if (!activeWorld) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close("escape");
    }
    if (event.key === "Home") {
      event.preventDefault();
      root.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
    if (event.key === "End") {
      event.preventDefault();
      root.scrollTo({ top: root.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
    }
  });

  window.MABWorldJourney = {
    open,
    close,
    isOpen: () => !!activeWorld,
    activeWorld: () => activeWorld,
  };
})();
