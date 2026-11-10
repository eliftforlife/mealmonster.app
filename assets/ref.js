// Ad source tagging for mealmonster.app (11-10, so Meal Monster ads can be measured without an app SDK).
// A visit that lands with ?ref=<source> (or utm_source=<source>) remembers the source for this tab and for 30 days,
// and every App Store link then carries ct=<source>, so App Store Connect shows installs per source.
// An existing campaign token is kept: ct=plan_men becomes ct=meta_plan_men (Apple allows 40 characters).
// Links rendered later (quiz results, checkout) are tagged at click time. No personal data: only the source word.
// Also sends a GA4 'app_store_click' event where GA4 is loaded (non-health pages only; this file never loads GA itself).
(() => {
  const KEY = 'mm_ref', DAYS = 30, APP = /apps\.apple\.com\/.*id6787743894/;
  const clean = s => String(s || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24);
  let src = '';
  try {
    const q = new URLSearchParams(location.search);
    src = clean(q.get('ref') || q.get('utm_source'));
    if (src) {
      try { sessionStorage.setItem(KEY, src); } catch (e) {}
      try { localStorage.setItem(KEY, JSON.stringify({ s: src, t: Date.now() })); } catch (e) {}
    } else {
      try { src = clean(sessionStorage.getItem(KEY)); } catch (e) {}
      if (!src) {
        try {
          const o = JSON.parse(localStorage.getItem(KEY) || 'null');
          if (o && o.s && Date.now() - o.t < DAYS * 864e5) src = clean(o.s);
        } catch (e) {}
      }
    }
  } catch (e) {}

  const tag = a => {
    if (!src || !a || !a.href || !APP.test(a.href) || a.dataset.mmRef) return;
    try {
      const u = new URL(a.href), ct = u.searchParams.get('ct') || '';
      if (!(ct === src || ct.startsWith(src + '_'))) u.searchParams.set('ct', (ct ? src + '_' + ct : src).slice(0, 40));
      a.href = u.toString(); a.dataset.mmRef = '1';
    } catch (e) {}
  };
  const all = () => document.querySelectorAll('a[href*="apps.apple.com"]').forEach(tag);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();

  // capture phase, so links added after load (quiz results, checkout) are tagged before the browser follows them
  const onTap = e => {
    const a = e.target && e.target.closest && e.target.closest('a[href*="apps.apple.com"]');
    if (!a) return;
    tag(a);
    if (e.type === 'click' && typeof window.gtag === 'function') {
      try { window.gtag('event', 'app_store_click', { source: src || 'none', page: location.pathname }); } catch (err) {}
    }
  };
  document.addEventListener('pointerdown', onTap, true);
  document.addEventListener('click', onTap, true);
})();
