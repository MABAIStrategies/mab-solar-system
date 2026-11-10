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

  // Built one character at a time under an encoded-length cap, so an emoji is never cut in
  // half and the link stays short enough for mail apps.
  function mailto(p) {
    const head = `mailto:${email}?subject=${encodeURIComponent("Website inquiry from " + p.name.slice(0, 80))}&body=`;
    const text = `Name: ${p.name}\nEmail: ${p.email}\nCompany: ${p.company || "-"}\nTopic: ${p.service || "-"}\n\n${p.message}`;
    let body = "";
    for (const ch of text) {
      let enc;
      try { enc = encodeURIComponent(ch); } catch (_) { continue; } // lone surrogate
      if (head.length + body.length + enc.length > 1900) break;
      body += enc;
    }
    return head + body;
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
      const href = mailto(payload);
      status.className = "form-status err";
      status.textContent = "That didn't go through. ";
      const link = document.createElement("a");
      link.href = href;
      link.textContent = "Send it from your mail app instead";
      status.append(link, ", or write to " + email + ".");
      window.location.href = href;
    } finally {
      button.disabled = false;
    }
  });
})();
