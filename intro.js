/**
 * MAB intro — cinematic MP4 bumper that doubles as journey loader.
 * First paint: video (or brand fallback). Background: Three.js / hub boot.
 * Dismisses when bumper finishes (or skip) AND (scene ready or soft timeout).
 */
(function () {
  "use strict";

  const FALLBACK_MIN_MS = 2800;
  const AFTER_VIDEO_MAX_MS = 6000;
  const HARD_MAX_MS = 22000;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const root = document.getElementById("intro");
  if (!root) return;

  const video = document.getElementById("intro-video");
  const logo = root.querySelector(".intro-logo");
  const lines = [...root.querySelectorAll(".intro-line")];
  const bar = root.querySelector(".intro-bar > i");
  const status = root.querySelector(".intro-status");
  const skip = root.querySelector(".intro-skip");
  const soundBtn = root.querySelector(".intro-sound");
  const stage = root.querySelector(".intro-stage");

  document.documentElement.classList.add("intro-active");
  document.body.classList.add("intro-active");

  const t0 = performance.now();
  let animDone = false; // video ended OR fallback timeline done OR skip
  let sceneReady = false;
  let dismissed = false;
  let progress = 0;
  let mode = "video"; // "video" | "fallback"
  let videoEndedAt = 0;
  let loadBoost = 0; // script-loader progress contribution (0–0.12)

  function setStatus(t) {
    if (status) status.textContent = t;
  }

  function setProgress(p) {
    progress = Math.max(progress, Math.min(1, p));
    if (bar) bar.style.transform = `scaleX(${progress})`;
  }

  /** External script loader can nudge the bar without fighting video progress. */
  function boostFromLoader(p) {
    loadBoost = Math.max(loadBoost, Math.min(0.12, p * 0.12));
    if (mode === "fallback" || !video || video.readyState < 2) {
      setProgress(Math.max(progress, 0.15 + p * 0.55));
    } else if (video.duration && isFinite(video.duration)) {
      const vp = video.currentTime / video.duration;
      setProgress(Math.min(0.98, vp * 0.92 + loadBoost));
    }
  }

  function enterFallback(reason) {
    if (mode === "fallback") return;
    mode = "fallback";
    root.classList.add("intro-fallback");
    if (stage) stage.setAttribute("aria-hidden", "false");
    if (video) {
      try {
        video.pause();
      } catch (_) {}
      video.style.display = "none";
    }
    if (soundBtn) soundBtn.hidden = true;
    setStatus(reason || "Preparing the journey…");
    runFallbackAnimation();
  }

  function runFallbackAnimation() {
    if (reduce) {
      root.classList.add("intro-reduce");
      logo && logo.classList.add("show");
      lines.forEach((l) => l.classList.add("show"));
      animDone = true;
      setProgress(0.35);
      setStatus(sceneReady ? "Entering the system…" : "Loading high-fidelity stage…");
      tryDismiss();
      return;
    }

    requestAnimationFrame(() => root.classList.add("intro-in"));

    setTimeout(() => {
      logo && logo.classList.add("show");
      const glow = root.querySelector(".intro-logo-glow");
      if (glow) glow.classList.add("show");
      setProgress(0.18);
      setStatus("Igniting mark…");
    }, 180);

    lines.forEach((line, i) => {
      setTimeout(() => {
        line.classList.add("show");
        setProgress(0.28 + i * 0.12);
      }, 900 + i * 700);
    });

    setTimeout(() => {
      setStatus("Opening the void…");
      setProgress(0.62);
      root.classList.add("intro-hold");
    }, 900 + lines.length * 700 + 200);

    setTimeout(() => {
      animDone = true;
      setProgress(Math.max(progress, 0.72));
      setStatus(sceneReady ? "Entering the system…" : "Loading high-fidelity stage…");
      tryDismiss();
    }, FALLBACK_MIN_MS - 200);
  }

  function onVideoProgress() {
    if (dismissed || mode !== "video" || !video) return;
    const dur = video.duration;
    if (!dur || !isFinite(dur) || dur <= 0) return;
    const t = video.currentTime / dur;
    setProgress(Math.min(0.98, t * 0.92 + loadBoost));

    if (t > 0.08 && t < 0.85) setStatus("Through the dark…");
    else if (t >= 0.85) setStatus(sceneReady ? "Entering the system…" : "Locking the stage…");
  }

  function markVideoDone() {
    if (animDone && mode === "video") return;
    animDone = true;
    videoEndedAt = performance.now();
    setProgress(Math.max(progress, 0.94));
    setStatus(sceneReady ? "Enter" : "Stage loading…");
    tryDismiss();
  }

  function tryDismiss() {
    if (dismissed) return;
    const elapsed = performance.now() - t0;

    // Absolute safety valve
    if (elapsed >= HARD_MAX_MS) {
      finishDismiss();
      return;
    }

    // Bumper / fallback animation must finish first (unless hard max)
    if (!animDone) return;

    // Enter when scene is ready, or after a short post-bumper grace
    const waitedAfterBumper =
      mode === "video"
        ? videoEndedAt > 0 && performance.now() - videoEndedAt >= AFTER_VIDEO_MAX_MS
        : elapsed >= (reduce ? 400 : FALLBACK_MIN_MS) + AFTER_VIDEO_MAX_MS;

    if (sceneReady || waitedAfterBumper) finishDismiss();
  }

  function finishDismiss() {
    if (dismissed) return;
    dismissed = true;
    setProgress(1);
    setStatus("Enter");
    root.classList.add("intro-out");
    document.documentElement.classList.remove("intro-active");
    document.body.classList.remove("intro-active");

    if (video) {
      try {
        video.pause();
      } catch (_) {}
    }

    setTimeout(() => {
      root.setAttribute("aria-hidden", "true");
      root.style.display = "none";
      if (video) {
        try {
          video.removeAttribute("src");
          video.load();
        } catch (_) {}
      }
      window.dispatchEvent(new CustomEvent("mab:intro-done"));
    }, reduce ? 200 : 950);
  }

  function forceSkip() {
    animDone = true;
    sceneReady = true;
    if (video) {
      try {
        video.pause();
      } catch (_) {}
    }
    tryDismiss();
  }

  // Soft progress / timeouts
  const tick = setInterval(() => {
    if (dismissed) {
      clearInterval(tick);
      return;
    }
    if (mode === "fallback" && !sceneReady) {
      setProgress(progress + (0.92 - progress) * 0.02);
    }
    if (mode === "video" && animDone && !sceneReady) {
      setProgress(progress + (0.97 - progress) * 0.04);
      setStatus("Locking high-fidelity stage…");
    }
    tryDismiss();
  }, 120);

  window.addEventListener("mab:scene-ready", () => {
    sceneReady = true;
    setProgress(Math.max(progress, 0.96));
    if (animDone) setStatus("Stage locked — entering…");
    tryDismiss();
  });

  if (window.MABSpace && window.MABSpace.ready) {
    sceneReady = true;
  }

  if (skip) {
    skip.addEventListener("click", forceSkip);
  }

  if (soundBtn && video) {
    soundBtn.addEventListener("click", () => {
      const wantUnmute = video.muted || video.volume === 0;
      try {
        if (wantUnmute) {
          video.muted = false;
          video.volume = 1;
          soundBtn.setAttribute("aria-pressed", "true");
          soundBtn.textContent = "Mute";
          soundBtn.setAttribute("aria-label", "Mute intro audio");
          const p = video.play();
          if (p && p.catch) p.catch(() => {});
        } else {
          video.muted = true;
          soundBtn.setAttribute("aria-pressed", "false");
          soundBtn.textContent = "Sound";
          soundBtn.setAttribute("aria-label", "Unmute intro audio");
        }
      } catch (_) {}
    });
  }

  window.addEventListener(
    "keydown",
    (e) => {
      if (dismissed) return;
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        forceSkip();
      } else if ((e.key === "m" || e.key === "M") && video && mode === "video" && soundBtn) {
        soundBtn.click();
      }
    },
    { passive: false }
  );

  function startVideo() {
    if (!video || reduce) {
      enterFallback(reduce ? "Reduced motion" : "Preparing the journey…");
      return;
    }

    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    const onReady = () => {
      root.classList.add("intro-video-ready");
      setStatus("Through the dark…");
    };

    video.addEventListener("loadeddata", onReady, { once: true });
    video.addEventListener("canplay", onReady, { once: true });
    video.addEventListener("timeupdate", onVideoProgress);
    video.addEventListener("ended", markVideoDone);
    video.addEventListener("error", () => enterFallback("Preparing the journey…"));

    // If metadata already cached
    if (video.readyState >= 2) onReady();

    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.then === "function") {
      playAttempt
        .then(() => {
          root.classList.add("intro-video-ready");
        })
        .catch(() => {
          // Autoplay blocked — show play affordance via skip label / one-tap
          setStatus("Tap to begin");
          const unlock = () => {
            video.play().then(() => {
              root.classList.add("intro-video-ready");
              setStatus("Through the dark…");
            }).catch(() => enterFallback("Preparing the journey…"));
            window.removeEventListener("pointerdown", unlock);
            window.removeEventListener("keydown", unlock);
          };
          window.addEventListener("pointerdown", unlock, { once: true });
          window.addEventListener("keydown", unlock, { once: true });
        });
    }

    // Safety: if video never progresses, fall back
    setTimeout(() => {
      if (dismissed || mode !== "video") return;
      if (!video.currentTime || video.currentTime < 0.05) {
        enterFallback("Preparing the journey…");
      }
    }, 3500);
  }

  startVideo();

  window.MABIntro = {
    setProgress: boostFromLoader,
    tryDismiss,
    forceReady() {
      sceneReady = true;
      tryDismiss();
    },
    skip: forceSkip,
  };
})();
