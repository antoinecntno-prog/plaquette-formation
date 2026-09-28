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
