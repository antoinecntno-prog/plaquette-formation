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
