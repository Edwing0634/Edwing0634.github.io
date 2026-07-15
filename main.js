/* ============================================================
   Edwin González — Portafolio · main.js
   - Chat vivo con "escribiendo…" (el aha)
   - Count-up de datos duros
   - Reveal al scroll
   - Topbar sticky
   Todo respeta prefers-reduced-motion.
   ============================================================ */
(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ============================================================
     0) FRENO DE SEGURIDAD DEL DEMO DE WHATSAPP
     ------------------------------------------------------------
     El número +57 302 230 9119 lo atiende AIRA, que HOY vende
     planes de DAFI. Hasta que el ruteo de AIRA (poll.mjs) sepa
     reconocer la SEÑA del portafolio y entre en "modo portafolio",
     estos botones NO deben abrir la línea de ventas — un reclutador
     recibiría un pitch de $89.900 y se rompería el aha.

     ⚠️ PARA PUBLICAR:
       1) Implementa la detección de la seña en poll.mjs (modo portafolio + fallback DAFI).
       2) Sustituye «SEÑA_PENDIENTE» en WA_TEXT por la seña final.
       3) Pon PORTFOLIO_DEMO_LIVE = true.
     Mientras esté en false, los CTA muestran "demo en preparación" y no abren WhatsApp.
     ============================================================ */
  const PORTFOLIO_DEMO_LIVE = true;               // LIVE 2026-07-15: demo probado end-to-end con Angie (3 msgs + 🔥🔥); ruteo AIRA activo en comms + poll.mjs
  const WA_NUMBER = "573022309119";
  // La seña es una FRASE NATURAL que un humano envía sin sospechar (no un token
  // que parezca spam y quiera borrar). AIRA la detecta por la combinación de
  // anclas «portafolio» + «asistente» (no por el literal exacto), así sobrevive
  // a que el usuario reescriba la frase. Verificado: NO contiene ninguna
  // palabraInteres comercial en WhatsApp/Facebook/Instagram → no cae en venta.
  const WA_TEXT = {
    demo:   "Hola Edwin, vengo de tu portafolio y me gustaría ver tu asistente en acción",
    footer: "Hola Edwin, vengo de tu portafolio y me gustaría conocer tu asistente",
  };
  const waHref = (kind) =>
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_TEXT[kind] || WA_TEXT.demo)}`;

  (function wireWhatsApp() {
    const nodes = $$("[data-wa]");
    if (!nodes.length) return;
    if (PORTFOLIO_DEMO_LIVE) {
      // LIVE: cablear a WhatsApp con la seña.
      nodes.forEach(a => {
        const kind = a.getAttribute("data-wa");
        a.setAttribute("href", waHref(kind));
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener");
        a.removeAttribute("aria-disabled");
        a.removeAttribute("role");
        a.removeAttribute("tabindex");
      });
    } else {
      // BLOQUEADO: nunca abre la línea de ventas. Muestra estado y no navega.
      nodes.forEach(a => {
        a.classList.add("is-wa-pending");
        a.setAttribute("aria-disabled", "true");
        a.setAttribute("title", "El demo se está terminando de preparar.");
        const label = a.querySelector("[data-wa-label]");
        if (label) { label.dataset.orig = label.textContent; label.textContent = "Demo en preparación"; }
        const block = (e) => {
          e.preventDefault(); e.stopPropagation();
          a.classList.remove("wa-nudge"); void a.offsetWidth; a.classList.add("wa-nudge");
        };
        a.addEventListener("click", block);
        a.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") block(e); });
      });
    }
  })();

  /* ---------------------------------------------------------
     1) TOPBAR sticky — borde aparece al hacer scroll
     --------------------------------------------------------- */
  const topbar = $(".topbar");
  if (topbar) {
    const onScroll = () => topbar.classList.toggle("is-stuck", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------------
     2) REVEAL al scroll
     --------------------------------------------------------- */
  const revealEls = $$("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(el => el.classList.add("in"));
  } else {
    // Lo que ya está en viewport al cargar (hero) revela de inmediato,
    // escalonado — no espera a un scroll que quizá no ocurra.
    const vh = window.innerHeight;
    let staggered = 0;
    revealEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) {
        setTimeout(() => el.classList.add("in"), staggered * 110);
        staggered++;
        el.dataset.revealed = "1";
      }
    });
    // El resto entra al hacer scroll.
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(el => { if (!el.dataset.revealed) io.observe(el); });

    // Red de seguridad: nada debe quedar invisible por un observer que no dispara.
    // Si a los 4s algo sigue oculto, se muestra igual.
    setTimeout(() => revealEls.forEach(el => el.classList.add("in")), 4000);
  }

  /* ---------------------------------------------------------
     3) COUNT-UP de los datos duros (al entrar al viewport)
     --------------------------------------------------------- */
  const counters = $$("[data-count]");
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const prefix = /\$/.test(el.textContent) ? "$" : "";
    const final = prefix + target + suffix;
    if (reduce) { el.textContent = final; return; }
    const dur = 900; const t0 = performance.now();
    let done = false;
    const settle = () => { if (!done) { done = true; el.textContent = final; } };
    const tick = (now) => {
      if (done) return;
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick); else settle();
    };
    requestAnimationFrame(tick);
    // Respaldo: el dato NUNCA puede quedar a medias si rAF se congela.
    // Un "2s" que muestra "0s" mentiría sobre el número. A los 1.2s, valor final garantizado.
    setTimeout(settle, 1200);
  };
  if (counters.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      counters.forEach(runCount);
    } else {
      const cio = new IntersectionObserver((entries, obs) => {
        entries.forEach(e => { if (e.isIntersecting) { runCount(e.target); obs.unobserve(e.target); } });
      }, { threshold: 0.6 });
      counters.forEach(el => cio.observe(el));
    }
  }

  /* ---------------------------------------------------------
     4) CHAT VIVO — el corazón. Se escribe solo cuando entra en vista.
        El indicador "escribiendo…" antes de cada respuesta del asistente
        es lo que dispara el aha.
     --------------------------------------------------------- */
  const chat = $("#chat");

  // Guion: una conversación corta que muestra al asistente
  // (a) entendiendo qué hace, (b) demostrando el candado anti-alucinación,
  // (c) invitando a probarlo de verdad. Sin cifras de terceros, sin empleador.
  const script = [
    { from: "in",  text: "¡Hola! ¿Qué es lo que haces exactamente?" },
    { from: "out", text: "Contesto tus mensajes de WhatsApp, Instagram y Facebook solo, 24/7. Entiendo lo que te preguntan, lo busco en tu propia información y respondo como lo harías tú." },
    { from: "in",  text: "¿Y si te preguntan algo que no sabes? No quiero que inventes." },
    { from: "out", text: "Tengo un candado de dos capas para eso: si la respuesta no está respaldada por tus datos, no me la invento. Te aviso y paso la conversación a una persona." },
    { from: "in",  text: "¿También entiendes las notas de voz?" },
    { from: "out", text: "Sí. Las transcribo en el mismo equipo, en un par de segundos, sin mandar el audio a nadie más. Rápido y privado." },
    { from: "out", text: "Pero no me creas a mí. Escríbeme tú un mensaje de verdad 👇 y compruébalo.", last: true },
  ];

  const escapeHTML = (s) => s.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));

  const addMsg = (m) => {
    const wrap = document.createElement("div");
    wrap.className = `msg msg--${m.from}` + (reduce ? "" : " enter");
    wrap.innerHTML = `<p>${escapeHTML(m.text)}</p>`;
    chat.appendChild(wrap);
    scrollChat();
  };

  const scrollChat = () => { chat.scrollTop = chat.scrollHeight; };

  const showTyping = () => {
    const t = document.createElement("div");
    t.className = "typing";
    t.setAttribute("aria-hidden", "true");
    t.innerHTML = `<p><span></span><span></span><span></span></p>`;
    chat.appendChild(t);
    scrollChat();
    return t;
  };

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // duración de "escribiendo" proporcional al largo del mensaje, con techo
  const typeTime = (text) => Math.min(1400, 350 + text.length * 14);

  let played = 0;
  async function play() {
    for (const m of script) {
      if (played >= script.length) return;     // ya completado por el respaldo
      if (m.from === "out") {
        const t = showTyping();
        await wait(typeTime(m.text));
        t.remove();
      } else {
        await wait(500);
      }
      if (played >= script.length) return;
      addMsg(m); played++;
      await wait(m.last ? 0 : 350);
    }
  }

  // Sin JS-motion o sin IO: pinta todo de golpe (fallback accesible)
  const paintAll = () => { $$(".typing", chat).forEach(t => t.remove()); for (; played < script.length; played++) addMsg(script[played]); };

  if (chat) {
    if (reduce || !("IntersectionObserver" in window)) {
      paintAll();
    } else {
      let started = false;
      const chatIO = new IntersectionObserver((entries, obs) => {
        entries.forEach(e => {
          if (e.isIntersecting && !started) {
            started = true;
            play();
            obs.disconnect();
            // Respaldo: el aha no puede quedar a medias. Si el guion no
            // terminó en 15s (rAF/timers congelados), se completa de golpe.
            setTimeout(() => { if (played < script.length) paintAll(); }, 15000);
          }
        });
      }, { threshold: 0.35 });
      chatIO.observe(chat);
    }
  }
})();
