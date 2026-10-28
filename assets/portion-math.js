// Browser-only label arithmetic. No food lookup, inferred nutrients or cooking yield.
export const UNITS = Object.freeze({
  g: { factor: 1, family: 'mass', label: 'g' },
  oz: { factor: 28.349523125, family: 'mass', label: 'oz' },
  lb: { factor: 453.59237, family: 'mass', label: 'lb' },
  kg: { factor: 1000, family: 'mass', label: 'kg' },
  ml: { factor: 1, family: 'volume', label: 'mL' },
  l: { factor: 1000, family: 'volume', label: 'L' },
  item: { factor: 1, family: 'items', label: 'items' },
  serving: { factor: 1, family: 'servings', label: 'servings' },
});

export function parseAmount(value) {
  const text = String(value ?? '').trim();
  if (!text || text.length > 40) return null;
  let number;
  const mixed = text.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (mixed) {
    if (Number(mixed[3]) === 0 || Number(mixed[2]) >= Number(mixed[3])) return null;
    number = Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  } else if (fraction) {
    if (Number(fraction[2]) === 0) return null;
    number = Number(fraction[1]) / Number(fraction[2]);
  } else if (/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) {
    number = Number(text);
  } else return null;
  return Number.isFinite(number) && number >= 0 && number <= 1_000_000 ? number : null;
}

export function calculatePortion(input) {
  const errors = {};
  const servingAmount = parseAmount(input.servingAmount);
  const portionAmount = parseAmount(input.portionAmount);
  const calories = parseAmount(input.calories);
  if (servingAmount === null || servingAmount < 0.000001) errors.servingAmount = 'Copy the amount beside “Serving size” on your label. It must be more than zero.';
  if (portionAmount === null) errors.portionAmount = 'Type how much you ate. You can use 0.7 or 3/4.';
  if (calories === null) errors.calories = 'Copy the calories from your label here.';
  const servingUnit = Object.hasOwn(UNITS, input.servingUnit) ? UNITS[input.servingUnit] : null;
  const portionUnit = Object.hasOwn(UNITS, input.portionUnit) ? UNITS[input.portionUnit] : null;
  if (!servingUnit || !portionUnit) errors.portionUnit = 'Choose how you measured the food.';
  else if (servingUnit.family !== portionUnit.family) errors.portionUnit = 'Use weight on both sides, or count pieces on both sides. We can’t turn a weight into pieces.';
  if (!['raw', 'prepared'].includes(input.labelBasis)) errors.labelBasis = 'Check your package. Are these numbers for food as packaged or after cooking?';
  if (!['raw', 'prepared'].includes(input.portionBasis)) errors.portionBasis = 'Choose when you measured your food.';
  else if (input.labelBasis !== input.portionBasis && !errors.labelBasis) errors.portionBasis = input.labelBasis === 'raw'
    ? 'You picked cooked food, but this label is for food before cooking. Use the before-cooking weight or a label for cooked food.'
    : 'Your label is for cooked food, but your amount was measured before cooking. Use the cooked weight or a matching label.';
  const perServing = { calories };
  for (const key of ['protein', 'carbs', 'fat']) {
    perServing[key] = String(input[key] ?? '').trim() === '' ? null : parseAmount(input[key]);
    if (String(input[key] ?? '').trim() !== '' && perServing[key] === null) errors[key] = 'Type a number that is zero or more, or leave this blank.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  const servings = portionAmount * portionUnit.factor / (servingAmount * servingUnit.factor);
  if (!Number.isFinite(servings) || servings > 1_000_000) return { ok: false, errors: { portionAmount: 'That amount looks too big. Check your numbers and units.' } };
  const nutrients = Object.fromEntries(Object.entries(perServing).map(([key, value]) => [key, value === null ? null : value * servings]));
  if (Object.values(nutrients).some(value => value !== null && !Number.isFinite(value))) return { ok: false, errors: { portionAmount: 'Check the portion and serving amounts.' } };
  return {
    ok: true,
    foodName: String(input.foodName ?? '').trim().slice(0, 80) || 'Your food',
    servingAmount, portionAmount,
    servingUnit: input.servingUnit, portionUnit: input.portionUnit,
    convertedPortion: servings * servingAmount,
    basis: input.labelBasis, servings, perServing, nutrients,
  };
}

export function formatNumber(value, decimals = 1) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(value);
}

export function displayUnit(unit, amount) {
  const names = {
    g: ['gram', 'grams'], oz: ['ounce', 'ounces'], lb: ['pound', 'pounds'],
    kg: ['kilogram', 'kilograms'], ml: ['milliliter', 'milliliters'],
    l: ['liter', 'liters'], item: ['piece', 'pieces'], serving: ['serving', 'servings'],
  };
  return names[unit][amount === 1 ? 0 : 1];
}

export function cookingBasisForChoice(choice, labelBasis, portionBasis) {
  if (choice === 'no') {
    // Never erase a cooked-label choice that the person already supplied.
    return { labelBasis: labelBasis === 'prepared' ? 'prepared' : 'raw', portionBasis: 'raw' };
  }
  if (choice === 'yes') return { labelBasis, portionBasis };
  return { labelBasis: 'unknown', portionBasis: 'unknown' };
}

export function portionSummary(result) {
  if (!result.ok) throw new Error('A valid calculation is required.');
  const macroText = ['protein', 'carbs', 'fat']
    .filter(key => result.nutrients[key] !== null)
    .map(key => formatNumber(result.nutrients[key]) + ' g ' + key).join(', ');
  return result.foodName + ': I ate ' + formatNumber(result.portionAmount, 6) + ' ' + displayUnit(result.portionUnit, result.portionAmount)
    + '. That’s about ' + formatNumber(result.nutrients.calories) + ' calories'
    + (macroText ? '; ' + macroText : '') + '.\n'
    + 'Label: ' + formatNumber(result.perServing.calories) + ' calories for '
    + formatNumber(result.servingAmount, 6) + ' ' + displayUnit(result.servingUnit, result.servingAmount)
    + '. Food ' + (result.basis === 'raw' ? 'as packaged' : 'after cooking')
    + '. Label numbers are rounded.\nMeal Monster · mealmonster.app';
}
