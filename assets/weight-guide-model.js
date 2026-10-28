// Label wording, not the food name, determines the preparation basis.
// No nutrition lookup, cooking factor, medical target or numeric estimate.
export const LABELS = Object.freeze({
  raw: { title: '“Raw”, “dry” or “uncooked”', short: 'Raw / dry / uncooked' },
  cooked: { title: '“Cooked”', short: 'Cooked' },
  prepared: { title: '“As prepared”', short: 'As prepared' },
  drained: { title: '“Drained”', short: 'Drained' },
  packaged: { title: '“As sold” or “as packaged”', short: 'As sold / as packaged' },
  unknown: { title: 'I can’t find these words', short: 'Label wording unclear' },
});

export const SOURCES = Object.freeze({
  label: { name: 'U.S. food-label rules: food state and prepared columns', url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-A/section-101.9' },
  pasta: { name: 'Barilla: dry pasta serving guidance', url: 'https://www.barilla.com/en-us/help-with/storage-reheat-and-product-faqs/general-product-faqs' },
  tuna: { name: 'StarKist: a label that specifies drained tuna', url: 'https://starkist.com/product/chunk-light-tuna-in-water-can/' },
  edible: { name: 'USDA: edible portions and uneaten material', url: 'https://fdc.nal.usda.gov/Foundation_Foods_Documentation/' },
});

export function weightChoices(label) {
  if (label === 'drained') return [
    { value: 'drained', title: 'After draining, before any further cooking' },
    { value: 'with-liquid', title: 'With the liquid still in it' },
    { value: 'unknown', title: 'I’m not sure' },
  ];
  if (label === 'packaged') return [
    { value: 'packaged', title: 'Straight from the package' },
    { value: 'changed-state', title: 'After cooking, draining or adding food' },
    { value: 'unknown', title: 'I’m not sure' },
  ];
  if (['raw', 'cooked', 'prepared'].includes(label)) return [
    { value: 'raw', title: 'Before cooking, while raw or dry' },
    { value: 'cooked', title: label === 'prepared' ? 'After preparing or cooking' : 'After cooking' },
    { value: 'unknown', title: 'I’m not sure' },
  ];
  return [];
}

function answer(status, title, body, steps, sources = ['label']) {
  return { status, title, body, steps, sources };
}

export function assessWeight(input = {}) {
  const { label, weighed, changes, cookedAmount, followedRecipe } = input;
  if (!Object.hasOwn(LABELS, label)) return { status: 'incomplete', field: 'label' };
  if (label === 'unknown') return answer('unclear', 'I can’t tell from this label yet.',
    'The food name alone does not tell us which weight the nutrition numbers use.', [
      'Look beside the serving size, above each column and in the small notes.',
      'Check the package directions or the maker’s guidance. Keep the exact product and package size in mind.',
      'If it is still unclear, ask the maker before pairing these numbers with a weight.',
    ]);
  if (!weightChoices(label).some(choice => choice.value === weighed)) return { status: 'incomplete', field: 'weighed' };
  if (weighed === 'unknown') return answer('unclear', 'First check when you weighed it.',
    'The label and your food need to describe the same state.', [
      'Check whether your amount was measured before cooking, after cooking or after draining.',
      'If you only know a cooked amount, look for an entry that describes that cooked food.',
    ]);
  if (['cooked', 'prepared'].includes(label) && (cookedAmount !== true || (label === 'prepared' && followedRecipe !== true))) {
    return answer('unclear', 'Check the prepared serving first.',
      'A cooked or “as prepared” column needs a matching amount of finished food. Don’t assume every gram number on the package is a cooked weight.', [
        'Find a serving amount for the finished food, such as “1 cup prepared”.',
        'For “as prepared”, check which added ingredients and amounts the directions include.',
        'If the finished-food amount is missing or unclear, check with the maker or work from the recipe ingredients.',
      ]);
  }
  const expected = { raw: 'raw', cooked: 'cooked', prepared: 'cooked', drained: 'drained', packaged: 'packaged' }[label];
  if (weighed !== expected) {
    if (label === 'raw') return answer('mismatch', 'Use the raw or dry weight.',
      'Your label is for food before cooking. Your amount was measured after cooking, so the two do not match.', [
        'Use a weight recorded before cooking with these label numbers.',
        'Already cooked? Find a matching cooked-food entry, or use a measured recipe that accounts for added ingredients and anything removed.',
        'There is no single cooked-to-raw number that fits every batch.',
      ], ['label', 'pasta']);
    if (['cooked', 'prepared'].includes(label)) return answer('mismatch', 'Use the finished-food amount.',
      'You chose a label for cooked or prepared food, but weighed your food before cooking.', [
        'Measure the finished food using the serving amount for that same column.',
        'Or choose a raw/dry label that matches the amount you already measured.',
      ]);
    if (label === 'drained') return answer('mismatch', 'Use the drained food weight.',
      'The label describes food after the packing liquid is removed. A weight that includes that liquid does not match.', [
        'Drain it as the package describes, then weigh the food without the can or bowl.',
        'Keep the drained weight separate from the total net weight printed on the front.',
      ], ['label', 'tuna']);
    return answer('mismatch', 'Use the food as it came in the package.',
      '“As sold” describes the food you bought. It does not always mean raw: some packaged food is already cooked.', [
        'Pair these label numbers with a matching amount of the food as sold.',
        'If cooking or draining changed it, use a matching prepared entry or your own measured recipe.',
      ]);
  }
  if (!['none', 'changed', 'unknown'].includes(changes)) return { status: 'incomplete', field: 'changes' };
  if (changes !== 'none') return answer('unclear', changes === 'changed' ? 'The food changed. Check the details.' : 'Check what was added or removed.',
    'Matching the cooking stage is only one part of matching the food.', [
      'Log extra ingredients separately when the label does not already include them.',
      'Removing skin, bones or drained fat can change which food entry fits. Use a matching description; don’t guess a removal percentage.',
      'Weigh the food without the bowl or packaging. For an edible-portion entry, exclude uneaten material.',
    ], ['label', 'edible']);
  const matches = {
    raw: ['Use the raw or dry weight.', 'You weighed before cooking, which matches the label words you chose.', 'Use these label numbers with the amount measured before cooking.'],
    cooked: ['Use the cooked amount.', 'You chose a cooked serving amount and weighed after cooking.', 'Use the finished-food amount for the same cooked nutrition column.'],
    prepared: ['Use the prepared amount.', 'Your finished amount and recipe match the prepared serving you confirmed.', 'Use the finished-food serving and the ingredients included by those directions.'],
    drained: ['Use the drained food weight.', 'You weighed after draining, which matches the label words you chose.', 'Use the drained food amount without the packing liquid, can or bowl.'],
    packaged: ['Use the amount from the package.', 'Your food is in the same state as the label describes.', 'Use the amount of food as sold, without its packaging. Frozen or ready-cooked food may already be cooked.'],
  }[label];
  return answer('match', matches[0], matches[1], [matches[2],
    'Take the serving amount and calories from the same column. Match its units and food description too.',
    'Leave the bowl and packaging out of the food weight. For an edible-portion entry, leave out uneaten bones; match the skin and fat description too.',
  ], label === 'drained' ? ['label', 'tuna', 'edible'] : ['label', 'edible']);
}
