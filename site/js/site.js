/* Boucle vidéo du haut de page.
   Démarrage par script pour respecter la préférence de mouvement réduit et l'économie de données,
   pause à la demande (WCAG 2.2.2) et pause automatique quand le haut de page sort de l'écran. */
(function () {
  var video = document.querySelector('.ouverture-video');
  var bouton = document.querySelector('.bouton-video');
  if (!video || !bouton) return;

  var mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)');
  var economie = navigator.connection && navigator.connection.saveData;
  var voulue = !mouvementReduit.matches && !economie; // la lecture souhaitée par le visiteur
  var visible = true;

  function afficherEtat() {
    var enLecture = !video.paused;
    bouton.setAttribute('aria-label', enLecture ? 'Mettre la vidéo en pause' : 'Relancer la vidéo');
    bouton.setAttribute('data-etat', enLecture ? 'lecture' : 'pause');
  }

  function lancer() {
    video.preload = 'auto';
    var promesse = video.play();
    if (promesse && promesse.catch) {
      promesse.catch(function () { afficherEtat(); });
    }
  }

  function appliquer() {
    if (voulue && visible) {
      if (video.paused) lancer();
    } else if (!video.paused) {
      video.pause();
    }
  }

  bouton.hidden = false;
  bouton.addEventListener('click', function () {
    voulue = video.paused;
    appliquer();
    afficherEtat();
  });
  video.addEventListener('play', afficherEtat);
  video.addEventListener('pause', afficherEtat);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entrees) {
      visible = entrees[0].isIntersecting;
      appliquer();
    }).observe(video.parentElement);
  }

  var suivre = function (e) { if (e.matches) { voulue = false; appliquer(); } };
  if (mouvementReduit.addEventListener) mouvementReduit.addEventListener('change', suivre);

  afficherEtat();
  appliquer();
})();

/* Thème jour / nuit : suit l'appareil tant que le visiteur ne l'a pas changé ; son choix est gardé sur l'appareil.
   Barre de navigation fixée en haut dès que le haut de page sort de l'écran. */
(function () {
  var racine = document.documentElement;
  var sombreSysteme = window.matchMedia('(prefers-color-scheme: dark)');
  var boutons = document.querySelectorAll('.bouton-theme');

  function choixMemorise() {
    try { var t = localStorage.getItem('theme'); return t === 'jour' || t === 'nuit' ? t : null; } catch (e) { return null; }
  }
  function themeCourant() {
    return racine.getAttribute('data-theme') || (sombreSysteme.matches ? 'nuit' : 'jour');
  }
  function afficher() {
    var nuit = themeCourant() === 'nuit';
    boutons.forEach(function (b) { b.setAttribute('aria-label', nuit ? 'Passer en mode jour' : 'Passer en mode nuit'); });
  }
  function appliquer(theme, memoriser) {
    racine.setAttribute('data-theme', theme);
    if (memoriser) { try { localStorage.setItem('theme', theme); } catch (e) {} }
    afficher();
  }
  boutons.forEach(function (b) {
    b.addEventListener('click', function () { appliquer(themeCourant() === 'nuit' ? 'jour' : 'nuit', true); });
  });
  if (sombreSysteme.addEventListener) {
    sombreSysteme.addEventListener('change', function (e) { if (!choixMemorise()) appliquer(e.matches ? 'nuit' : 'jour', false); });
  }
  afficher();

  var barre = document.querySelector('.barre');
  var ouverture = document.querySelector('.ouverture');
  if (barre && ouverture && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entrees) {
      barre.classList.toggle('fixe', !entrees[0].isIntersecting);
    }, { rootMargin: '-72px 0px 0px 0px' }).observe(ouverture);
  }
})();
