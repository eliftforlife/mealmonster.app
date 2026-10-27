import { requestedFields, sharingFit, sharingRequirements } from './sharing-model.js';

export function setupSharing(document) {
  const form = document.querySelector('#sharing-filters');
  const cards = [...document.querySelectorAll('[data-sharing-app]')];
  const count = document.querySelector('#sharing-count');
  const error = document.querySelector('#sharing-error');
  const groups = Object.fromEntries(['documented', 'check', 'different'].map(key => [key, document.querySelector(`#sharing-${key}`)]));
  if (!form || !count || !error || cards.length === 0 || Object.values(groups).some(group => !group)) return null;
  const valueKeys = Object.keys(sharingRequirements);
  function update() {
    const criteria = { goal: form.elements.namedItem('goal').value };
    for (const key of ['mealsHidden', 'weightPrivate', 'buddyNoOwnPlan', 'friendCalorieWidget']) criteria[key] = form.elements.namedItem(key).checked;
    const request = requestedFields(criteria);
    const diary = criteria.goal === 'mealDiary';
    form.elements.namedItem('mealsHidden').disabled = diary;
    document.querySelector('#diary-note').hidden = !diary;
    const preferences = ['mealsHidden', 'weightPrivate', 'buddyNoOwnPlan', 'friendCalorieWidget'].filter(key => criteria[key]).length;
    document.querySelector('#preference-count').textContent = preferences ? `(${preferences} selected)` : '(optional)';
    error.textContent = request.error ?? '';
    error.hidden = !request.error;
    const buckets = { documented: 0, check: 0, different: 0 };
    for (const card of cards) {
      const fields = Object.fromEntries(valueKeys.map(key => [key, card.getAttribute(`data-${key.toLowerCase()}`)]));
      const result = request.error ? { status: 'browse', uncertain: [], different: [] } : sharingFit(fields, criteria);
      const key = result.status === 'browse' ? 'documented' : result.status;
      groups[key].querySelector('.app-grid').append(card);
      const note = card.querySelector('[data-fit-note]');
      note.hidden = result.status === 'browse' || result.status === 'documented';
      note.textContent = result.status === 'check' ? `Still needs checking: ${result.uncertain.map(key => sharingRequirements[key]).join('; ')}.` : result.status === 'different' ? `The reviewed scope differs on: ${result.different.map(key => sharingRequirements[key]).join('; ')}.` : '';
      for (const row of card.querySelectorAll('[data-feature]')) row.hidden = !(request.fields.length && !request.error ? request.fields : ['calorieTotals', 'mealDiary', 'buddyNoOwnPlan']).includes(row.dataset.feature);
      buckets[key]++;
    }
    const browsing = request.error || request.fields.length === 0;
    groups.documented.querySelector('h2').textContent = browsing ? 'Explore the apps' : 'Matches your choices';
    document.querySelector('#sharing-empty').hidden = browsing || buckets.documented !== 0;
    groups.documented.hidden = false;
    for (const key of ['check', 'different']) groups[key].hidden = buckets[key] === 0;
    document.querySelector('#different-title').textContent = `Other apps (${buckets.different})`;
    count.textContent = request.error ? 'All apps are shown while you adjust your choices.' : browsing ? `${cards.length} apps · A–Z, not ranked` : `Matches: ${buckets.documented} · Needs confirmation: ${buckets.check} · Other apps: ${buckets.different}. Based on published descriptions, not app tests.`;
  }
  function change(event) {
    // A diary contains meal details: keep the visible controls compatible.
    if (event.target.name === 'goal' && form.elements.namedItem('goal').value === 'mealDiary') form.elements.namedItem('mealsHidden').checked = false;
    update();
  }
  form.addEventListener('change', change);
  const submit = event => event.preventDefault();
  form.addEventListener('submit', submit);
  // Browser reset defaults can run after microtasks queued by the listener.
  // A timer reads the restored controls, rather than the previous conflict.
  const reset = () => { setTimeout(update, 0); };
  form.addEventListener('reset', reset);
  update();
  return { update, destroy() { form.removeEventListener('change', change); form.removeEventListener('reset', reset); form.removeEventListener('submit', submit); } };
}

if (typeof document !== 'undefined') setupSharing(document);
