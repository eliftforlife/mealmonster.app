// Homepage motion: scroll reveals, the sticky App Store bar (after the hero), and a gentle auto-advance of the app-screen rail.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    els.forEach(function (e) { io.observe(e); });
  }

  // sticky CTA: shows once the hero's own button has scrolled away, hides near the final CTA
  var sticky = document.getElementById('sticky'), hero = document.querySelector('.hero .store-badge'), fin = document.querySelector('.final');
  if (sticky && hero && 'IntersectionObserver' in window) {
    var heroVis = true, finVis = false;
    var upd = function () { sticky.classList.toggle('show', !heroVis && !finVis); };
    new IntersectionObserver(function (es) { heroVis = es[0].isIntersecting; upd(); }).observe(hero);
    if (fin) new IntersectionObserver(function (es) { finVis = es[0].isIntersecting; upd(); }, { threshold: 0.2 }).observe(fin);
  }

  // app-screen rail: advance every 3.5 s on phones until the visitor touches it
  var rail = document.getElementById('rail');
  if (rail && !reduce && rail.scrollWidth > rail.clientWidth + 10) {
    var i = 0, stop = false, figs = rail.querySelectorAll('figure');
    ['touchstart', 'pointerdown', 'wheel'].forEach(function (ev) { rail.addEventListener(ev, function () { stop = true; }, { passive: true }); });
    setInterval(function () {
      if (stop || document.hidden) return;
      i = (i + 1) % figs.length;
      rail.scrollTo({ left: figs[i].offsetLeft - (rail.clientWidth - figs[i].clientWidth) / 2, behavior: 'smooth' });
    }, 3500);
  }
})();
