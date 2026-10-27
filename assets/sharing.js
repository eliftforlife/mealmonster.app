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
      buckets[key]++;
    }
    const browsing = request.error || request.fields.length === 0;
    groups.documented.querySelector('h2').textContent = browsing ? 'Browse the reviewed apps' : 'Documented matches';
    for (const key of Object.keys(groups)) groups[key].hidden = buckets[key] === 0;
    count.textContent = request.error ? 'All apps remain available below while you adjust the conflicting choices.' : browsing ? `${cards.length} apps, shown alphabetically. Choose features to see documented and unverified matches.` : `${buckets.documented} documented matches · ${buckets.check} need checking · ${buckets.different} describe a different fit. These are source matches, not rankings.`;
  }
  form.addEventListener('change', update);
  // Browser reset defaults can run after microtasks queued by the listener.
  // A timer reads the restored controls, rather than the previous conflict.
  const reset = () => { setTimeout(update, 0); };
  form.addEventListener('reset', reset);
  update();
  return { update, destroy() { form.removeEventListener('change', update); form.removeEventListener('reset', reset); } };
}

if (typeof document !== 'undefined') setupSharing(document);
