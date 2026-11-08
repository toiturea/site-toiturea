/* Toituréa – position dans la page.
   - Nouvelle page : on arrive en haut (ou sur l'endroit visé par le lien).
   - Retour en arrière (bouton ou glissé depuis le bord gauche) : on revient exactement où on était,
     avec les questions de FAQ qui étaient ouvertes.
   Fonctionne aussi quand le site est affiché dans un cadre (aperçu). */
(function () {
  var CLE = "toiturea-pos:" + location.pathname + location.search;
  var SEL = "section, h1, h2, h3, h4, p, li, article, details, figure, tr, .schema-box, .niv, .quand, .barre";
  var visibles = new Map(), liste = [];

  function lire() { try { return JSON.parse(sessionStorage.getItem(CLE) || "null"); } catch (e) { return null; } }
  function ecrire(o) { try { sessionStorage.setItem(CLE, JSON.stringify(o)); } catch (e) {} }
  function defilable() { return document.documentElement.scrollHeight > window.innerHeight + 4; }

  var hautVu = 0;   // haut de la zone visible, en coordonnées de la page
  function memoriser() {
    var ouverts = [];
    document.querySelectorAll("details").forEach(function (d, i) { if (d.open) ouverts.push(i); });
    var o = { y: window.scrollY, ancre: -1, ouverts: ouverts };
    if (!defilable() && liste.length) {
      // page affichée en entier dans un cadre : on retient l'élément qui est en haut de l'écran
      var vt = Infinity;
      visibles.forEach(function (r) { if (r < vt) vt = r; });
      if (vt === Infinity) vt = hautVu;
      hautVu = vt;
      var best = -1, bestTop = -Infinity;
      for (var i = 0; i < liste.length; i++) {
        var t = liste[i].getBoundingClientRect().top + window.scrollY;
        if (t <= vt + 4 && t > bestTop) { bestTop = t; best = i; }
      }
      o.ancre = best;
    }
    ecrire(o);
  }

  function suivre() {
    liste = Array.prototype.slice.call(document.querySelectorAll(SEL));
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) visibles.set(e.target, e.intersectionRect.top + window.scrollY);
        else visibles.delete(e.target);
      });
      memoriser();
    }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1] });
    liste.forEach(function (el) { io.observe(el); });
  }

  function retour() {
    var nav = (performance.getEntriesByType && performance.getEntriesByType("navigation")[0]) || {};
    return nav.type === "back_forward" || (performance.navigation && performance.navigation.type === 2);
  }

  function instant(el) { try { el.scrollIntoView({ block: "start", behavior: "instant" }); } catch (e) { el.scrollIntoView(true); } }

  window.toitureaPlacer = function () {
    var etat = retour() ? lire() : null;
    var aller;
    if (etat) {
      var dets = document.querySelectorAll("details");
      (etat.ouverts || []).forEach(function (i) { if (dets[i]) dets[i].open = true; });
      aller = function () {
        if (defilable()) { window.scrollTo({ top: etat.y, left: 0, behavior: "instant" }); return; }
        var el = document.querySelectorAll(SEL)[etat.ancre];
        if (el) instant(el);
      };
    } else {
      var id = decodeURIComponent((location.hash || "").slice(1));
      var cible = id && document.getElementById(id);
      if (cible && cible.tagName === "DETAILS") cible.open = true;
      else if (cible) { var d = cible.querySelector("details"); if (d) d.open = true; }
      aller = function () {
        if (cible) { instant(cible); return; }
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        try { document.documentElement.scrollIntoView({ block: "start", behavior: "instant" }); } catch (e) {}
      };
    }
    aller(); setTimeout(aller, 80); setTimeout(aller, 300);
    setTimeout(suivre, 400);
    var t; window.addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(memoriser, 120); }, { passive: true });
    window.addEventListener("pagehide", memoriser);
    document.addEventListener("toggle", function () { memoriser(); }, true);
    return !!etat;
  };
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
})();

/* Menu ☰ sur téléphone (pages simples) + ouverture de la bonne question de la FAQ */
(function () {
  var b = document.querySelector(".burger"), n = document.getElementById("nav");
  if (b && n) {
    b.addEventListener("click", function () {
      var o = n.classList.toggle("ouvert");
      b.setAttribute("aria-expanded", o ? "true" : "false");
      b.setAttribute("aria-label", o ? "Fermer le menu" : "Ouvrir le menu");
    });
    n.addEventListener("click", function (e) { if (e.target.closest("a")) { n.classList.remove("ouvert"); b.setAttribute("aria-expanded", "false"); } });
  }
  function ouvrir() {
    var id = decodeURIComponent(location.hash.slice(1)); if (!id) return;
    var el = document.getElementById(id); if (!el) return;
    if (el.tagName === "DETAILS") {
      el.open = true;
      document.querySelectorAll("details.cible").forEach(function (d) { d.classList.remove("cible"); });
      el.classList.add("cible");
    } else {
      var d = el.querySelector("details"); if (d) d.open = true;   // un thème : on ouvre sa première question
    }
    setTimeout(function () { el.scrollIntoView({ block: "start" }); }, 30);
  }
  window.addEventListener("hashchange", ouvrir);
  window.toitureaPlacer();
})();

