const form = document.querySelector('#case-filters');
const grid = document.querySelector('#case-grid');
const count = document.querySelector('#case-count');
const more = document.querySelector('#more-cases');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
let cases = [], shown = 20;
function render() {
  const term = document.querySelector('#case-search').value.toLowerCase().trim();
  const category = document.querySelector('#case-category').value;
  const variant = document.querySelector('#case-variant').value;
  const filtered = cases.filter(item => (!category || item.category === category) && (!variant || item.variant === variant) && `${item.input} ${item.category} ${item.ambiguityNote}`.toLowerCase().includes(term));
  count.textContent = `${filtered.length} inputs across ${new Set(filtered.map(item => item.scenarioId)).size} scenarios. Showing ${Math.min(shown, filtered.length)}.`;
  grid.innerHTML = filtered.slice(0, shown).map(item => `<article class="case-card"><p class="kicker">${escape(item.category.replaceAll('_',' '))} · ${escape(item.variant)}</p><h3>${escape(item.input)}</h3><p>${escape(item.ambiguityNote)}</p><details><summary>Expected food coverage and provenance</summary><ul>${item.expectedFoods.map(food => `<li>${escape(food.label)}</li>`).join('')}</ul>${item.excludedFoods.length ? `<p>Explicitly excluded: ${escape(item.excludedFoods.join(', '))}.</p>` : ''}<p>Original synthetic input. ${escape(item.id)} · ${escape(item.split)} partition. No independently verified nutrition truth.</p></details></article>`).join('') || '<p>No cases match. Try a wider search.</p>';
  more.hidden = shown >= filtered.length;
}
form.addEventListener('input', () => { shown=20; render(); });
form.addEventListener('submit', event => event.preventDefault());
more.addEventListener('click', () => { shown+=20; render(); });
fetch('/data/benchmark/cases.json').then(response => { if(!response.ok) throw new Error('Unable to load corpus'); return response.json(); }).then(data => { cases=data.cases; render(); }).catch(() => { count.textContent='The full explorer could not load. Example cases remain below; the corpus download is still available.'; });
