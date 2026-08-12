(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) {
    root.PortfolioV2 = api;
    if (root.document) api.init(root.document, root);
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  const WA_NUMBER = "573022309119";
  const WA_MESSAGES = Object.freeze({
    work: "Hola AIRA, vengo del portafolio de Edwin y quiero conocer cómo trabaja, sus proyectos y las soluciones que desarrolla.",
    business: "Hola AIRA, vengo del portafolio de Edwin y quiero conversar sobre un proceso que necesito mejorar o automatizar."
  });
  const initializedDocuments = new WeakSet();

  function buildWhatsAppHref(route) {
    const message = WA_MESSAGES[route] || WA_MESSAGES.work;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  function init(doc, win) {
    if (initializedDocuments.has(doc)) return;
    initializedDocuments.add(doc);

    doc.documentElement.classList.remove("no-js");
    doc.documentElement.classList.add("js");
    doc.querySelectorAll("[data-wa-route]").forEach((link) => {
      link.href = buildWhatsAppHref(link.dataset.waRoute);
      link.target = "_blank";
      link.rel = "noopener";
    });

    const reveals = [...doc.querySelectorAll("[data-reveal]")];
    const revealAll = () => reveals.forEach((node) => node.classList.add("is-visible"));
    const reduced = win.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const finishOpening = () => doc.documentElement.classList.add("is-opening-done");

    if (reduced || !("IntersectionObserver" in win)) {
      finishOpening();
      revealAll();
      return;
    }

    win.setTimeout(finishOpening, 1400);
    const observer = new win.IntersectionObserver((entries, activeObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        activeObserver.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((node) => observer.observe(node));
  }

  return { WA_NUMBER, WA_MESSAGES, buildWhatsAppHref, init };
});
