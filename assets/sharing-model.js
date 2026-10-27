export const sharingRequirements = {
  calorieTotals: 'daily food-calorie totals', mealDiary: 'meal diaries',
  mealsHidden: 'meal details kept out', weightPrivate: 'weight kept private',
  buddyNoOwnPlan: 'no separate paid plan for the buddy', friendCalorieWidget: 'friend calorie numbers in a widget'
};

export function requestedFields(criteria = {}) {
  if (!['any', 'calorieTotals', 'mealDiary'].includes(criteria.goal ?? 'any')) return { error: 'Choose one of the listed sharing goals.', fields: [] };
  if (criteria.goal === 'mealDiary' && criteria.mealsHidden) return { error: 'Meal-diary sharing and keeping meal details out are different choices. Clear one to continue.', fields: [] };
  const fields = criteria.goal && criteria.goal !== 'any' ? [criteria.goal] : [];
  for (const field of ['mealsHidden', 'weightPrivate', 'buddyNoOwnPlan', 'friendCalorieWidget']) if (criteria[field] === true) fields.push(field);
  return { error: null, fields };
}

export function sharingFit(fields, criteria = {}) {
  const requested = requestedFields(criteria);
  if (requested.error) return { status: 'conflict', error: requested.error, uncertain: [], different: [] };
  if (!requested.fields.length) return { status: 'browse', error: null, uncertain: [], different: [] };
  const uncertain = []; const different = [];
  for (const key of requested.fields) {
    const value = typeof fields?.[key] === 'string' ? fields[key] : fields?.[key]?.value;
    if (value === 'no') different.push(key);
    else if (value !== 'yes') uncertain.push(key);
  }
  return { status: different.length ? 'different' : uncertain.length ? 'check' : 'documented', error: null, uncertain, different };
}
