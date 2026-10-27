const form = document.querySelector('#compare-filters');
const cards = [...document.querySelectorAll('[data-app]')];
const search = document.querySelector('#app-search');
const method = document.querySelector('#method-filter');
const free = document.querySelector('#free-filter');
const count = document.querySelector('#app-count');
const empty = document.querySelector('#empty-apps');
const selected = document.querySelector('#selected-compare');
const params = new URLSearchParams(location.search);
search.value = params.get('q') ?? '';
if ([...method.options].some(option => option.value === params.get('method'))) method.value = params.get('method');
free.checked = params.get('free') === '1';
let database;
let comparisonRevision = 0;
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
function filter() {
  let visible = 0;
  const term = search.value.trim().toLowerCase();
  for (const card of cards) {
    const show = card.dataset.name.includes(term) && (!method.value || card.dataset[method.value.toLowerCase()] === 'yes') && (!free.checked || card.dataset.freetracking === 'yes');
    card.hidden = !show; if (show) visible++;
  }
  count.textContent = `${visible} of ${cards.length} apps. Alphabetical, not ranked. Unverified capabilities may still exist.`;
  empty.hidden = visible !== 0;
  const url = new URL(location.href);
  for (const [key, value] of Object.entries({ q: search.value.trim(), method: method.value, free: free.checked ? '1' : '' })) value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
  history.replaceState(null, '', url);
}
async function compare() {
  const revision = ++comparisonRevision;
  const picks = [...document.querySelectorAll('input[name="pick"]:checked')];
  if (!picks.length) { selected.hidden = true; return; }
  selected.hidden = false;
  selected.innerHTML = '<p role="status">Loading source-backed comparison…</p>';
  try {
    if (!database) {
      const response = await fetch('/data/apps.json');
      if (!response.ok) throw new Error('Data unavailable');
      database = await response.json();
    }
    if (revision !== comparisonRevision) return;
    const apps = picks.map(pick => database.apps.find(app => app.slug === pick.value));
    const dimensions = { text:'Whole-meal text', voice:'Voice', photo:'Photo', barcode:'Barcode', freeTracking:'Free personal logging', export:'Data export' };
    selected.innerHTML = `<h2>Side by side${picks.length === 1 ? ' · choose one more app' : ''}</h2><p class="small">Advertised features, not measured performance. Unknown does not mean absent. Scroll horizontally to see all columns; keyboard users can focus the table and use the arrow keys.</p><div class="table-scroll" role="region" aria-label="Selected apps" tabindex="0"><table><thead><tr><th scope="col">Capability</th>${apps.map(app => `<th scope="col"><a href="/compare/apps/${escape(app.slug)}/">${escape(app.name)}</a></th>`).join('')}</tr></thead><tbody>${Object.entries(dimensions).map(([key,label]) => `<tr><th scope="row">${label}</th>${apps.map(app => { const claim=app.claims[key]; return `<td><strong>${claim.value === 'yes' ? `Advertised · ${escape(claim.plan.replaceAll('_',' '))}` : claim.value === 'no' ? 'Not offered' : 'Not verified'}</strong><p class="small">${escape(claim.detail)}</p></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
  } catch { if (revision === comparisonRevision) selected.innerHTML = '<p role="alert">The comparison data could not load. Individual app profiles still contain the evidence.</p>'; }
}
form.addEventListener('input', filter);
form.addEventListener('submit', event => { event.preventDefault(); filter(); });
form.addEventListener('reset', () => setTimeout(filter));
document.querySelector('#app-grid').addEventListener('change', event => {
  if (event.target.name !== 'pick') return;
  if (document.querySelectorAll('input[name="pick"]:checked').length > 2) {
    event.target.checked = false;
    count.textContent = 'Choose up to two apps for a side-by-side comparison.';
  }
  compare();
});
filter();
