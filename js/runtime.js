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

/* Toituréa – petit moteur d'affichage du site (aucune dépendance).
   Le contenu de chaque page est déjà écrit en HTML (lisible par Google et les IA) ;
   ce script ne fait que rendre interactifs le menu, la carte, le questionnaire, etc. */
(function () {
  "use strict";

  class DCLogic {
    constructor() { this.state = {}; this.props = {}; }
    setState(patch) {
      this.state = Object.assign({}, this.state || {}, typeof patch === "function" ? patch(this.state) : patch);
      planifier();
    }
  }
  window.DCLogic = DCLogic;

  var TROU = /\{\{\s*([a-zA-Z_$][\w$.]*)\s*\}\}/g;
  var SEUL = /^\s*\{\{\s*([a-zA-Z_$][\w$.]*)\s*\}\}\s*$/;
  var EVENTS = { onclick: "click", oninput: "input", onchange: "change", onkeydown: "keydown",
                 onpointerdown: "pointerdown", onpointerup: "pointerup", onsubmit: "submit" };
  var BOOL = { disabled: 1, checked: 1, selected: 1, hidden: 1, readonly: 1, required: 1 };
  var comp, modele, racine, attente = false;

  function lire(scope, chemin) {
    var p = chemin.split("."), v;
    for (var i = scope.length - 1; i >= 0; i--) {
      if (scope[i] && p[0] in scope[i]) { v = scope[i][p[0]]; break; }
    }
    for (var j = 1; j < p.length && v != null; j++) v = v[p[j]];
    return v;
  }
  function texte(str, scope) {
    return str.replace(TROU, function (_, c) { var v = lire(scope, c); return v == null ? "" : String(v); });
  }

  // Construit le nouvel arbre DOM à partir du modèle
  function construire(src, scope, parent) {
    for (var n = src.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) { parent.appendChild(document.createTextNode(texte(n.nodeValue, scope))); continue; }
      if (n.nodeType !== 1) continue;
      var tag = n.localName;
      if (tag === "sc-if") {
        var m = SEUL.exec(n.getAttribute("value") || "");
        if (m && lire(scope, m[1])) construire(n, scope, parent);
        continue;
      }
      if (tag === "sc-for") {
        var ml = SEUL.exec(n.getAttribute("list") || ""), nom = n.getAttribute("as") || "item";
        var liste = ml ? lire(scope, ml[1]) : null;
        (liste || []).forEach(function (it, i) {
          var o = {}; o[nom] = it;
          var avant = parent.childNodes.length;
          construire(n, scope.concat([o]), parent);
          if (it && it.id != null) {
            for (var k = avant; k < parent.childNodes.length; k++) {
              var c = parent.childNodes[k];
              if (c.nodeType === 1) c.__cle = String(it.id) + ":" + i;
            }
          }
        });
        continue;
      }
      var el = n.namespaceURI === "http://www.w3.org/2000/svg"
        ? document.createElementNS(n.namespaceURI, n.tagName) : document.createElement(tag);
      el.__h = {};
      for (var a = 0; a < n.attributes.length; a++) {
        var at = n.attributes[a], nm = at.name, val = at.value, low = nm.toLowerCase();
        if (low.indexOf("hint-") === 0) continue;
        var seul = SEUL.exec(val);
        if (EVENTS[low]) { var f = seul ? lire(scope, seul[1]) : null; if (typeof f === "function") el.__h[EVENTS[low]] = f; continue; }
        if (seul) {
          var v = lire(scope, seul[1]);
          if (BOOL[low]) { if (v === true || v === "true") el.setAttribute(nm, ""); continue; }
          if (v === false || v == null) { if (low.indexOf("aria-") === 0) el.setAttribute(nm, "false"); continue; }
          el.setAttribute(nm, String(v));
        } else {
          el.setAttribute(nm, texte(val, scope));
        }
      }
      if (tag === "textarea") { el.__valeur = texte(n.textContent, scope); el.textContent = el.__valeur; }
      else construire(n.content || n, scope, el);
      if (tag === "input" && el.hasAttribute("value")) el.__valeur = el.getAttribute("value");
      parent.appendChild(el);
    }
  }

  function brancher(el, h) {
    el.__h = h;
    if (!el.__branche) {
      el.__branche = {};
    }
    Object.keys(h).forEach(function (type) {
      if (el.__branche[type]) return;
      el.__branche[type] = true;
      el.addEventListener(type, function (e) { var f = el.__h && el.__h[type]; if (f) f.call(comp, e); });
    });
  }

  // Met à jour la page en ne touchant que ce qui a changé (garde le focus dans les champs)
  function fusionner(vieux, neuf) {
    var vk = vieux.childNodes, nk = neuf.childNodes, i;
    var liste = Array.prototype.slice.call(nk);
    for (i = 0; i < liste.length; i++) {
      var n = liste[i], o = vieux.childNodes[i];
      if (!o) { vieux.appendChild(adopter(n)); continue; }
      if (o.nodeType !== n.nodeType || (n.nodeType === 1 && (o.nodeName !== n.nodeName || (o.__cle || null) !== (n.__cle || null) && (n.__cle || o.__cle)))) {
        vieux.replaceChild(adopter(n), o); continue;
      }
      if (n.nodeType === 3) { if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue; continue; }
      if (n.nodeType !== 1) continue;
      attributs(o, n);
      brancher(o, n.__h || {});
      if (o.localName === "textarea" || o.localName === "input") {
        var v = n.__valeur != null ? n.__valeur : null;
        if (v != null && document.activeElement !== o && o.value !== v) o.value = v;
        if (o.localName === "textarea") continue;
      }
      if (o.localName === "select") { fusionner(o, n); continue; }
      fusionner(o, n);
    }
    while (vieux.childNodes.length > liste.length) vieux.removeChild(vieux.lastChild);
  }
  function attributs(o, n) {
    var a;
    for (a = o.attributes.length - 1; a >= 0; a--) {
      var nm = o.attributes[a].name;
      if (!n.hasAttribute(nm)) o.removeAttribute(nm);
    }
    for (a = 0; a < n.attributes.length; a++) {
      var at = n.attributes[a];
      if (o.getAttribute(at.name) !== at.value) o.setAttribute(at.name, at.value);
    }
    if ("disabled" in o) o.disabled = n.hasAttribute("disabled");
  }
  function adopter(n) {
    // les gestionnaires d'événements doivent suivre le nœud
    (function marquer(x) {
      if (x.nodeType === 1) {
        brancher(x, x.__h || {});
        if (x.__valeur != null && "value" in x) x.value = x.__valeur;
        for (var c = x.firstChild; c; c = c.nextSibling) marquer(c);
      }
    })(n);
    return n;
  }

  function rendre() {
    attente = false;
    var vals = comp.renderVals ? comp.renderVals() : {};
    var frag = document.createElement("div");
    construire(modele.content, [vals], frag);
    fusionner(racine, frag);
  }
  function planifier() {
    if (!comp || attente) return;
    attente = true;
    (window.queueMicrotask || setTimeout)(rendre);
  }

  window.toitureaDemarrer = function (Classe) {
    modele = document.getElementById("modele");
    racine = document.getElementById("app");
    comp = new Classe();
    rendre();
    document.documentElement.classList.add("js");
    if (comp.componentDidMount) comp.componentDidMount();
    window.toitureaPlacer();
  };
})();

