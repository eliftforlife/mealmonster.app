const form = document.querySelector('#compare-filters');
const cards = [...document.querySelectorAll('[data-app]')];
const search = document.querySelector('#app-search');
const method = document.querySelector('#method-filter');
const methodButtons = [...document.querySelectorAll('[data-method]')];
const free = document.querySelector('#free-filter');
const count = document.querySelector('#app-count');
const empty = document.querySelector('#empty-apps');
const selected = document.querySelector('#selected-compare');
const tray = document.querySelector('#compare-tray');
const chips = document.querySelector('#selection-chips');
const showComparison = document.querySelector('#show-comparison');
const params = new URLSearchParams(location.search);
search.value = params.get('q') ?? '';
if (methodButtons.some(button => button.dataset.method === params.get('method'))) method.value = params.get('method');
free.checked = params.get('free') === '1';
let database;
let comparisonRevision = 0;
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const picks = () => [...document.querySelectorAll('input[name="pick"]:checked')];
const appName = pick => pick.closest('[data-app]').querySelector('h2').textContent;
function filter() {
  let visible = 0;
  const term = search.value.trim().toLowerCase();
  for (const card of cards) {
    const show = card.dataset.name.includes(term) && (!method.value || card.dataset[method.value.toLowerCase()] === 'yes') && (!free.checked || card.dataset.freetracking === 'yes');
    card.hidden = !show; if (show) visible++;
  }
  for (const button of methodButtons) button.setAttribute('aria-pressed', String(button.dataset.method === method.value));
  count.textContent = visible === cards.length ? `${visible} apps` : `${visible} of ${cards.length} apps`;
  empty.hidden = visible !== 0;
  const url = new URL(location.href);
  for (const [key, value] of Object.entries({ q: search.value.trim(), method: method.value, free: free.checked ? '1' : '' })) value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
  history.replaceState(null, '', url);
}
function updateSelection() {
  const chosen = picks();
  comparisonRevision++;
  selected.hidden = true;
  tray.hidden = chosen.length === 0;
  document.querySelector('#selection-count').textContent = chosen.length === 1 ? '1 of 2 selected · Choose one more app' : '2 apps ready to compare';
  chips.innerHTML = chosen.map(pick => `<button type="button" class="selection-chip" data-remove="${escape(pick.value)}" aria-label="Remove ${escape(appName(pick))} from comparison">${escape(appName(pick))}<span aria-hidden="true">×</span></button>`).join('');
  showComparison.disabled = chosen.length !== 2;
  for (const card of cards) card.classList.toggle('is-selected', card.querySelector('input[name="pick"]').checked);
}
async function compare() {
  const chosen = picks();
  if (chosen.length !== 2) return;
  const revision = ++comparisonRevision;
  selected.hidden = false;
  selected.innerHTML = '<p role="status">Loading comparison…</p>';
  showComparison.disabled = true;
  try {
    if (!database) {
      const response = await fetch('/data/apps.json');
      if (!response.ok) throw new Error('Data unavailable');
      database = await response.json();
    }
    if (revision !== comparisonRevision) return;
    const apps = chosen.map(pick => database.apps.find(app => app.slug === pick.value));
    if (apps.some(app => !app)) throw new Error('App record unavailable');
    const dimensions = { text:'Type a meal', voice:'Voice', photo:'Food photo', barcode:'Barcode', freeTracking:'Free basic logging', export:'Data export' };
    const planNames = { subscription: 'Paid', free: 'Free', mixed: 'Plan varies', not_verified: 'Plan unclear', not_applicable: '' };
    selected.innerHTML = `<div class="section-heading"><h2 id="comparison-title" tabindex="-1">${apps.map(app => escape(app.name)).join(' vs ')}</h2><button type="button" class="quiet-button" data-close-comparison>Close</button></div><div class="table-scroll" role="region" aria-label="Selected apps" tabindex="0"><table><thead><tr><th scope="col">Feature</th>${apps.map(app => `<th scope="col"><a href="/compare/apps/${escape(app.slug)}/">${escape(app.name)}</a></th>`).join('')}</tr></thead><tbody>${Object.entries(dimensions).map(([key,label]) => `<tr><th scope="row">${label}</th>${apps.map(app => {
      const claim = app.claims[key];
      const source = app.sources.find(source => source.id === claim.source);
      const label = claim.value === 'yes' ? `Listed${planNames[claim.plan] ? ` · ${planNames[claim.plan]}` : ''}` : claim.value === 'no' ? 'Not offered' : 'Unconfirmed';
      return `<td><span class="claim claim-${escape(claim.value)}">${label}</span><details class="table-detail"><summary>Details</summary><p class="small">${escape(claim.detail)}${source ? ` <a href="${escape(source.url)}" rel="noopener">Publisher source</a>` : ''}</p></details></td>`;
    }).join('')}</tr>`).join('')}</tbody></table></div><p class="small">For eligible offers and current access, check each app before subscribing.</p>`;
  } catch {
    if (revision === comparisonRevision) selected.innerHTML = '<p role="alert">The comparison could not load. Individual app profiles still contain the evidence.</p><div class="page-actions"><button type="button" class="primary" data-retry-comparison>Try again</button><button type="button" class="quiet-button" data-close-comparison>Back to apps</button></div>';
  } finally {
    if (revision === comparisonRevision) {
      showComparison.disabled = picks().length !== 2;
      selected.scrollIntoView?.({ behavior: 'instant', block: 'start' });
      selected.querySelector('h2')?.focus({ preventScroll: true });
    }
  }
}
form.addEventListener('input', filter);
form.addEventListener('submit', event => { event.preventDefault(); filter(); });
form.addEventListener('reset', () => setTimeout(() => { method.value = ''; filter(); }));
for (const button of methodButtons) button.addEventListener('click', () => { method.value = button.dataset.method; filter(); });
document.querySelector('#app-grid').addEventListener('change', event => {
  if (event.target.name !== 'pick') return;
  if (picks().length > 2) {
    event.target.checked = false;
    count.textContent = 'Choose up to two apps. Remove one from your selection to try another.';
    return;
  }
  updateSelection();
});
chips.addEventListener('click', event => {
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  const pick = picks().find(pick => pick.value === button.dataset.remove);
  if (pick) pick.checked = false;
  updateSelection();
  if (!tray.hidden) chips.querySelector('button')?.focus();
});
document.querySelector('#clear-selection').addEventListener('click', () => {
  const chosen = picks();
  for (const pick of chosen) pick.checked = false;
  updateSelection();
  const first = chosen[0];
  if (first && !first.closest('[data-app]').hidden) first.focus();
  else search.focus();
});
showComparison.addEventListener('click', compare);
selected.addEventListener('click', event => {
  if (event.target.closest('[data-close-comparison]')) { selected.hidden = true; showComparison.focus(); }
  else if (event.target.closest('[data-retry-comparison]')) compare();
});
filter();
