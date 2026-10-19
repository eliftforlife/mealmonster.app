// Homepage motion: scroll reveals and the sticky App Store bar (after the hero). No auto-scrolling: it fought touch scrolling on iPhone (10-19).
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  // sticky CTA: shows once the hero's own button has scrolled away, hides near the final CTA
  var sticky = document.getElementById('sticky'), hero = document.querySelector('.hero .appstore'), fin = document.querySelector('.final');
  if (sticky && hero && 'IntersectionObserver' in window) {
    var heroVis = true, finVis = false;
    var upd = function () { sticky.classList.toggle('show', !heroVis && !finVis); };
    new IntersectionObserver(function (es) { heroVis = es[0].isIntersecting; upd(); }).observe(hero);
    if (fin) new IntersectionObserver(function (es) { finVis = es[0].isIntersecting; upd(); }, { threshold: 0.2 }).observe(fin);
  }

})();
