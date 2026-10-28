import { LABELS, SOURCES, assessWeight, weightChoices } from './weight-guide-model.js';

const $ = id => document.getElementById(id);
const state = { step: 0, label: '', weighed: '', changes: '', cookedAmount: false, followedRecipe: false };
const stepIds = ['label-step', 'weight-step', 'changes-step'];
const changeChoices = [
  { value: 'none', title: 'No, it is the same food' },
  { value: 'changed', title: 'Yes, I added or removed something' },
  { value: 'unknown', title: 'I’m not sure' },
];

function options(container, name, choices) {
  const labels = choices.map(choice => {
    const label = document.createElement('label');
    label.className = 'weight-option';
    const input = document.createElement('input');
    input.type = 'radio'; input.name = name; input.value = choice.value;
    input.checked = state[name] === choice.value;
    const text = document.createElement('span'); text.textContent = choice.title;
    label.append(input, text);
    return label;
  });
  $(container).replaceChildren(...labels);
}

function showQuestions(focus = false) {
  $('weight-answer').hidden = true;
  $('weight-questions').hidden = false;
  $('prepared-checks').hidden = !['cooked', 'prepared'].includes(state.label);
  $('recipe-check-label').hidden = state.label !== 'prepared';
  $('cookedAmount').checked = state.cookedAmount;
  $('followedRecipe').checked = state.followedRecipe;
  $('changes-help').textContent = state.label === 'prepared'
    ? 'Beyond the recipe directions: did you add or leave out food, remove skin or bones, or drain fat?'
    : 'Think about added food, or skin, bones or fat you removed.';
  for (const [index, id] of stepIds.entries()) {
    $(id).hidden = index !== state.step;
    const item = document.querySelector('[data-progress="' + index + '"]');
    if (index === state.step) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  }
  $('guide-back').hidden = state.step === 0;
  const field = ['label', 'weighed', 'changes'][state.step];
  $('guide-next').disabled = !state[field];
  const baseResult = assessWeight({ ...state, changes: '' });
  $('guide-next').textContent = state.step === 2 || state.label === 'unknown' || (state.step === 1 && baseResult.status !== 'incomplete')
    ? 'Show my answer →' : 'Next →';
  $('guide-reset').hidden = !state.label;
  if (focus) $(stepIds[state.step]).querySelector('legend').focus();
}

function showAnswer(result) {
  if (result.status === 'incomplete') return;
  $('weight-questions').hidden = true;
  $('weight-answer').hidden = false;
  document.querySelectorAll('[data-progress]').forEach(item => item.removeAttribute('aria-current'));
  $('answer-kicker').textContent = ({ match: 'THE PREPARATION MATCHES', mismatch: 'USE A MATCHING WEIGHT', unclear: 'ONE THING TO CHECK' })[result.status];
  $('answer-title').textContent = result.title;
  $('answer-body').textContent = result.body;
  $('answer-steps').replaceChildren(...result.steps.map(text => {
    const li = document.createElement('li'); li.textContent = text; return li;
  }));
  const choices = [['Label', LABELS[state.label].short]];
  if (state.weighed) choices.push(['Weighed', weightChoices(state.label).find(choice => choice.value === state.weighed)?.title ?? 'Not supplied']);
  if (state.changes) choices.push(['Changes', changeChoices.find(choice => choice.value === state.changes).title]);
  if (['cooked', 'prepared'].includes(state.label)) choices.push(['Finished serving', state.cookedAmount ? 'Confirmed' : 'Not confirmed']);
  if (state.label === 'prepared') choices.push(['Recipe followed', state.followedRecipe ? 'Confirmed' : 'Not confirmed']);
  $('answer-summary').replaceChildren(...choices.map(([key, value]) => {
    const row = document.createElement('div'); const dt = document.createElement('dt'); const dd = document.createElement('dd');
    dt.textContent = key; dd.textContent = value; row.append(dt, dd); return row;
  }));
  $('answer-sources').replaceChildren(...result.sources.map(key => {
    const li = document.createElement('li'); const a = document.createElement('a');
    a.href = SOURCES[key].url; a.textContent = SOURCES[key].name + ' ↗'; a.rel = 'noopener'; li.append(a); return li;
  }));
  $('portion-next').hidden = result.status !== 'match';
  $('answer-title').focus();
}

$('weight-questions').addEventListener('change', event => {
  const target = event.target;
  if (target.name === 'label') {
    state.label = target.value;
    state.weighed = ''; state.changes = ''; state.cookedAmount = false; state.followedRecipe = false;
    options('weighed-options', 'weighed', weightChoices(state.label));
    options('changes-options', 'changes', changeChoices);
  } else if (target.name === 'weighed') {
    state.weighed = target.value; state.changes = '';
    options('changes-options', 'changes', changeChoices);
  } else if (target.name === 'changes') state.changes = target.value;
  else if (['cookedAmount', 'followedRecipe'].includes(target.id)) {
    state[target.id] = target.checked;
    // Changing label confirmations invalidates the later selections.
    state.weighed = ''; state.changes = '';
    options('weighed-options', 'weighed', weightChoices(state.label));
    options('changes-options', 'changes', changeChoices);
  }
  showQuestions();
});
$('guide-next').addEventListener('click', () => {
  if ($('guide-next').disabled) return;
  if (state.step === 0 && state.label !== 'unknown') { state.step = 1; showQuestions(true); return; }
  const result = assessWeight(state);
  if (result.status === 'incomplete' && result.field === 'changes') { state.step = 2; showQuestions(true); return; }
  showAnswer(result);
});
$('guide-back').addEventListener('click', () => { state.step = Math.max(0, state.step - 1); showQuestions(true); });
$('edit-answers').addEventListener('click', () => { state.step = 0; showQuestions(true); });
$('guide-reset').addEventListener('click', () => {
  Object.assign(state, { step: 0, label: '', weighed: '', changes: '', cookedAmount: false, followedRecipe: false });
  options('label-options', 'label', Object.entries(LABELS).map(([value, definition]) => ({ value, title: definition.title })));
  options('weighed-options', 'weighed', []);
  options('changes-options', 'changes', changeChoices);
  $('answer-summary').closest('details').open = false;
  showQuestions(true);
});

options('label-options', 'label', Object.entries(LABELS).map(([value, definition]) => ({ value, title: definition.title })));
options('changes-options', 'changes', changeChoices);
$('guide-interactive').hidden = false;
showQuestions();
