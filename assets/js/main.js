/* Yapok Média — script commun du hub
   Contenus : dossier /data (fichiers JSON) ou /admin.
   Traductions de l'interface : assets/js/i18n.js.
   Traductions des contenus : champ "traductions" de chaque élément, ex.
   "traductions": { "pt": { "titre": "...", "description": "..." } } — à défaut, le français s'affiche. */
(function () {
  "use strict";

  /* ---------- langues ---------- */
  var I18N = window.YAPOK_I18N || { langs: [{ code: "fr", label: "Français", locale: "fr-FR" }], strings: {} };
  var CODES = I18N.langs.map(function (l) { return l.code; });
  var KEY = "yapok-lang";

  function storedLang() {
    var v = null;
    try { v = new URLSearchParams(location.search).get("lang"); } catch (e) {}
    if (!v) { try { v = localStorage.getItem(KEY); } catch (e) {} }
    if (!v && /^yapok-lang:/.test(window.name || "")) v = window.name.split(":")[1];
    return CODES.indexOf(v) > -1 ? v : null;
  }
  function browserLang() {
    var list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "fr"]);
    for (var i = 0; i < list.length; i++) {
      var c = String(list[i]).toLowerCase().slice(0, 2);
      if (CODES.indexOf(c) > -1) return c;
    }
    return "fr";
  }
  var lang = storedLang() || browserLang();
  var locale = (I18N.langs.filter(function (l) { return l.code === lang; })[0] || { locale: "fr-FR" }).locale;
  document.documentElement.lang = locale.slice(0, 2) === "pt" ? "pt-BR" : lang;

  function setLang(code) {
    try { localStorage.setItem(KEY, code); } catch (e) {}
    window.name = "yapok-lang:" + code;
    var url = new URL(location.href);
    if (url.searchParams.has("lang")) { url.searchParams.set("lang", code); location.href = url.toString(); }
    else location.reload();
  }

  function t(key, vars) {
    var e = I18N.strings[key];
    var s = e ? (e[lang] || e.fr) : key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split("{" + k + "}").join(vars[k]); });
    return s;
  }
  /* champ traduit d'un contenu, sinon français */
  function L(item, field) {
    if (!item) return "";
    if (lang !== "fr" && item.traductions && item.traductions[lang] && item.traductions[lang][field]) return item.traductions[lang][field];
    return item[field] == null ? "" : item[field];
  }

  function applyStatic(root) {
    root = root || document;
    $$("[data-i18n]", root).forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    $$("[data-i18n-html]", root).forEach(function (el) { el.innerHTML = t(el.getAttribute("data-i18n-html")); });
    $$("[data-i18n-ph]", root).forEach(function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
    $$("[data-i18n-aria]", root).forEach(function (el) { el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria"))); });
    $$("[data-hide-fr]", root).forEach(function (el) { el.hidden = lang === "fr"; });
    $$("[data-lang-field]", root).forEach(function (el) { el.value = lang; });
    var tk = document.body.getAttribute("data-title-key");
    document.title = tk ? t(tk) + " · Yapok Média" : "Yapok Média";
  }

  var NAV = [
    { href: "radio.html", k: "nav.radio", page: "radio" },
    { href: "podcasts.html", k: "nav.podcasts", page: "podcasts" },
    { href: "mag.html", k: "nav.mag", page: "mag" },
    { href: "videos.html", k: "nav.videos", page: "videos" },
    { href: "photos.html", k: "nav.photos", page: "photos" },
    { href: "agenda.html", k: "nav.agenda", page: "agenda" },
    { href: "acteurs.html", k: "nav.acteurs", page: "acteurs" },
    { href: "a-propos.html", k: "nav.hub", page: "a-propos" },
    { href: "rejoindre.html", k: "nav.join", page: "rejoindre", cta: true }
  ];
  var page = document.body.getAttribute("data-page") || "";
  var cache = {};

  /* ---------- outils ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function load(name) {
    if (!cache[name]) {
      cache[name] = fetch("data/" + name + ".json", { cache: "no-cache" })
        .then(function (r) { if (!r.ok) throw new Error(name); return r.json(); })
        .catch(function () { return null; });
    }
    return cache[name];
  }
  function demo(item) { return item && item.exemple ? '<span class="tag demo" title="' + esc(t("demo.title")) + '">' + esc(t("demo")) + "</span>" : ""; }
  function parseDate(iso) {
    if (!iso) return null;
    var p = String(iso).split("-");
    return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1);
  }
  function today() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function fmt(d, opts) { try { return new Intl.DateTimeFormat(locale, opts).format(d); } catch (e) { return d.toLocaleDateString(); } }
  function fmtLong(iso) {
    var d = parseDate(iso);
    if (!d) return "";
    if (String(iso).split("-").length === 2) return fmt(d, { month: "long", year: "numeric" });
    return fmt(d, { day: "numeric", month: "long", year: "numeric" });
  }
  function initials(name) {
    return String(name || "?").replace(/[^A-Za-zÀ-ÿ\s'-]/g, "").split(/[\s'-]+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join("");
  }
  function set(el, html) { if (el) el.innerHTML = html; }
  function lvl(n) { return n ? t("lvl." + n) : ""; }

  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';

  /* ---------- en-tête et pied de page ---------- */
  function header() {
    var host = $("#site-header");
    if (!host) return;
    var items = NAV.map(function (n) {
      var cur = n.page === page ? ' aria-current="page"' : "";
      return '<li><a href="' + n.href + '"' + cur + (n.cta ? ' class="cta"' : "") + ">" + esc(t(n.k)) + "</a></li>";
    }).join("");
    var options = I18N.langs.map(function (l) {
      return '<option value="' + l.code + '"' + (l.code === lang ? " selected" : "") + ' lang="' + l.code + '">' + l.code.toUpperCase() + " · " + esc(l.label) + "</option>";
    }).join("");
    host.outerHTML =
      '<a class="skip" href="#main">' + esc(t("skip")) + "</a>" +
      '<header class="site-header"><div class="wrap">' +
      '<a class="brand" href="index.html" aria-label="' + esc(t("brand.home")) + '">' +
      '<img src="assets/img/logo-moyapok-512.jpg" alt="" width="46" height="46">' +
      "<span><b>Yapok Média</b><small>" + esc(t("brand.sub")) + "</small></span></a>" +
      '<span class="onair" id="onair-pill"><i></i><span>' + esc(t("onair.soon")) + "</span></span>" +
      '<label class="lang" for="lang-select"><span class="sr-only">' + esc(t("lang.label")) + '</span>' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></svg>' +
      '<select id="lang-select">' + options + "</select><b aria-hidden=\"true\">" + lang.toUpperCase() + "</b></label>" +
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav">' + esc(t("menu.open")) + "</button>" +
      '<nav class="nav" id="nav" aria-label="' + esc(t("nav.label")) + '"><ul>' + items + "</ul></nav>" +
      "</div></header>";
    var btn = $(".nav-toggle"), nav = $("#nav");
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? t("menu.close") : t("menu.open");
    });
    $("#lang-select").addEventListener("change", function (e) { setLang(e.target.value); });
  }

  function slogan(site) {
    if (lang === "fr") return (site && site.slogan) || t("site.slogan");
    return (site && site.traductions && site.traductions[lang] && site.traductions[lang].slogan) || t("site.slogan");
  }

  function footer(site) {
    var host = $("#site-footer");
    if (!host) return;
    var a = (site && site.association) || {};
    var r = (site && site.reseaux) || {};
    var socials = [["youtube", "YouTube"], ["tiktok", "TikTok"], ["facebook", "Facebook"], ["instagram", "Instagram"]]
      .filter(function (s) { return r[s[0]]; })
      .map(function (s) { return '<li><a href="' + esc(r[s[0]]) + '" rel="noopener" target="_blank">' + s[1] + "</a></li>"; }).join("");
    host.outerHTML =
      '<footer class="site-footer"><div class="wrap">' +
      '<div class="cols">' +
      '<div><div class="brandline"><img src="assets/img/logo-moyapok-512.jpg" alt="Logo M\'OYAPOK" width="56" height="56"><b>Yapok Média</b></div>' +
      '<p class="sign">' + esc(t("footer.sign")) + "</p>" +
      "<p>" + esc(slogan(site)) + ". " + esc(t("footer.editedBy")) + " " + esc(a.nom || "M'OYAPOK") + ".</p></div>" +
      "<div><h2>" + esc(t("footer.listen")) + '</h2><ul><li><a href="radio.html">' + esc(t("nav.radio")) + '</a></li><li><a href="podcasts.html">' + esc(t("nav.podcasts")) + '</a></li><li><a href="mag.html">Yapok Mag</a></li><li><a href="videos.html">' + esc(t("nav.videos")) + '</a></li><li><a href="photos.html">' + esc(t("nav.photos")) + '</a></li><li><a href="agenda.html">' + esc(t("nav.agenda")) + "</a></li></ul></div>" +
      "<div><h2>" + esc(t("footer.hub")) + '</h2><ul><li><a href="acteurs.html">' + esc(t("footer.members")) + '</a></li><li><a href="rejoindre.html">' + esc(t("footer.join")) + '</a></li><li><a href="charte.html">' + esc(t("footer.charter")) + '</a></li><li><a href="a-propos.html">' + esc(t("footer.about")) + "</a></li>" + socials + "</ul></div>" +
      "<div><h2>" + esc(t("footer.contact")) + "</h2><ul><li>" + esc(a.email || "") + "</li><li>" + esc((site && site.media && site.media.email) || "") + "</li><li>" + esc(a.telephone || "") + "</li><li>" + esc(a.adresse || "") + "</li></ul></div>" +
      "</div>" +
      '<div class="legal"><span>© ' + new Date().getFullYear() + " " + esc(a.nom || "M'OYAPOK") + " · " + esc(a.forme || "") + " · SIREN " + esc(a.siren || "") + "</span>" +
      '<span><a href="mentions-legales.html">' + esc(t("footer.legal")) + "</a></span>" +
      '<p class="coords">' + esc(t("coords")) + "</p></div>" +
      "</div></footer>";
  }

  /* ---------- webradio ---------- */
  var radio = { audio: null, url: "", playing: false };
  function radioMessage(r) {
    if (lang === "fr") return r.message || t("tuner.message");
    return (r.traductions && r.traductions[lang] && r.traductions[lang].message) || t("tuner.message");
  }
  function tunerHTML(site) {
    var r = (site && site.radio) || {};
    var live = !!r.streamUrl;
    return '<div class="tuner" id="tuner">' +
      '<div class="top"><span class="label">' + esc(r.nom || "Radio Yapok Média") + '</span><span class="onair' + (live ? " live" : "") + '" style="color:var(--inv-muted)"><i></i>' + esc(live ? t("onair.live") : t("tuner.soon")) + "</span></div>" +
      '<p class="now" id="now-playing">' + esc(live ? t("tuner.stream") : radioMessage(r)) + "</p>" +
      '<div class="controls"><button class="play" type="button" id="play-btn" aria-label="' + esc(t("tuner.listen")) + '"' + (live ? "" : " disabled") + ">" + ICON_PLAY + "</button>" +
      '<div class="bars" aria-hidden="true">' + new Array(16).join("<span></span>") + "<span></span></div>" +
      (live ? '<label class="volume" for="volume">' + esc(t("tuner.volume")) + ' <input id="volume" type="range" min="0" max="1" step="0.05" value="0.9"></label>' : "") +
      "</div>" +
      '<p class="sub" id="tuner-sub">' + (live ? esc(t("tuner.pressPlay")) : '<a href="podcasts.html">' + esc(t("tuner.podcasts")) + "</a>") + "</p>" +
      "</div>";
  }
  function bindTuner(site) {
    var r = (site && site.radio) || {};
    var btn = $("#play-btn"), box = $("#tuner");
    if (!btn || !r.streamUrl) return;
    radio.url = r.streamUrl;
    function stop() {
      if (radio.audio) { radio.audio.pause(); radio.audio.removeAttribute("src"); radio.audio.load(); }
      radio.playing = false; box.classList.remove("playing");
      btn.innerHTML = ICON_PLAY; btn.setAttribute("aria-label", t("tuner.listen"));
    }
    btn.addEventListener("click", function () {
      if (!radio.audio) {
        radio.audio = new Audio();
        radio.audio.preload = "none";
        radio.audio.addEventListener("error", function () {
          if (!radio.playing) return;
          set($("#tuner-sub"), esc(t("tuner.error"))); stop();
        });
      }
      if (radio.playing) { stop(); return; }
      radio.audio.src = radio.url + (radio.url.indexOf("?") > -1 ? "&" : "?") + "t=" + Date.now();
      var v = $("#volume"); if (v) radio.audio.volume = +v.value;
      radio.audio.play().then(function () {
        radio.playing = true; box.classList.add("playing");
        btn.innerHTML = ICON_PAUSE; btn.setAttribute("aria-label", t("tuner.pause"));
        set($("#tuner-sub"), esc(t("tuner.listening", { nom: r.nom || "Radio Yapok Média" })));
      }).catch(function () { set($("#tuner-sub"), esc(t("tuner.playFail"))); });
    });
    var vol = $("#volume");
    if (vol) vol.addEventListener("input", function () { if (radio.audio) radio.audio.volume = +vol.value; });
    if (r.nowPlayingUrl) {
      var poll = function () {
        fetch(r.nowPlayingUrl).then(function (x) { return x.json(); }).then(function (d) {
          var np = d && d.now_playing && d.now_playing.song;
          var live = d && d.live && d.live.is_live ? d.live.streamer_name : "";
          var txt = live ? t("tuner.liveNow") + live : (np ? (np.artist ? np.artist + " · " : "") + (np.title || "") : "");
          if (txt) set($("#now-playing"), esc(txt));
        }).catch(function () {});
      };
      poll(); setInterval(poll, 30000);
    }
  }
  function onairPill(site) {
    var pill = $("#onair-pill");
    if (pill && site && site.radio && site.radio.streamUrl) {
      pill.classList.add("live");
      pill.lastChild.textContent = t("onair.live");
    }
  }

  /* ---------- gabarits ---------- */
  function episodeHTML(ep, i) {
    var player = ep.audio
      ? '<audio controls preload="none" src="' + esc(ep.audio) + '"></audio><a class="btn btn-ghost btn-small" href="' + esc(ep.audio) + '" download>' + esc(t("ep.download")) + "</a>"
      : '<p class="soon">' + esc(t("ep.soon")) + "</p>";
    var meta = [L(ep, "invite"), ep.commune, ep.date ? fmtLong(ep.date) : "", ep.duree].filter(Boolean).map(esc).join(" · ");
    return '<li class="episode"><span class="n">' + String(i + 1).padStart(2, "0") + "</span>" +
      '<div class="stack" style="gap:.35rem"><div class="badges">' + demo(ep) + "</div><h3>" + esc(L(ep, "titre")) + "</h3>" +
      (meta ? '<p class="meta muted" style="font-size:.88rem">' + meta + "</p>" : "") +
      (L(ep, "description") ? "<p>" + esc(L(ep, "description")) + "</p>" : "") + player + "</div></li>";
  }
  function videoCard(v) {
    var thumb = v.youtubeId ? "https://i.ytimg.com/vi/" + encodeURIComponent(v.youtubeId) + "/hqdefault.jpg" : (v.visuel || "assets/img/visuel-6.svg");
    var frame = '<div class="video-frame" data-yt="' + esc(v.youtubeId || "") + '"><img src="' + esc(thumb) + '" alt="" loading="lazy">' +
      (v.youtubeId ? '<button class="playbtn" type="button" aria-label="' + esc(t("video.play") + L(v, "titre")) + '"><span>' + ICON_PLAY + "</span></button>" : '<span class="soon">' + esc(t("video.soon")) + "</span>") + "</div>";
    var link = v.youtubeId ? '<a href="https://www.youtube.com/watch?v=' + encodeURIComponent(v.youtubeId) + '" target="_blank" rel="noopener">' + esc(t("video.youtube")) + "</a>" : (v.lien ? '<a href="' + esc(v.lien) + '" target="_blank" rel="noopener">' + esc(t("video.see")) + "</a>" : "");
    return '<article class="card">' + frame +
      '<div class="body"><div class="badges"><span class="tag">' + esc(L(v, "theme") || t("video.default")) + "</span>" + demo(v) + "</div><h3>" + esc(L(v, "titre")) + "</h3>" +
      (L(v, "description") ? '<p class="muted">' + esc(L(v, "description")) + "</p>" : "") + (link ? "<p>" + link + "</p>" : "") + "</div></article>";
  }
  function bindVideos(root) {
    $$(".video-frame .playbtn", root).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.closest(".video-frame"), id = f.getAttribute("data-yt");
        f.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + "?autoplay=1&rel=0&hl=" + lang + '" title="' + esc(t("video.player")) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      });
    });
  }
  function eventHTML(e, past) {
    var d = parseDate(e.date);
    var date = d ? "<b>" + d.getDate() + "</b><span>" + esc(fmt(d, { month: "short" }).replace(".", "") + " " + d.getFullYear()) + "</span>" : "<b>?</b><span>" + esc(t("event.tba")) + "</span>";
    var meta = [e.heure, L(e, "lieu"), e.commune].filter(Boolean).map(esc).join(" · ");
    return '<li class="event' + (past ? " past" : "") + '"><div class="date">' + date + '</div><div class="body">' +
      '<div class="badges">' + (e.organisateur ? '<span class="tag">' + esc(e.organisateur) + "</span>" : "") + demo(e) + "</div>" +
      "<h3>" + esc(L(e, "titre")) + '</h3><p class="meta muted">' + meta + "</p>" +
      (L(e, "description") ? "<p>" + esc(L(e, "description")) + "</p>" : "") +
      (e.lien ? '<p><a href="' + esc(e.lien) + '" target="_blank" rel="noopener">' + esc(t("event.more")) + "</a></p>" : "") + "</div></li>";
  }
  function actorCard(a) {
    return '<article class="card linked">' +
      '<div class="avatar">' + (a.visuel ? '<img src="' + esc(a.visuel) + '" alt="" loading="lazy">' : "") + "<b>" + esc(initials(a.nom)) + "</b></div>" +
      '<div class="body"><div class="badges"><span class="tag">' + esc(lvl(a.niveau)) + "</span>" + demo(a) + "</div>" +
      '<h3><a class="stretch" href="acteur.html#' + esc(a.id) + '">' + esc(L(a, "nom")) + "</a></h3>" +
      '<p class="meta">' + [L(a, "type"), L(a, "commune")].filter(Boolean).map(esc).join(" · ") + "</p>" +
      (L(a, "accroche") ? '<p class="muted">' + esc(L(a, "accroche")) + "</p>" : "") + "</div></article>";
  }
  function splitEvents(list) {
    var td = today();
    var all = (list || []).slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    return {
      upcoming: all.filter(function (e) { var d = parseDate(e.date); return !d || d >= td; }),
      past: all.filter(function (e) { var d = parseDate(e.date); return d && d < td; }).reverse()
    };
  }
  /* options : [{v: valeur d'origine, l: libellé affiché}] ; initial : valeur présélectionnée ; label : intitulé de la rangée */
  function chips(host, options, onPick, initial, label) {
    if (!host) return;
    if (options.length < 2 && !initial) { host.hidden = true; return; }
    var opts = [{ v: "", l: t("chips.all") }].concat(options);
    var sel = initial && options.some(function (o) { return o.v === initial; }) ? initial : "";
    host.innerHTML = (label ? '<span class="filters-label">' + esc(label) + "</span>" : "") +
      opts.map(function (o) { return '<button class="chip" type="button" aria-pressed="' + (o.v === sel) + '" data-v="' + esc(o.v) + '">' + esc(o.l) + "</button>"; }).join("");
    host.addEventListener("click", function (ev) {
      var b = ev.target.closest(".chip"); if (!b) return;
      $$(".chip", host).forEach(function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
      onPick(b.getAttribute("data-v"));
    });
  }
  /* commune passée dans l'adresse (?commune=Régina), utilisée par les cartes du territoire */
  function communeParam() {
    try { return new URLSearchParams(location.search).get("commune") || ""; } catch (e) { return ""; }
  }
  var COMMUNE_ORDER = ["Régina", "Saint-Georges de l'Oyapock", "Ouanary", "Camopi"];
  function communeChips(list) {
    return uniqBy(list, "commune").sort(function (a, b) {
      var ia = COMMUNE_ORDER.indexOf(a.v), ib = COMMUNE_ORDER.indexOf(b.v);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  }
  function uniqBy(list, field, labelFn) {
    var seen = {}, out = [];
    list.forEach(function (it) {
      var v = it[field];
      if (v && !seen[v]) { seen[v] = 1; out.push({ v: v, l: labelFn ? labelFn(it) : v }); }
    });
    return out;
  }

  /* ---------- formulaires ---------- */
  function bindForms(site) {
    $$("form[data-form]").forEach(function (form) {
      var key = form.getAttribute("data-form");
      var endpoint = site && site.formulaires ? site.formulaires[key] : "";
      var status = $(".form-status", form);
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        if (!form.reportValidity()) return;
        var btn = $('button[type="submit"]', form);
        function show(cls, html) { if (!status) return; status.hidden = false; status.className = "form-status " + cls; status.innerHTML = html; }
        if (!endpoint) {
          var mail = (site && site.media && site.media.email) || "yapokmedia@gmail.com";
          show("info", esc(t("form.notConfigured", { mail: "\u0000" })).replace("\u0000", "<strong>" + esc(mail) + "</strong>"));
          return;
        }
        btn.disabled = true;
        fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
          .then(function (r) {
            if (!r.ok) throw new Error();
            form.reset();
            $$("[data-lang-field]", form).forEach(function (el) { el.value = lang; });
            show("ok", esc(t(form.getAttribute("data-success-key") || "f.successContact")));
          })
          .catch(function () { show("err", esc(t("form.error"))); })
          .then(function () { btn.disabled = false; });
      });
    });
  }

  /* ---------- pages ---------- */
  function issueCover(n) {
    return '<div class="cover"><img src="' + esc(n.couverture || "assets/img/visuel-3.svg") + '" alt="">' +
      '<div class="mast"><div><small>Yapok Média · ' + esc(t("mag.no")) + " " + esc(n.numero) + "</small><b>Yapok<br>Mag</b></div><span>" + esc(L(n, "titre")) + "</span><small>" + esc(fmtLong(n.date)) + "</small></div></div>";
  }

  var pages = {
    accueil: function (site) {
      set($("#home-tuner"), tunerHTML(site)); bindTuner(site);
      socials(site, $("#home-socials"));
      load("territoire").then(function (d) {
        set($("#home-territoire"), ((d && d.communes) || []).map(function (c) {
          var q = "?commune=" + encodeURIComponent(c.commune);
          return '<article class="commune">' +
            '<div class="commune-media"><img src="' + esc(c.visuel || "assets/img/visuel-6.svg") + '" alt="" loading="lazy"><span class="river">' + esc(t("terr.river")) + " · " + esc(c.fleuve) + "</span></div>" +
            '<div class="commune-body"><h3>' + esc(c.nom) + "</h3>" +
            '<p class="villages"><span>' + esc(t("terr.villages")) + "</span> " + esc(c.villages) + "</p>" +
            "<p>" + esc(L(c, "description")) + "</p>" +
            '<p class="commune-links"><a href="agenda.html' + q + '">' + esc(t("terr.agenda")) + '</a><a href="podcasts.html' + q + '">' + esc(t("terr.podcasts")) + '</a><a href="photos.html' + q + '">' + esc(t("terr.photos")) + "</a></p>" +
            "</div></article>";
        }).join(""));
      });
      load("podcasts").then(function (d) {
        var eps = [];
        ((d && d.series) || []).forEach(function (s) { (s.episodes || []).forEach(function (e) { eps.push({ s: s, e: e }); }); });
        set($("#home-podcasts"), eps.slice(0, 3).map(function (x) {
          return '<article class="card linked"><div class="media"><img src="' + esc(x.s.visuel || "assets/img/visuel-1.svg") + '" alt="" loading="lazy"></div>' +
            '<div class="body"><div class="badges"><span class="tag">' + esc(L(x.s, "titre")) + "</span>" + demo(x.e) + "</div>" +
            '<h3><a class="stretch" href="podcasts.html#' + esc(x.s.id) + '">' + esc(L(x.e, "titre")) + "</a></h3>" +
            '<p class="muted">' + esc(L(x.e, "description")) + "</p></div></article>";
        }).join("") || '<p class="empty">' + esc(t("empty.podcastsHome")) + "</p>");
      });
      load("mag").then(function (d) {
        var n = d && d.numeros && d.numeros[0];
        if (!n) return;
        set($("#home-mag"), '<div class="issue">' + issueCover(n) + '<div class="stack"><p class="eyebrow">Yapok Mag · ' + esc(t("mag.no")) + " " + esc(n.numero) + " · " + esc(fmtLong(n.date)) + "</p>" +
          '<h2 style="font-size:clamp(1.8rem,1.2rem + 2vw,2.8rem);font-weight:900;font-stretch:72%;text-transform:uppercase;line-height:.9;color:inherit">' + esc(L(n, "titre")) + "</h2>" +
          '<p class="lead" style="color:inherit">' + esc(L(n, "resume")) + "</p>" +
          '<div class="hero-actions"><a class="btn btn-primary" href="mag.html">' + esc(t("mag.readMag")) + "</a></div></div></div>");
      });
      load("agenda").then(function (d) {
        var ev = splitEvents(d && d.evenements).upcoming.slice(0, 3);
        set($("#home-agenda"), ev.length ? '<ul class="events">' + ev.map(function (e) { return eventHTML(e); }).join("") + "</ul>" : '<p class="empty">' + esc(t("empty.agenda")) + "</p>");
      });
      load("acteurs").then(function (d) {
        set($("#home-acteurs"), ((d && d.acteurs) || []).slice(0, 4).map(actorCard).join(""));
      });
    },

    radio: function (site) {
      set($("#radio-tuner"), tunerHTML(site)); bindTuner(site);
      load("radio").then(function (d) {
        var rows = ((d && d.grille) || []).map(function (c) {
          return "<tr><td>" + esc(L(c, "jour")) + '</td><td class="h">' + esc(L(c, "heure")) + "</td><td><b>" + esc(L(c, "titre")) + "</b>" + esc(L(c, "description")) + ' <span class="badges" style="display:inline-flex;vertical-align:middle">' + demo(c) + "</span></td><td>" + esc(L(c, "animation")) + "</td></tr>";
        }).join("");
        set($("#radio-grille"), rows ? '<div class="table-scroll"><table class="schedule"><thead><tr><th scope="col">' + esc(t("radio.colDay")) + '</th><th scope="col">' + esc(t("radio.colTime")) + '</th><th scope="col">' + esc(t("radio.colShow")) + '</th><th scope="col">' + esc(t("radio.colHost")) + "</th></tr></thead><tbody>" + rows + "</tbody></table></div>" : '<p class="empty">' + esc(t("empty.grille")) + "</p>");
      });
    },

    podcasts: function () {
      load("podcasts").then(function (d) {
        var series = (d && d.series) || [];
        var allEps = [];
        series.forEach(function (s) { (s.episodes || []).forEach(function (e) { allEps.push(e); }); });
        function draw(commune) {
          var html = series.map(function (s) {
            var eps = (s.episodes || []).filter(function (e) { return !commune || e.commune === commune; });
            if (commune && !eps.length) return "";
            var n = eps.length;
            return '<section class="series" id="' + esc(s.id) + '"><div class="cover"><img src="' + esc(s.visuel || "assets/img/visuel-1.svg") + '" alt=""><strong>' + esc(L(s, "titre")) + "</strong></div>" +
              '<div><p class="eyebrow">' + esc(t("pod.series")) + " · " + n + " " + esc(t(n > 1 ? "pod.episodes" : "pod.episode")) + "</p><h2>" + esc(L(s, "titre")) + '</h2><p class="lead" style="margin-top:.8rem">' + esc(L(s, "accroche")) + '</p><p style="margin-top:.8rem">' + esc(L(s, "description")) + "</p>" +
              '<ol class="episodes">' + eps.map(episodeHTML).join("") + "</ol></div></section>";
          }).join("");
          set($("#podcasts-list"), html || '<p class="empty">' + esc(t("empty.series")) + "</p>");
        }
        var initial = communeParam();
        chips($("#podcasts-communes"), communeChips(allEps), draw, initial, t("filter.communeLabel"));
        draw(initial && allEps.some(function (e) { return e.commune === initial; }) ? initial : "");
        if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); }
      });
    },

    mag: function () {
      load("mag").then(function (d) {
        var list = (d && d.numeros) || [];
        var first = list[0];
        if (first) {
          var toc = L(first, "sommaire") || [];
          set($("#mag-current"), '<div class="issue">' + issueCover(first) + '<div class="stack"><p class="eyebrow">' + esc(t("mag.latest")) + " · " + esc(fmtLong(first.date)) + '</p><div class="badges">' + demo(first) + "</div>" +
            '<h2 style="font-size:clamp(1.8rem,1.2rem + 2vw,2.8rem);font-weight:900;font-stretch:72%;text-transform:uppercase;line-height:.9">' + esc(L(first, "titre")) + "</h2>" +
            '<p class="lead">' + esc(L(first, "resume")) + "</p>" +
            (toc.length ? '<div><p class="eyebrow" style="margin-bottom:.6rem">' + esc(t("mag.toc")) + "</p><ol>" + toc.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></div>" : "") +
            (first.lien ? '<div class="hero-actions"><a class="btn btn-primary" href="' + esc(first.lien) + '" target="_blank" rel="noopener">' + esc(t("mag.readIssue")) + "</a></div>" : '<p class="muted">' + esc(t("mag.soon")) + "</p>") + "</div></div>");
        }
        var older = list.slice(1);
        set($("#mag-archives"), older.length ? older.map(function (n) {
          return '<article class="card"><div class="media"><img src="' + esc(n.couverture || "assets/img/visuel-3.svg") + '" alt="" loading="lazy"></div><div class="body"><p class="eyebrow">' + esc(t("mag.no")) + " " + esc(n.numero) + " · " + esc(fmtLong(n.date)) + "</p><h3>" + esc(L(n, "titre")) + '</h3><p class="muted">' + esc(L(n, "resume")) + "</p>" + (n.lien ? '<p><a href="' + esc(n.lien) + '" target="_blank" rel="noopener">' + esc(t("mag.read")) + "</a></p>" : "") + "</div></article>";
        }).join("") : '<p class="empty">' + esc(t("empty.archives")) + "</p>");
      });
    },

    videos: function () {
      load("videos").then(function (d) {
        var list = (d && d.videos) || [];
        var grid = $("#videos-grid");
        var f = { theme: "", commune: communeParam() };
        function draw() {
          var items = list.filter(function (v) { return (!f.theme || v.theme === f.theme) && (!f.commune || v.commune === f.commune); });
          set(grid, items.map(videoCard).join("") || '<p class="empty">' + esc(t("empty.videos")) + "</p>");
          bindVideos(grid);
        }
        chips($("#videos-filters"), uniqBy(list, "theme", function (v) { return L(v, "theme"); }), function (v) { f.theme = v; draw(); }, "", t("filter.themeLabel"));
        chips($("#videos-communes"), communeChips(list), function (v) { f.commune = v; draw(); }, f.commune, t("filter.communeLabel"));
        if (!list.some(function (v) { return v.commune === f.commune; })) f.commune = "";
        draw();
      });
    },

    photos: function () {
      load("photos").then(function (d) {
        var list = (d && d.photos) || [];
        var grid = $("#photos-grid"), shown = list;
        var dlg = $("#lightbox"), idx = 0;
        var f = { album: "", commune: communeParam() };
        if (!list.some(function (p) { return p.commune === f.commune; })) f.commune = "";
        function draw() {
          shown = list.filter(function (p) { return (!f.album || p.album === f.album) && (!f.commune || p.commune === f.commune); });
          set(grid, shown.map(function (p, i) {
            return '<figure class="shot"><button type="button" data-i="' + i + '" aria-label="' + esc(t("photos.enlarge") + L(p, "legende")) + '"><img src="' + esc(p.src) + '" alt="' + esc(L(p, "legende")) + '" loading="lazy"></button>' +
              "<figcaption><span>" + esc(L(p, "legende")) + "</span><small>" + esc(L(p, "album")) + (p.credit ? " · © " + esc(p.credit) : "") + "</small>" + (p.exemple ? '<span class="badges">' + demo(p) + "</span>" : "") + "</figcaption></figure>";
          }).join("") || '<p class="empty">' + esc(t("empty.photos")) + "</p>");
        }
        function open(i) {
          if (!shown.length) return;
          idx = (i + shown.length) % shown.length;
          var p = shown[idx];
          $("#lb-img").src = p.src; $("#lb-img").alt = L(p, "legende");
          set($("#lb-cap"), esc(L(p, "legende")) + (p.credit ? " · © " + esc(p.credit) : "") + " · " + (idx + 1) + "/" + shown.length);
          if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); }
        }
        grid.addEventListener("click", function (ev) { var b = ev.target.closest("button[data-i]"); if (b) open(+b.getAttribute("data-i")); });
        $("#lb-prev").addEventListener("click", function () { open(idx - 1); });
        $("#lb-next").addEventListener("click", function () { open(idx + 1); });
        $("#lb-close").addEventListener("click", function () { dlg.close(); });
        dlg.addEventListener("keydown", function (ev) { if (ev.key === "ArrowLeft") open(idx - 1); if (ev.key === "ArrowRight") open(idx + 1); });
        dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });
        chips($("#photos-filters"), uniqBy(list, "album", function (p) { return L(p, "album"); }), function (v) { f.album = v; draw(); }, "", t("filter.albumLabel"));
        chips($("#photos-communes"), communeChips(list), function (v) { f.commune = v; draw(); }, f.commune, t("filter.communeLabel"));
        draw();
      });
    },

    agenda: function () {
      load("agenda").then(function (d) {
        var all = (d && d.evenements) || [];
        function draw(commune) {
          var list = commune ? all.filter(function (e) { return e.commune === commune; }) : all;
          var s = splitEvents(list);
          set($("#agenda-upcoming"), s.upcoming.length ? '<ul class="events">' + s.upcoming.map(function (e) { return eventHTML(e); }).join("") + "</ul>" : '<p class="empty">' + esc(t("empty.upcoming")) + "</p>");
          set($("#agenda-past"), s.past.length ? '<ul class="events">' + s.past.map(function (e) { return eventHTML(e, true); }).join("") + "</ul>" : "");
          $("#agenda-past-wrap").hidden = !s.past.length;
        }
        var initial = communeParam();
        if (!all.some(function (e) { return e.commune === initial; })) initial = "";
        chips($("#agenda-filters"), communeChips(all), draw, initial, t("filter.communeLabel"));
        draw(initial);
      });
    },

    acteurs: function () {
      load("acteurs").then(function (d) {
        var list = (d && d.acteurs) || [];
        function draw(niv) {
          var items = niv ? list.filter(function (a) { return a.niveau === niv; }) : list;
          set($("#acteurs-grid"), items.map(actorCard).join("") || '<p class="empty">' + esc(t("empty.acteurs")) + "</p>");
        }
        chips($("#acteurs-filters"), uniqBy(list, "niveau", function (a) { return lvl(a.niveau); }), draw);
        draw();
      });
    },

    acteur: function () {
      Promise.all([load("acteurs"), load("agenda")]).then(function (res) {
        var list = (res[0] && res[0].acteurs) || [];
        var id = decodeURIComponent((location.hash || "").slice(1)) || new URLSearchParams(location.search).get("id") || "";
        var a = list.filter(function (x) { return x.id === id; })[0];
        if (!a) {
          set($("#acteur"), '<div class="wrap section"><h1 class="display" style="font-size:2.4rem">' + esc(t("acteur.notFound")) + '</h1><p style="margin-top:1rem">' + esc(t("acteur.notFoundText")) + ' <a href="acteurs.html">' + esc(t("acteur.seeAll")) + "</a>.</p></div>");
          return;
        }
        document.title = L(a, "nom") + " · Yapok Média";
        var events = ((res[1] && res[1].evenements) || []).filter(function (e) { return e.organisateur === a.nom; });
        var up = splitEvents(events).upcoming;
        var contact = [
          a.commune ? "<dt>" + esc(t("acteur.commune")) + "</dt><dd>" + esc(L(a, "commune")) + "</dd>" : "",
          a.type ? "<dt>" + esc(t("acteur.type")) + "</dt><dd>" + esc(L(a, "type")) + "</dd>" : "",
          a.email ? "<dt>" + esc(t("acteur.email")) + '</dt><dd class="copy">' + esc(a.email) + "</dd>" : "",
          a.telephone ? "<dt>" + esc(t("acteur.tel")) + '</dt><dd class="copy">' + esc(a.telephone) + "</dd>" : "",
          a.site ? "<dt>" + esc(t("acteur.site")) + '</dt><dd><a href="' + esc(a.site) + '" target="_blank" rel="noopener">' + esc(a.site.replace(/^https?:\/\//, "")) + "</a></dd>" : ""
        ].join("");
        set($("#acteur"),
          '<section class="page-head"><div class="wrap"><p class="eyebrow">' + esc(lvl(a.niveau)) + " · " + esc(L(a, "type")) + '</p><h1 class="display">' + esc(L(a, "nom")) + "</h1>" + (L(a, "accroche") ? '<p class="lead">' + esc(L(a, "accroche")) + "</p>" : "") + '<div class="badges">' + demo(a) + "</div></div></section>" +
          '<section class="section"><div class="wrap profile"><div class="stack" style="gap:1.4rem">' +
          (a.visuel ? '<img src="' + esc(a.visuel) + '" alt="" style="border-radius:var(--radius);aspect-ratio:16/9;object-fit:cover;width:100%">' : "") +
          '<div class="prose"><p>' + esc(L(a, "presentation")) + "</p></div>" +
          (up.length ? '<div class="stack"><h2 class="display" style="font-size:1.5rem">' + esc(t("acteur.next")) + '</h2><ul class="events">' + up.map(function (e) { return eventHTML(e); }).join("") + "</ul></div>" : "") +
          '</div><aside><h2 class="eyebrow">' + esc(t("acteur.card")) + "</h2><dl>" + contact + '</dl><a class="btn btn-dark btn-small" href="acteurs.html">' + esc(t("acteur.all")) + "</a></aside></div></section>");
      });
      window.addEventListener("hashchange", function () { location.reload(); });
    }
  };

  /* ---------- ondes radio dessinées dans les bandes sombres ---------- */
  function drawWaves() {
    $$("canvas.waves").forEach(function (c) {
      var box = c.parentElement, w = box.clientWidth, h = box.clientHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      var g = c.getContext("2d"); if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      var corner = c.getAttribute("data-waves") || "br";
      var cx = corner.indexOf("r") > -1 ? w * .92 : w * .08, cy = corner.indexOf("b") > -1 ? h * .95 : h * .05;
      var maxR = Math.hypot(w, h) * .62, step = w < 700 ? 30 : 42;
      g.lineCap = "round";
      for (var r = 40, i = 0; r < maxR; r += step, i++) {
        var fade = 1 - r / maxR;
        g.strokeStyle = i % 3 === 0 ? "rgba(0,191,98," + (.55 * fade).toFixed(3) + ")" : "rgba(180,236,209," + (.22 * fade).toFixed(3) + ")";
        g.lineWidth = i % 3 === 0 ? 3 : 1.5;
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
      }
    });
  }
  function reveal() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } });
    }, { threshold: .12 });
    els.forEach(function (el) { io.observe(el); });
  }
  function socials(site, host) {
    if (!host) return;
    var r = (site && site.reseaux) || {};
    host.innerHTML = [["youtube", "YouTube"], ["tiktok", "TikTok"], ["facebook", "Facebook"], ["instagram", "Instagram"]]
      .filter(function (s) { return r[s[0]]; })
      .map(function (s) { return '<a href="' + esc(r[s[0]]) + '" target="_blank" rel="noopener">' + s[1] + "</a>"; }).join("");
  }

  /* ---------- démarrage ---------- */
  /* replie le menu si ses libellés ne tiennent pas sur une ligne (ex. en néerlandais) */
  function fitNav() {
    var root = document.documentElement, w = $(".site-header .wrap");
    root.classList.remove("nav-compact");
    if (w && w.scrollWidth > w.clientWidth + 1) root.classList.add("nav-compact");
  }

  header();
  applyStatic();
  fitNav();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNav);
  drawWaves();
  var wavesTimer;
  window.addEventListener("resize", function () { fitNav(); clearTimeout(wavesTimer); wavesTimer = setTimeout(drawWaves, 150); });
  reveal();
  load("site").then(function (site) {
    footer(site || {});
    onairPill(site);
    $$("[data-site]").forEach(function (el) {
      var path = el.getAttribute("data-site").split("."), v = site;
      path.forEach(function (k) { v = v ? v[k] : ""; });
      if (v) el.textContent = v;
    });
    bindForms(site || {});
    if (pages[page]) pages[page](site || {});
    setTimeout(drawWaves, 400);
  });
})();
