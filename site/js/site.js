/* Machines à états du site. Chaque machine écrit son état dans un attribut du DOM : la page se lit sans deviner.
   - Thème : html[data-theme] vaut jour ou nuit, html[data-theme-source] dit qui l'a choisi (heure ou visiteur).
   - Vidéo du haut de page : .ouverture[data-video] dit si elle joue, et sinon pourquoi.
   - Bandeau cookies : .cookies[data-etat] vaut ferme, accueil ou preferences ; html[data-consentement] résume le choix.
   Les règles de passage sont dans Etats, sans DOM : build.mjs les charge pour vérifier les pages. Détail dans ETATS.md. */
var Etats = (function () {
  /* Thème de départ : le choix gardé sur l'appareil gagne, sinon jour de 7 h à 20 h à l'heure du visiteur.
     Le script en ligne de src/partials/tete-commune.html applique la même règle avant le premier affichage. */
  function themeInitial(memoire, heure) {
    if (memoire === 'jour' || memoire === 'nuit') return { theme: memoire, source: 'visiteur' };
    return { theme: heure >= 7 && heure < 20 ? 'jour' : 'nuit', source: 'heure' };
  }
  /* Scène du haut de page : la scène de jour demande le thème jour et la vidéo de jour. */
  function scene(theme, jourDisponible) {
    return theme === 'jour' && jourDisponible ? 'jour' : 'nuit';
  }
  /* Vidéo : lecture, ou la raison de la pause.
     motifPause vaut null quand la lecture est souhaitée, sinon visiteur, mouvement-reduit ou economie. */
  function video(e) {
    if (e.enLecture) return 'lecture';
    if (e.motifPause) return 'pause-' + e.motifPause;
    if (!e.visible) return 'pause-hors-ecran';
    return 'bloquee'; // lecture souhaitée et haut de page visible : le navigateur a refusé de lancer la vidéo
  }
  /* Consentement : résumé du choix du visiteur, null tant qu'il n'a rien choisi ou que son choix a expiré. */
  function consentement(choix) {
    if (!choix) return 'inconnu';
    if (choix.mesure && choix.pub) return 'tout';
    if (!choix.mesure && !choix.pub) return 'aucun';
    return 'partiel';
  }
  /* Bandeau cookies : état suivant pour chaque action. Une action absente de la ligne laisse l'état en place.
     « demander » ouvre le bandeau à la première visite ; les autres actions viennent des boutons [data-cookies]. */
  var BANDEAU = {
    ferme: { demander: 'accueil', gerer: 'preferences' },
    accueil: { preferences: 'preferences', gerer: 'preferences', accepter: 'ferme', refuser: 'ferme' },
    preferences: { enregistrer: 'ferme', accepter: 'ferme', refuser: 'ferme' }
  };
  /* Échap sort des préférences sans rien changer : retour à l'accueil si aucun choix n'existe, fermeture sinon. */
  function bandeau(etat, action, choixConnu) {
    if (action === 'echap') return etat === 'preferences' ? (choixConnu ? 'ferme' : 'accueil') : etat;
    return (BANDEAU[etat] && BANDEAU[etat][action]) || etat;
  }
  return { themeInitial: themeInitial, scene: scene, video: video, consentement: consentement, bandeau: bandeau, BANDEAU: BANDEAU };
})();
if (typeof module === 'object' && module.exports) module.exports = Etats;

/* Thème jour / nuit, boucle vidéo du haut de page, étoile filante et barre fixe.
   - Le choix manuel du thème est gardé sur l'appareil et suivi dans les autres onglets du site.
   - La vidéo démarre par script (mouvement réduit et économie de données respectés), se met en pause
     à la demande (WCAG 2.2.2), quand le haut de page sort de l'écran et quand l'onglet passe en arrière-plan.
   - La scène de jour ne s'affiche que si la vidéo de jour est déclarée présente (data-jour-disponible). */
(function () {
  if (typeof document === 'undefined') return;
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
  function appliquerTheme(theme, source) {
    racine.setAttribute('data-theme', theme);
    racine.setAttribute('data-theme-source', source);
    afficherBoutonsTheme();
    majScene();
  }
  boutonsTheme.forEach(function (b) {
    b.addEventListener('click', function () {
      var theme = themeCourant() === 'nuit' ? 'jour' : 'nuit';
      try { localStorage.setItem('theme', theme); } catch (e) {}
      appliquerTheme(theme, 'visiteur');
    });
  });
  window.addEventListener('storage', function (e) {
    if (e.key === 'theme' && (e.newValue === 'jour' || e.newValue === 'nuit')) appliquerTheme(e.newValue, 'visiteur');
  });

  /* ---------- Vidéo et scène ---------- */
  var economie = navigator.connection && navigator.connection.saveData;
  var motifPause = mouvementReduit.matches ? 'mouvement-reduit' : economie ? 'economie' : null; // null : lecture souhaitée
  var hautVisible = true;
  var scene = null;

  function visible() {
    return hautVisible && !document.hidden;
  }
  function afficherEtatVideo() {
    if (!boutonVideo || !video) return;
    var enLecture = !video.paused;
    boutonVideo.setAttribute('aria-label', enLecture ? 'Mettre la vidéo en pause' : 'Relancer la vidéo');
    boutonVideo.setAttribute('data-etat', enLecture ? 'lecture' : 'pause');
    if (ouverture) ouverture.setAttribute('data-video', Etats.video({ enLecture: enLecture, motifPause: motifPause, visible: visible() }));
    planifierEtoile();
  }
  function lancer() {
    video.preload = 'auto';
    var promesse = video.play();
    if (promesse && promesse.catch) promesse.catch(function () { afficherEtatVideo(); });
  }
  function appliquerLecture() {
    if (!video) return;
    if (!motifPause && visible()) { if (video.paused) lancer(); }
    else if (!video.paused) video.pause();
    afficherEtatVideo();
  }
  function majScene() {
    if (!video || !ouverture) return;
    var nouvelle = Etats.scene(themeCourant(), video.getAttribute('data-jour-disponible') === 'true');
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
      motifPause = video.paused ? null : 'visiteur';
      appliquerLecture();
    });
    video.addEventListener('play', afficherEtatVideo);
    video.addEventListener('pause', afficherEtatVideo);
    if (mouvementReduit.addEventListener) {
      mouvementReduit.addEventListener('change', function (e) { if (e.matches) { motifPause = 'mouvement-reduit'; appliquerLecture(); } });
    }
    document.addEventListener('visibilitychange', appliquerLecture);
  }

  /* ---------- Étoile filante (nuit seulement, vidéo en lecture, mouvement autorisé) ---------- */
  var minuterie = null;
  function etoileAutorisee() {
    return etoile && video && themeCourant() === 'nuit' && scene === 'nuit' && !video.paused && visible() && !mouvementReduit.matches;
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
      hautVisible = entrees[0].isIntersecting;
      if (barre) barre.classList.toggle('fixe', !hautVisible);
      appliquerLecture();
      planifierEtoile();
    }, { rootMargin: '-72px 0px 0px 0px' }).observe(ouverture);
  }

  if (!racine.getAttribute('data-theme-source')) {
    var memo = null;
    try { memo = localStorage.getItem('theme'); } catch (e) {}
    racine.setAttribute('data-theme-source', Etats.themeInitial(memo, new Date().getHours()).source);
  }
  afficherBoutonsTheme();
  majScene();
  appliquerLecture();
})();

/* Bandeau cookies : deux familles réglables, rien ne se charge sans accord.
   - « Mesure d'audience » charge Google Analytics (data-ga), « Publicité » charge le pixel Meta (data-pixel), si l'identifiant est renseigné.
   - Le choix est gardé dans le stockage local pendant la durée indiquée (data-duree, en mois), puis le bandeau revient.
   - « Gérer mes cookies » rouvre les préférences ; un refus efface les cookies de la famille refusée.
   - Échap sort des préférences sans rien changer, et le focus revient au bouton qui a ouvert le bandeau. */
(function () {
  if (typeof document === 'undefined') return;
  var bandeau = document.querySelector('.cookies');
  if (!bandeau) return;
  var racine = document.documentElement;
  var CLE = 'preferences-cookies';
  var pixel = bandeau.getAttribute('data-pixel');
  var ga = bandeau.getAttribute('data-ga');
  var dureeMs = Number(bandeau.getAttribute('data-duree') || 6) * 30.44 * 24 * 3600 * 1000;
  var accueil = bandeau.querySelector('.cookies-accueil');
  var reglages = bandeau.querySelector('.cookies-preferences');
  var interrupteurs = bandeau.querySelectorAll('[data-famille]');
  var memoire = null;
  var actuel = { mesure: false, pub: false };
  var choixConnu = false;   // vrai dès qu'un choix valide existe, lu ou fait dans cette page
  var etat = 'ferme';       // ferme, accueil ou preferences
  var declencheur = null;   // bouton qui a ouvert le bandeau : le focus lui revient à la fermeture

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
    choixConnu = true;
  }
  function choisir(c) { ecrire(c); appliquer(c); }

  /* Affiche l'état courant : c'est le seul endroit qui montre ou cache le bandeau et ses deux vues. */
  function afficher() {
    bandeau.setAttribute('data-etat', etat);
    bandeau.hidden = etat === 'ferme';
    accueil.hidden = etat !== 'accueil';
    reglages.hidden = etat !== 'preferences';
    racine.setAttribute('data-consentement', Etats.consentement(choixConnu ? actuel : null));
  }
  /* Passe à l'état suivant. Une vue qui s'ouvre reprend le choix en cours et reçoit le focus. */
  function passer(action, origine) {
    var avant = etat;
    etat = Etats.bandeau(avant, action, choixConnu);
    if (avant === 'ferme' && etat !== 'ferme') declencheur = origine || null;
    var vueChangee = etat !== avant || action === 'gerer';
    if (etat !== 'ferme' && vueChangee) {
      interrupteurs.forEach(function (i) { i.checked = !!actuel[i.getAttribute('data-famille')]; });
    }
    afficher();
    if (etat !== 'ferme' && vueChangee) bandeau.focus();
    if (avant !== 'ferme' && etat === 'ferme' && declencheur) { declencheur.focus(); declencheur = null; }
  }

  document.addEventListener('click', function (e) {
    var cible = e.target.closest('[data-cookies], a[href*="cal.com/"]');
    if (!cible) return;
    var action = cible.getAttribute('data-cookies');
    if (!action) {
      if (actuel.pub && window.fbq) window.fbq('track', 'Contact');
      if (actuel.mesure && window.gtag) window.gtag('event', 'clic_rendez_vous');
      return;
    }
    if (action === 'accepter') choisir({ mesure: true, pub: true });
    else if (action === 'refuser') choisir({ mesure: false, pub: false });
    else if (action === 'enregistrer') {
      var c = { mesure: false, pub: false };
      interrupteurs.forEach(function (i) { c[i.getAttribute('data-famille')] = i.checked; });
      choisir(c);
    }
    passer(action, cible);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && etat !== 'ferme') passer('echap');
  });

  var choix = lire();
  if (choix) { appliquer(choix); afficher(); }
  else passer('demander');
})();
