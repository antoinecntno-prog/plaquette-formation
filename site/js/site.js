/* Thème jour / nuit, boucle vidéo du haut de page, étoile filante et barre fixe.
   - Thème jour de 7 h à 20 h à l'heure du visiteur, nuit le reste du temps ; son choix manuel est gardé sur l'appareil.
   - La vidéo démarre par script (mouvement réduit et économie de données respectés), se met en pause
     à la demande (WCAG 2.2.2) et quand le haut de page sort de l'écran.
   - La scène de jour ne s'affiche que si la vidéo de jour est déclarée présente (data-jour-disponible). */
(function () {
  var racine = document.documentElement;
  var mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ouverture = document.querySelector('.ouverture');
  var video = document.querySelector('.ouverture-video');
  var boutonVideo = document.querySelector('.bouton-video');
  var boutonsTheme = document.querySelectorAll('.bouton-theme');
  var barre = document.querySelector('.barre');
  var etoile = document.querySelector('.etoile');

  /* ---------- Thème ---------- */
  function themeCourant() {
    return racine.getAttribute('data-theme') || 'jour';
  }
  function afficherBoutonsTheme() {
    var nuit = themeCourant() === 'nuit';
    boutonsTheme.forEach(function (b) {
      b.setAttribute('aria-label', nuit ? 'Passer en mode jour' : 'Passer en mode nuit');
    });
  }
  function appliquerTheme(theme, memoriser) {
    racine.setAttribute('data-theme', theme);
    if (memoriser) { try { localStorage.setItem('theme', theme); } catch (e) {} }
    afficherBoutonsTheme();
    majScene();
  }
  boutonsTheme.forEach(function (b) {
    b.addEventListener('click', function () {
      appliquerTheme(themeCourant() === 'nuit' ? 'jour' : 'nuit', true);
    });
  });

  /* ---------- Vidéo et scène ---------- */
  var economie = navigator.connection && navigator.connection.saveData;
  var voulue = !mouvementReduit.matches && !economie; // lecture souhaitée par le visiteur
  var visible = true;
  var scene = null;

  function afficherEtatVideo() {
    if (!boutonVideo || !video) return;
    var enLecture = !video.paused;
    boutonVideo.setAttribute('aria-label', enLecture ? 'Mettre la vidéo en pause' : 'Relancer la vidéo');
    boutonVideo.setAttribute('data-etat', enLecture ? 'lecture' : 'pause');
    planifierEtoile();
  }
  function lancer() {
    video.preload = 'auto';
    var promesse = video.play();
    if (promesse && promesse.catch) promesse.catch(function () { afficherEtatVideo(); });
  }
  function appliquerLecture() {
    if (!video) return;
    if (voulue && visible) { if (video.paused) lancer(); }
    else if (!video.paused) video.pause();
  }
  function majScene() {
    if (!video || !ouverture) return;
    var jourDispo = video.getAttribute('data-jour-disponible') === 'true';
    var nouvelle = (themeCourant() === 'jour' && jourDispo) ? 'jour' : 'nuit';
    if (nouvelle !== scene) {
      var premiere = scene === null;
      scene = nouvelle;
      ouverture.setAttribute('data-scene', scene);
      racine.classList.toggle('scene-jour', scene === 'jour');
      var src = video.getAttribute('data-' + scene + '-src');
      var affiche = video.getAttribute('data-' + scene + '-affiche');
      if (!premiere || scene === 'jour') {
        video.poster = affiche;
        video.src = src;
        appliquerLecture();
      }
    }
    planifierEtoile();
  }

  if (video && boutonVideo) {
    boutonVideo.hidden = false;
    boutonVideo.addEventListener('click', function () {
      voulue = video.paused;
      appliquerLecture();
      afficherEtatVideo();
    });
    video.addEventListener('play', afficherEtatVideo);
    video.addEventListener('pause', afficherEtatVideo);
    if (mouvementReduit.addEventListener) {
      mouvementReduit.addEventListener('change', function (e) { if (e.matches) { voulue = false; appliquerLecture(); } });
    }
  }

  /* ---------- Étoile filante (nuit seulement, vidéo en lecture, mouvement autorisé) ---------- */
  var minuterie = null;
  function etoileAutorisee() {
    return etoile && video && themeCourant() === 'nuit' && scene === 'nuit' && !video.paused && visible && !mouvementReduit.matches;
  }
  function filer() {
    minuterie = null;
    if (!etoileAutorisee()) return;
    var hasard = function (a, b) { return a + Math.random() * (b - a); };
    etoile.style.setProperty('--x', hasard(52, 86).toFixed(1) + '%');
    etoile.style.setProperty('--y', hasard(4, 20).toFixed(1) + '%');
    etoile.style.setProperty('--angle', hasard(140, 158).toFixed(0) + 'deg');
    etoile.style.setProperty('--course', hasard(260, 380).toFixed(0) + 'px');
    etoile.classList.remove('passe');
    void etoile.offsetWidth;
    etoile.classList.add('passe');
    planifierEtoile();
  }
  function planifierEtoile() {
    if (!etoile) return;
    if (!etoileAutorisee()) {
      if (minuterie) { clearTimeout(minuterie); minuterie = null; }
      return;
    }
    if (!minuterie) minuterie = setTimeout(filer, 2500 + Math.random() * 9000);
  }
  if (etoile) etoile.addEventListener('animationend', function () { etoile.classList.remove('passe'); });

  /* ---------- Haut de page visible : lecture et barre fixe ---------- */
  if (ouverture && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entrees) {
      visible = entrees[0].isIntersecting;
      if (barre) barre.classList.toggle('fixe', !visible);
      appliquerLecture();
      planifierEtoile();
    }, { rootMargin: '-72px 0px 0px 0px' }).observe(ouverture);
  }

  afficherBoutonsTheme();
  majScene();
  afficherEtatVideo();
  appliquerLecture();
})();

/* Bandeau cookies : deux familles réglables, rien ne se charge sans accord.
   - « Mesure d'audience » charge Google Analytics (data-ga), « Publicité » charge le pixel Meta (data-pixel), si l'identifiant est renseigné.
   - Le choix est gardé dans le stockage local pendant la durée indiquée (data-duree, en mois), puis le bandeau revient.
   - « Gérer mes cookies » rouvre les préférences ; un refus efface les cookies de la famille refusée. */
(function () {
  var bandeau = document.querySelector('.cookies');
  if (!bandeau) return;
  var CLE = 'preferences-cookies';
  var pixel = bandeau.getAttribute('data-pixel');
  var ga = bandeau.getAttribute('data-ga');
  var dureeMs = Number(bandeau.getAttribute('data-duree') || 6) * 30.44 * 24 * 3600 * 1000;
  var accueil = bandeau.querySelector('.cookies-accueil');
  var reglages = bandeau.querySelector('.cookies-preferences');
  var interrupteurs = bandeau.querySelectorAll('[data-famille]');
  var memoire = null;
  var actuel = { mesure: false, pub: false };

  function lire() {
    var brut = memoire;
    try { brut = localStorage.getItem(CLE) || memoire; } catch (e) {}
    try {
      var c = JSON.parse(brut);
      if (c && typeof c.mesure === 'boolean' && typeof c.pub === 'boolean' && Date.now() - c.date < dureeMs) return c;
    } catch (e) {}
    return null;
  }
  function ecrire(c) {
    memoire = JSON.stringify({ mesure: c.mesure, pub: c.pub, date: Date.now() });
    try { localStorage.setItem(CLE, memoire); } catch (e) {}
  }

  function effacer(test) {
    var hote = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (morceau) {
      var nom = morceau.split('=')[0].trim();
      if (!test(nom)) return;
      ['', '; domain=' + hote, '; domain=.' + hote].forEach(function (d) {
        document.cookie = nom + '=; Max-Age=0; path=/' + d;
      });
    });
  }
  function charger(src) {
    var s = document.createElement('script');
    s.async = true; s.src = src;
    document.head.appendChild(s);
  }
  function chargerPixel() {
    if (!pixel) return;
    if (window.fbq) { window.fbq('consent', 'grant'); return; }
    var f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
    if (!window._fbq) window._fbq = f;
    f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
    charger('https://connect.facebook.net/fr_FR/fbevents.js');
    window.fbq('init', pixel);
    window.fbq('track', 'PageView');
  }
  function chargerGa() {
    if (!ga) return;
    window['ga-disable-' + ga] = false;
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ga, { cookie_expires: 395 * 24 * 3600 });
    charger('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga));
  }
  function appliquer(c) {
    if (c.pub) chargerPixel();
    else { if (window.fbq) window.fbq('consent', 'revoke'); effacer(function (n) { return n === '_fbp' || n === '_fbc'; }); }
    if (c.mesure) chargerGa();
    else { if (ga) window['ga-disable-' + ga] = true; effacer(function (n) { return n === '_ga' || n.indexOf('_ga_') === 0; }); }
    actuel = { mesure: c.mesure, pub: c.pub };
  }
  function choisir(c) { ecrire(c); appliquer(c); bandeau.hidden = true; }

  function vue(preferences) {
    accueil.hidden = preferences;
    reglages.hidden = !preferences;
    interrupteurs.forEach(function (i) { i.checked = !!actuel[i.getAttribute('data-famille')]; });
  }
  function ouvrir(preferences) { vue(preferences); bandeau.hidden = false; bandeau.focus(); }

  document.addEventListener('click', function (e) {
    var cible = e.target.closest('[data-cookies], a[href*="cal.com/"]');
    if (!cible) return;
    var action = cible.getAttribute('data-cookies');
    if (action === 'accepter') choisir({ mesure: true, pub: true });
    else if (action === 'refuser') choisir({ mesure: false, pub: false });
    else if (action === 'preferences') vue(true);
    else if (action === 'enregistrer') {
      var c = { mesure: false, pub: false };
      interrupteurs.forEach(function (i) { c[i.getAttribute('data-famille')] = i.checked; });
      choisir(c);
    }
    else if (action === 'gerer') ouvrir(true);
    else if (!action) {
      if (actuel.pub && window.fbq) window.fbq('track', 'Contact');
      if (actuel.mesure && window.gtag) window.gtag('event', 'clic_rendez_vous');
    }
  });

  var choix = lire();
  if (choix) appliquer(choix);
  else ouvrir(false);
})();
