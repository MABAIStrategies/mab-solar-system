/**
 * Contact form. Posts to the same Formspree form the previous site used. If the request
 * fails, it opens the visitor's mail app with the message filled in, so nothing is lost.
 */
(function () {
  "use strict";

  const ENDPOINT = "https://formspree.io/f/mwvjdbyv";
  const form = document.getElementById("contact-form");
  if (!form) return;
  const status = document.getElementById("cf-status");
  const button = document.getElementById("cf-submit");
  const email = (window.MAB && window.MAB.contact.email) || "mark@mabaistrategies.com";
  const field = (id) => form.querySelector("#" + id);
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function say(kind, text) {
    status.className = "form-status" + (kind ? " " + kind : "");
    status.textContent = text;
  }

  function mailto(p) {
    const body = `Name: ${p.name}\nEmail: ${p.email}\nCompany: ${p.company || "-"}\nTopic: ${p.service || "-"}\n\n${p.message}`.slice(0, 1500);
    return `mailto:${email}?subject=${encodeURIComponent("Website inquiry from " + p.name)}&body=${encodeURIComponent(body)}`;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (field("cf-website").value) return; // honeypot: bots fill it, people never see it
    if (button.disabled) return;

    const payload = {
      name: field("cf-name").value.trim(),
      email: field("cf-email").value.trim(),
      company: field("cf-company").value.trim(),
      service: field("cf-service").value,
      message: field("cf-message").value.trim(),
      _subject: "MAB AI website: new inquiry",
    };
    if (!payload.name || !payload.message || !isEmail(payload.email)) {
      say("err", "Add your name, a valid email and a message, then send again.");
      (!payload.name ? field("cf-name") : !isEmail(payload.email) ? field("cf-email") : field("cf-message")).focus();
      return;
    }

    button.disabled = true;
    say("", "Sending…");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      form.reset();
      say("ok", "Sent. Mark will reply within one business day.");
      if (window.MABTrack) window.MABTrack("contact_sent", { topic: payload.service || "none" });
    } catch (_) {
      say("err", "That didn't go through. Your mail app is opening with the message filled in, or write to " + email + ".");
      window.location.href = mailto(payload);
    } finally {
      button.disabled = false;
    }
  });
})();
