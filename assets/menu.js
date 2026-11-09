// Fast food charts: filter and sort. The rows are real HTML, so the page works without this.
(() => {
  const box = document.getElementById('m-rows');
  if (!box) return;
  const rows = [...box.querySelectorAll('.m-row')], chips = document.querySelectorAll('[data-f]'), sorts = document.querySelectorAll('[data-s]');
  const on0 = document.querySelector('[data-s].on');
  let f = '', s = on0 ? on0.dataset.s : 'pro';   // 11-09: the ranked lists start on protein per 100 calories or fewest calories
  const by = { ppc: (r) => -parseFloat(r.dataset.ppc), pro: (r) => -parseFloat(r.dataset.pro), cal: (r) => parseFloat(r.dataset.cal) };
  const unit = { ppc: 'ppc', pro: 'pro', cal: 'cal' };
  const on = (list, b) => list.forEach((x) => x.classList.toggle('on', x === b));
  const draw = () => {
    const shown = rows.filter((r) => !f || r.dataset.cat === f), key = unit[s], top = Math.max(...shown.map((r) => parseFloat(r.dataset[key])), 1);
    rows.slice().sort((a, b) => by[s](a) - by[s](b)).forEach((r) => {
      r.hidden = !!f && r.dataset.cat !== f; box.appendChild(r);
      r.querySelector('.m-b i').style.width = `${(parseFloat(r.dataset[key]) / top) * 100}%`;
      const b = r.querySelector('.m-v b'), e = r.querySelector('.m-v em');
      if (s === 'pro') { b.textContent = `${r.dataset.pro} g`; e.textContent = `${r.dataset.cal} cal`; }
      if (s === 'ppc') { b.textContent = `${parseFloat(r.dataset.ppc).toFixed(1).replace(/\.0$/, '')} g`; e.textContent = 'per 100 cal'; }
      if (s === 'cal') { b.textContent = r.dataset.cal; e.textContent = `${r.dataset.pro} g protein`; }
    });
  };
  chips.forEach((b) => b.addEventListener('click', () => { f = b.dataset.f; on(chips, b); draw(); }));
  sorts.forEach((b) => b.addEventListener('click', () => { s = b.dataset.s; on(sorts, b); draw(); }));
})();
