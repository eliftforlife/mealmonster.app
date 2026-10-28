import { UNITS, calculatePortion, cookingBasisForChoice, displayUnit, formatNumber, portionSummary } from './portion-math.js';

const $ = id => document.getElementById(id);
const form = $('portion-form');
const fields = [...form.querySelectorAll('input:not([type="radio"]), select')];
const setText = (id, text) => { $(id).textContent = text; };
const examples = {
  cookies: { servingAmount: '2', servingUnit: 'item', calories: '140', portionAmount: '3', portionUnit: 'item' },
  turkey: { servingAmount: '4', servingUnit: 'oz', calories: '230', portionAmount: '0.7', portionUnit: 'lb' },
};
let currentResult = null;
let hasCalculated = false;

function updatePortionUnits(requestedUnit, clearIncompatible = true) {
  const family = UNITS[$('servingUnit').value].family;
  setText('portion-help', family === 'items' ? 'Half a piece? You can type 0.5 or 1/2.'
    : family === 'servings' ? 'Half the label amount? You can type 0.5 or 1/2.'
      : 'You can type a number like 0.7, 100 or 3/4. Choose the matching unit.');
  const allowed = Object.entries(UNITS).filter(([, definition]) => definition.family === family);
  const previous = requestedUnit ?? $('portionUnit').value;
  $('portionUnit').replaceChildren(...allowed.map(([value, definition]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = ({ g: 'grams (g)', oz: 'ounces (oz)', lb: 'pounds (lb)', kg: 'kilograms (kg)', ml: 'milliliters (mL)', l: 'liters (L)', item: 'pieces', serving: 'servings' })[value] ?? definition.label;
    return option;
  }));
  const compatible = allowed.some(([unit]) => unit === previous);
  $('portionUnit').value = compatible ? previous : $('servingUnit').value;
  if (!compatible && clearIncompatible) $('portionAmount').value = '';
}

function clearExampleState() {
  document.querySelectorAll('[data-example]').forEach(button => button.setAttribute('aria-pressed', 'false'));
}

function render() {
  const input = Object.fromEntries(fields.map(field => [field.id, field.value]));
  const cookingChoice = form.querySelector('input[name="cookingChoice"]:checked')?.value;
  Object.assign(input, cookingBasisForChoice(cookingChoice, input.labelBasis, input.portionBasis));
  const result = calculatePortion(input);
  if (!cookingChoice && !result.ok) {
    delete result.errors.labelBasis;
    delete result.errors.portionBasis;
    result.errors.cookingChoice = 'Choose Yes or No so we use the right food weight.';
  }
  if (cookingChoice === 'no' && input.labelBasis === 'prepared' && !result.ok) {
    delete result.errors.portionBasis;
    result.errors.cookingChoice = 'Your label is set to “After cooking.” Choose Yes to check that setting, or start over with the right label numbers.';
  }
  currentResult = hasCalculated && result.ok ? result : null;
  $('copy-fallback').hidden = true;
  setText('action-status', '');
  for (const field of fields) {
    const error = !hasCalculated || result.ok ? '' : result.errors[field.id] ?? '';
    field.setAttribute('aria-invalid', error ? 'true' : 'false');
    if ($(field.id + '-error')) setText(field.id + '-error', error);
  }
  const cookingError = hasCalculated ? result.errors?.cookingChoice ?? '' : '';
  setText('cookingChoice-error', cookingError);
  form.querySelectorAll('input[name="cookingChoice"]').forEach(radio => radio.setAttribute('aria-invalid', String(Boolean(cookingError))));
  $('no-cook-note').hidden = cookingChoice !== 'no';
  $('result-content').hidden = !currentResult;
  $('empty-result').hidden = Boolean(currentResult);
  $('result-actions').hidden = !currentResult;
  $('copy-result').disabled = !currentResult;
  $('download-card').disabled = !currentResult;
  if (!currentResult) {
    $('empty-result').querySelector('h2').textContent = hasCalculated ? 'Let’s check one thing.' : 'Your answer will show here.';
    setText('result-message', !hasCalculated ? 'Fill in the two steps, then tap “Show my calories.”' : fields.map(field => result.errors[field.id]).find(Boolean) || Object.values(result.errors)[0]);
    return;
  }
  setText('result-food', result.foodName);
  $('result-food').hidden = !input.foodName.trim();
  setText('result-portion', formatNumber(result.portionAmount, 6) + ' ' + displayUnit(result.portionUnit, result.portionAmount));
  const conversion = result.servingUnit === result.portionUnit ? '' : formatNumber(result.portionAmount, 6) + ' ' + displayUnit(result.portionUnit, result.portionAmount) + ' = ' + formatNumber(result.convertedPortion, 6) + ' ' + displayUnit(result.servingUnit, result.convertedPortion) + '. ';
  setText('result-basis', conversion + (result.basis === 'raw' ? 'Both amounts use the food as packaged.' : 'Both amounts use the food after cooking.'));
  setText('result-calories', formatNumber(result.nutrients.calories));
  setText('result-servings', 'You ate ' + formatNumber(result.servings, 4) + ' times the amount on the label.');
  $('macro-results').hidden = ['protein', 'carbs', 'fat'].every(key => result.nutrients[key] === null);
  for (const key of ['protein', 'carbs', 'fat']) setText('result-' + key, result.nutrients[key] === null ? '—' : formatNumber(result.nutrients[key]) + ' g');
  setText('result-equation', 'We multiplied ' + formatNumber(result.perServing.calories) + ' calories by ' + formatNumber(result.servings, 4) + '.');
}

function loadExample(name) {
  const example = examples[name];
  fields.filter(field => field.tagName === 'INPUT').forEach(field => { field.value = ''; });
  for (const id of ['calories', 'servingAmount', 'portionAmount']) $(id).placeholder = example[id];
  $('servingUnit').value = example.servingUnit;
  updatePortionUnits(example.portionUnit, false);
  $('labelBasis').value = 'unknown';
  $('portionBasis').value = 'unknown';
  form.querySelectorAll('input[name="cookingChoice"]').forEach(radio => { radio.checked = false; });
  $('cooking-fields').hidden = true;
  hasCalculated = false;
  $('more-details').open = false;
  document.querySelectorAll('[data-example]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.example === name)));
  render();
}

form.addEventListener('input', event => { clearExampleState(event.target.id); hasCalculated = false; render(); });
form.addEventListener('change', event => {
  clearExampleState(event.target.id);
  hasCalculated = false;
  if (event.target.id === 'servingUnit') updatePortionUnits();
  if (event.target.name === 'cookingChoice') $('cooking-fields').hidden = event.target.value !== 'yes';
  render();
});
function goToResult() {
  hasCalculated = true;
  render();
  if (!currentResult) {
    const invalid = form.querySelector('[aria-invalid="true"]');
    const details = invalid?.closest('details');
    if (details) details.open = true;
    invalid?.focus();
  }
  else if (window.matchMedia('(max-width: 680px)').matches) {
    document.querySelector('.result-panel').scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}
$('calculate').addEventListener('click', goToResult);
form.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.tagName === 'INPUT') { event.preventDefault(); goToResult(); }
});
document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => loadExample(button.dataset.example)));
$('clear').addEventListener('click', () => {
  loadExample('cookies');
  $('calories').focus();
});
$('copy-result').addEventListener('click', async () => {
  if (!currentResult) return;
  const text = portionSummary(currentResult);
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    setText('action-status', 'Copied! You can paste your answer into a message or your notes.');
  } catch {
    $('copy-fallback').value = text;
    $('copy-fallback').hidden = false;
    $('copy-fallback').focus();
    $('copy-fallback').select();
    setText('action-status', 'Automatic copying is unavailable. Select and copy the text below.');
  }
});

function cardText(context, text, x, y, maxWidth, fontSize, weight = 600) {
  let size = fontSize;
  const font = () => weight + ' ' + size + 'px system-ui, sans-serif';
  context.font = font();
  while (context.measureText(text).width > maxWidth && size > 17) { size -= 1; context.font = font(); }
  let fitted = text;
  while (context.measureText(fitted).width > maxWidth && fitted.length > 1) fitted = fitted.slice(0, -2) + '…';
  context.fillText(fitted, x, y);
}

$('download-card').addEventListener('click', () => {
  if (!currentResult) return;
  const result = currentResult;
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 900;
  const context = canvas.getContext('2d');
  if (!context) { setText('action-status', 'Image export is unavailable in this browser. Use Copy result instead.'); return; }
  const style = getComputedStyle(document.documentElement);
  const color = token => style.getPropertyValue(token).trim();
  context.fillStyle = color('--canvas'); context.fillRect(0, 0, 1200, 900);
  context.fillStyle = color('--surface'); context.fillRect(44, 44, 1112, 812);
  context.fillStyle = color('--slate');
  cardText(context, 'MEAL MONSTER  /  MY CALORIES', 82, 105, 1036, 23, 700);
  context.fillStyle = color('--ink');
  cardText(context, result.foodName, 82, 180, 1036, 45, 800);
  context.fillStyle = color('--ink2');
  cardText(context, 'I ate ' + formatNumber(result.portionAmount, 6) + ' ' + displayUnit(result.portionUnit, result.portionAmount), 82, 232, 1036, 27);
  context.fillStyle = color('--ink');
  cardText(context, 'About ' + formatNumber(result.nutrients.calories) + ' calories', 74, 402, 1036, 100, 800);
  context.fillStyle = color('--ink2');
  cardText(context, 'Based on the numbers I entered from the food label', 82, 457, 1036, 27, 500);
  const hasMacros = ['protein', 'carbs', 'fat'].some(key => result.nutrients[key] !== null);
  context.fillStyle = color('--sky2'); context.fillRect(82, 505, 1036, 155);
  if (hasMacros) ['protein', 'carbs', 'fat'].forEach((key, index) => {
    const x = 111 + index * 342;
    context.fillStyle = color('--ink2');
    cardText(context, key.toUpperCase(), x, 554, 285, 20, 600);
    context.fillStyle = color('--ink');
    cardText(context, result.nutrients[key] === null ? 'Not provided' : formatNumber(result.nutrients[key]) + ' g', x, 615, 285, 43, 700);
  });
  else {
    context.fillStyle = color('--ink2');
    cardText(context, 'THE LABEL SAYS', 111, 552, 970, 20);
    context.fillStyle = color('--ink');
    cardText(context, formatNumber(result.perServing.calories) + ' calories for ' + formatNumber(result.servingAmount, 6) + ' ' + displayUnit(result.servingUnit, result.servingAmount), 111, 616, 970, 40, 700);
  }
  context.fillStyle = color('--slate-dark');
  const cardDetail = hasMacros
    ? 'Label: ' + formatNumber(result.perServing.calories) + ' calories for ' + formatNumber(result.servingAmount, 6) + ' ' + displayUnit(result.servingUnit, result.servingAmount)
    : 'My amount: ' + formatNumber(result.portionAmount, 6) + ' ' + displayUnit(result.portionUnit, result.portionAmount);
  cardText(context, cardDetail, 82, 719, 1036, 26, 600);
  context.fillStyle = color('--ink2');
  cardText(context, result.basis === 'raw' ? 'Uses the food as packaged. Label numbers are rounded.' : 'Uses the food after cooking. Label numbers are rounded.', 82, 767, 1036, 21, 400);
  cardText(context, 'mealmonster.app', 82, 815, 1036, 24, 700);
  try {
    canvas.toBlob(blob => {
      if (!blob) { setText('action-status', 'Image export failed. Use Copy result instead.'); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'meal-monster-portion.png';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setText('action-status', 'Your result card is ready. Check your downloads.');
    }, 'image/png');
  } catch { setText('action-status', 'Image export is unavailable. Use Copy result instead.'); }
});

$('calculate').disabled = false;
updatePortionUnits('item', false);
render();
