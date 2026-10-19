// Homepage motion: the typing illustration and scroll reveals. With reduced motion it shows the finished state.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // scroll reveal
  var els = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  // typing illustration: sentence -> estimate, cycling through the input modes
  var typed = document.getElementById('typed'), est = document.querySelector('.estimate'), modes = document.querySelectorAll('.mode');
  if (!typed || !est) return;
  var lines = ['chicken, rice and a salad', 'two eggs and toast', 'a protein shake after the gym', 'pasta with meat sauce'];
  if (reduce) { typed.textContent = lines[0]; est.classList.add('show'); return; }
  var li = 0;
  function run() {
    var s = lines[li % lines.length], i = 0;
    est.classList.remove('show'); typed.textContent = '';
    modes.forEach(function (m, k) { m.classList.toggle('on', k === li % modes.length); });
    var t = setInterval(function () {
      typed.textContent = s.slice(0, ++i);
      if (i >= s.length) { clearInterval(t); setTimeout(function () { est.classList.add('show'); }, 350); setTimeout(function () { li++; run(); }, 3600); }
    }, 55);
  }
  run();
})();
