// Free calculators (11-06). Everything runs in the browser: nothing typed here is sent anywhere.
// Mifflin-St Jeor for BMR. Calorie floors 1,200 (women) and 1,500 (men). No weight-loss numbers are shown for a low BMI or under 18. Estimates only.
(() => {
  const f = document.getElementById('calc'), out = document.getElementById('calc-out');
  if (!f || !out) return;
  const tool = f.dataset.tool, val = n => (f.elements[n] ? f.elements[n].value : ''), N = n => parseFloat(val(n));
  const round = (x, s) => Math.round(x / s) * s, fmt = x => Math.round(x).toLocaleString('en-US');
  const units = () => val('units');
  const sync = () => { const m = units() === 'metric'; f.querySelectorAll('[data-us]').forEach(e => { e.hidden = m; }); f.querySelectorAll('[data-metric]').forEach(e => { e.hidden = !m; }); };
  f.addEventListener('change', e => { if (e.target.name === 'units') sync(); }); sync();
  const stat = (b, s, big) => `<div class="c-stat${big ? ' big' : ''}"><b>${b}</b><span>${s}</span></div>`;
  const note = t => `<p class="c-note">${t}</p>`;
  f.addEventListener('submit', e => {
    e.preventDefault();
    const m = units() === 'metric', age = N('age'), sex = val('sex');
    const kg = m ? N('kg') : N('lb') / 2.20462, cm = m ? N('cm') : ((N('ft') || 0) * 12 + (N('in') || 0)) * 2.54;
    if (!(kg > 30 && kg < 300 && cm > 120 && cm < 240 && age)) { out.innerHTML = note('Check your height, weight and age, then try again.'); out.hidden = false; return; }
    if (age < 18) { out.innerHTML = note('This calculator is for adults 18 and over. Calorie needs change a lot while you&#39;re growing, so a doctor or dietitian is the right place to ask.'); out.hidden = false; return; }
    const bmr = 10 * kg + 6.25 * cm - 5 * age + (sex === 'm' ? 5 : -161), act = parseFloat(val('activity')) || 1.375, tdee = bmr * act, bmi = kg / ((cm / 100) ** 2), floor = sex === 'm' ? 1500 : 1200;
    const low = bmi < 18.5, lowMsg = 'Your weight is on the low side for your height, so we don&#39;t show a calorie deficit. A doctor or dietitian can help you set a goal.';
    let h = '';
    if (tool === 'bmr') h = stat(fmt(round(bmr, 10)), 'calories a day at complete rest', true) + stat(fmt(round(tdee, 10)), 'calories a day with your activity') + note('BMR is what your body burns before you move. It isn&#39;t a target to eat.');
    if (tool === 'tdee') h = stat(fmt(round(tdee, 10)), 'calories a day to stay about the same weight', true) + stat(fmt(round(bmr, 10)), 'BMR, at complete rest') + note('This is a starting estimate. Track your weight for 2 to 3 weeks and adjust from what actually happens.');
    if (tool === 'deficit') {
      if (low) h = stat(fmt(round(tdee, 10)), 'calories a day to stay about the same weight', true) + note(lowMsg);
      else { const d = parseFloat(val('rate')) || 250, t = tdee - d, cal = Math.max(floor, round(t, 10)), capped = t < floor;
        h = stat(fmt(cal), 'calories a day', true) + stat(fmt(round(tdee, 10)), 'maintenance calories') + stat(fmt(round(tdee - cal, 10)), 'calorie deficit a day') + (capped ? note(`We stopped at ${fmt(floor)} calories, the lowest number this calculator shows. Going lower is something to do with a doctor.`) : '') + note('A smaller deficit is usually easier to keep up. Real results vary from person to person.'); }
    }
    if (tool === 'protein') { const a = parseFloat(val('activity')) || 1.375, lo = a >= 1.55 ? 1.4 : 1.2, hi = a >= 1.55 ? 2 : 1.6;
      h = stat(`${fmt(round(kg * lo, 5))}–${fmt(round(kg * hi, 5))} g`, 'protein a day if you train regularly', true) + stat(`${fmt(round(kg * .8, 5))} g`, 'the basic daily minimum (RDA)') + note('The RDA is 0.8 g per kg of body weight. Sports nutrition guidance for people who train runs about 1.2 to 2.0 g per kg. If you have kidney disease, ask your doctor first.'); }
    if (tool === 'macro') { const g = val('goal'); let cal = tdee, msg = '';
      if (g === 'lose') { if (low) msg = lowMsg; else { cal = Math.max(floor, tdee - 300); } } if (g === 'gain') cal = tdee + 250;
      cal = round(cal, 10); const p = round(kg * 1.6, 5), fat = round(cal * .28 / 9, 5), carbs = Math.max(0, round((cal - p * 4 - fat * 9) / 4, 5));
      h = stat(fmt(cal), 'calories a day', true) + stat(`${p} g`, 'protein') + stat(`${carbs} g`, 'carbs') + stat(`${fat} g`, 'fat') + (msg ? note(msg) : '') + note('A starting split, not a rule. Protein 1.6 g per kg, fat about 28% of calories, carbs the rest.'); }
    out.innerHTML = `<div class="c-res">${h}</div>`; out.hidden = false; out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();
