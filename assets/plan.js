// Meal Monster free plan quiz (11-04, Elijah: "a workout plan built from their questions... then say diet is a big part... show Meal Monster
// in a few slides... 1 week free with the download link"). One engine, two versions: <main id="plan" data-for="men|women">.
// Everything runs in the browser; answers never leave the device (no email gate, no tracking of answers).
// The workout is built by rules from the answers (place, days, minutes, level, focus, limits); calories use Mifflin-St Jeor with an activity
// factor, shown as an estimate. Brief rules: no body shaming, no good/bad foods, no guaranteed results, no fake urgency, adults only.
(() => {
  const root = document.getElementById('plan'); if (!root) return;
  const FOR = root.dataset.for === 'women' ? 'women' : 'men', MEN = FOR === 'men';
  const APP = 'https://apps.apple.com/app/apple-store/id6787743894?pt=128870776&ct=plan_' + FOR + '&mt=8';
  const E = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const A = {};   // answers
  // ---- screens: [section, type, key, title, sub, options|null, extra]
  const FOCUS = MEN ? ['Chest & arms', 'Back & shoulders', 'Core', 'Legs', 'Full body'] : ['Arms & shoulders', 'Core', 'Legs & glutes', 'Back & posture', 'Full body'];
  const S = [
    ['Goals', 'one', 'age', 'Let&#39;s build your free plan.', 'Pick your age to start. It takes about 3 minutes.', ['18–29', '30–39', '40–49', '50+'], { first: true }],
    ['Goals', 'one', 'goal', 'What&#39;s your main goal?', 'Your plan is built around this.', MEN ? ['Build muscle', 'Gain weight', 'Lose fat', 'Get fitter', 'Eat better'] : ['Lose fat', 'Get toned', 'Build strength', 'Get fitter', 'Eat better']],
    ['Goals', 'many', 'also', 'Anything else you want?', 'Pick all that fit.', ['More energy', 'Better sleep', 'Less stress', 'Better posture', 'Just consistency']],
    ['Goals', 'info', null, 'You&#39;re in the right place.', 'A good plan fits your week, not the other way around. A few questions about how you train.'],
    ['Training', 'one', 'place', 'Where will you train?', '', ['At home, no equipment', 'At home with dumbbells', 'At a gym']],
    ['Training', 'one', 'days', 'How many days a week?', 'Be honest. A plan you keep beats a perfect one.', ['2 days', '3 days', '4 days', '5 days']],
    ['Training', 'one', 'mins', 'How long per workout?', '', ['15 minutes', '30 minutes', '45 minutes', '60 minutes']],
    ['Training', 'one', 'level', 'How would you describe your training?', '', ['New to it', 'I train sometimes', 'I train regularly']],
    ['Training', 'many', 'focus', 'What do you want to focus on?', 'Pick all that fit.', FOCUS],
    ['Training', 'many', 'limits', 'Anything we should go easy on?', 'We&#39;ll swap exercises around it.', ['Knees', 'Lower back', 'Shoulders', 'None']],
    ['Fitness', 'one', 'pushups', 'How many push-ups can you do in a row?', 'Knee push-ups count.', ['0–5', '6–15', '16–30', '30+']],
    ['Fitness', 'one', 'stairs', 'Three flights of stairs. How do you feel?', '', ['Out of breath', 'A bit winded', 'Fine']],
    ['Fitness', 'one', 'day', 'What&#39;s your normal day like?', '', ['Mostly sitting', 'On my feet a lot', 'Physical work']],
    ['Lifestyle', 'one', 'sleep', 'How much do you usually sleep?', '', ['Under 6 hours', '6–7 hours', '7–8 hours', 'Over 8 hours']],
    ['Lifestyle', 'one', 'energy', 'How&#39;s your energy most days?', '', ['Steady all day', 'Crash in the afternoon', 'Tired most of the day']],
    ['Food', 'info', null, 'Now the other half: food.', 'Training builds the habit. What you eat is the fuel. Most people only plan one of the two, so let&#39;s cover both.', null, { art: 'monster-apple' }],
    ['Food', 'one', 'meals', 'How many times a day do you eat?', 'Snacks count.', ['1–2', '3', '4–5', '6+']],
    ['Food', 'one', 'track', 'Have you ever tracked what you eat?', '', ['Never', 'Tried, gave up', 'Sometimes', 'Every day']],
    ['Food', 'many', 'hard', 'What makes eating on plan hard?', 'Pick all that fit.', ['Logging takes too long', 'Guessing portions', 'Eating out', 'Forgetting', 'Eating enough', 'Cravings']],
    ['Food', 'one', 'diet', 'Any eating style?', '', ['No preference', 'Vegetarian', 'Vegan', 'Low-carb', 'Dairy-free']],
    ['Food', 'one', 'protein', 'Do most of your meals have protein in them?', 'Meat, fish, eggs, dairy, tofu, beans...', ['Almost always', 'About half', 'Rarely', 'Not sure']],
    ['You', 'height', 'height', 'How tall are you?', ''],
    ['You', 'weight', 'weight', 'What do you weigh now?', 'Used only to estimate your calories. It stays on your phone.'],
    ['You', 'number', 'years', 'How old are you exactly?', 'For the calorie estimate.', null, { min: 18, max: 90, unit: 'years' }],
    ['You', 'build', null, 'Building your plan…', ''],
  ];
  const sections = [...new Set(S.map(s => s[0]))];
  let i = 0;
  // ---- slide images (11-04 test: men's age + goal photos; GPT Images, fictional adults, sky-blue studio). Screens without a set stay text-only.
  // 11-05: every option screen with people or food has photos (body type matches the goal; Elijah 11-05). g = m_/w_ prefix; food is shared.
  const g = MEN ? 'm_' : 'w_';
  const IMG = {
    age: { '18–29': g + 'age_18', '30–39': g + 'age_30', '40–49': g + 'age_40', '50+': g + 'age_50' },
    goal: MEN ? { 'Build muscle': 'm_goal_muscle', 'Gain weight': 'm_goal_gain', 'Lose fat': 'm_goal_fat', 'Get fitter': 'm_goal_fitter', 'Eat better': 'm_goal_eat' }
      : { 'Lose fat': 'w_goal_fat', 'Get toned': 'w_goal_toned', 'Build strength': 'w_goal_strength', 'Get fitter': 'w_goal_fitter', 'Eat better': 'w_goal_eat' },
    place: { 'At home, no equipment': g + 'place_home', 'At home with dumbbells': g + 'place_dumbbells', 'At a gym': g + 'place_gym' },
    level: { 'New to it': g + 'level_new', 'I train sometimes': g + 'level_some', 'I train regularly': g + 'level_regular' },
    day: { 'Mostly sitting': g + 'day_desk', 'On my feet a lot': g + 'day_feet', 'Physical work': g + 'day_physical' },
    diet: { 'No preference': 'diet_any', 'Vegetarian': 'diet_vegetarian', 'Vegan': 'diet_vegan', 'Low-carb': 'diet_lowcarb', 'Dairy-free': 'diet_dairyfree' },
  };
  const HDR = { pushups: g + 'pushups', stairs: g + 'stairs', protein: 'protein_foods' };   // one photo above the options
  // ---- body picker for the focus + limits screens: each option lights these areas; tapping an area toggles the first option that owns it
  const AREAS = MEN ? { 'Chest & arms': ['chest', 'arms'], 'Back & shoulders': ['upback', 'shoulders'], 'Core': ['abs', 'lowback'], 'Legs': ['legs', 'glutes'] }
    : { 'Arms & shoulders': ['arms', 'shoulders'], 'Core': ['abs'], 'Legs & glutes': ['legs', 'glutes'], 'Back & posture': ['upback', 'lowback'] };
  const LIMITS = { 'Knees': ['legs'], 'Lower back': ['lowback'], 'Shoulders': ['shoulders'] };
  const MAPS = { focus: AREAS, limits: LIMITS };
  const ALL = ['chest', 'arms', 'shoulders', 'abs', 'upback', 'lowback', 'legs', 'glutes'];
  function bodyMap(sel, map = AREAS) {
    const lit = new Set(sel.includes('Full body') ? ALL : sel.flatMap(o => map[o] || []));
    const r = (a, d) => `<path data-area="${a}" class="pb-r${lit.has(a) ? ' on' : ''}" d="${d}"/>`;
    const fig = (x, back) => {
      // O = ellipse path (mirrored pair when m), N = neutral part
      const O = (dx, cy, rx, ry) => `M${x + dx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 -${2 * rx} 0z`;
      const P = (dx, cy, rx, ry) => O(-dx, cy, rx, ry) + O(dx, cy, rx, ry);
      const N = d => `<path class="pb-n" d="${d}"/>`;
      const abs = [90, 104, 118].map(y => P(7, y + 6, 6, 6.5)).join('');
      return N(O(0, 22, 14, 17)) + N(`M${x - 7} 36h14v14h-14z`) + N(P(44, 176, 6, 8)) + N(P(11, 296, 9, 6)) +
        r('shoulders', P(31, 64, 13, 12)) +
        (back ? r('upback', P(13, 80, 14, 23)) : r('chest', P(12, 72, 13, 13))) +
        (back ? r('lowback', P(7, 118, 7, 16)) : r('abs', abs)) +
        r('arms', P(38, 96, 8, 20) + P(41, 140, 7, 22)) +
        (back ? r('glutes', P(11, 150, 12, 14)) : N(`M${x - 22} 136h44l-4 22h-36z`)) +
        r('legs', P(11, back ? 193 : 190, 11, back ? 28 : 31) + P(11, 255, 8.5, 29)) +
        `<text class="pb-t" x="${x}" y="318">${back ? 'Back' : 'Front'}</text>`;
    };
    return `<svg class="pq-body" viewBox="0 0 300 320" role="img" aria-label="Body map of the areas you picked">${fig(80, false)}${fig(220, true)}</svg>`;
  }
  // ---- exercise library: [name, place min (0 none,1 dumbbells,2 gym), areas, stress tags, kind]
  const X = [
    ['Push-ups', 0, ['Chest & arms', 'Arms & shoulders', 'Full body'], ['shoulders'], 'push'], ['Incline push-ups', 0, ['Chest & arms', 'Arms & shoulders', 'Full body'], [], 'push'],
    ['Dumbbell bench press', 1, ['Chest & arms', 'Arms & shoulders'], ['shoulders'], 'push'], ['Bench press', 2, ['Chest & arms'], ['shoulders'], 'push'],
    ['Dumbbell shoulder press', 1, ['Back & shoulders', 'Arms & shoulders'], ['shoulders'], 'push'], ['Pike push-ups', 0, ['Back & shoulders', 'Arms & shoulders'], ['shoulders'], 'push'],
    ['Lateral raises', 1, ['Back & shoulders', 'Arms & shoulders'], [], 'push'], ['Triceps dips (chair)', 0, ['Chest & arms', 'Arms & shoulders'], ['shoulders'], 'push'],
    ['Cable or band chest fly', 2, ['Chest & arms'], [], 'push'],
    ['Door-frame rows', 0, ['Back & shoulders', 'Back & posture', 'Full body'], [], 'pull'], ['Dumbbell rows', 1, ['Back & shoulders', 'Back & posture', 'Chest & arms'], ['lower back'], 'pull'],
    ['Lat pulldown', 2, ['Back & shoulders', 'Back & posture'], [], 'pull'], ['Seated cable row', 2, ['Back & shoulders', 'Back & posture'], [], 'pull'],
    ['Superman holds', 0, ['Back & posture', 'Core'], [], 'pull'], ['Dumbbell curls', 1, ['Chest & arms', 'Arms & shoulders'], [], 'pull'], ['Face pulls (band or cable)', 2, ['Back & posture', 'Back & shoulders'], [], 'pull'],
    ['Bodyweight squats', 0, ['Legs', 'Legs & glutes', 'Full body'], ['knees'], 'legs'], ['Glute bridges', 0, ['Legs', 'Legs & glutes', 'Full body'], [], 'legs'],
    ['Reverse lunges', 0, ['Legs', 'Legs & glutes'], ['knees'], 'legs'], ['Goblet squats', 1, ['Legs', 'Legs & glutes', 'Full body'], ['knees'], 'legs'],
    ['Dumbbell Romanian deadlift', 1, ['Legs', 'Legs & glutes', 'Back & posture'], ['lower back'], 'legs'], ['Hip thrusts', 1, ['Legs & glutes', 'Legs'], [], 'legs'],
    ['Leg press', 2, ['Legs', 'Legs & glutes'], ['knees'], 'legs'], ['Hamstring curls', 2, ['Legs', 'Legs & glutes'], [], 'legs'], ['Calf raises', 0, ['Legs'], [], 'legs'],
    ['Side-lying leg raises', 0, ['Legs & glutes'], [], 'legs'],
    ['Plank', 0, ['Core', 'Full body'], [], 'core'], ['Dead bug', 0, ['Core', 'Back & posture'], [], 'core'], ['Side plank', 0, ['Core'], [], 'core'], ['Bird dog', 0, ['Core', 'Back & posture'], [], 'core'],
    ['Bicycle crunches', 0, ['Core'], ['lower back'], 'core'],
  ];
  const CARDIO = { 0: 'Brisk walk or march in place', 1: 'Brisk walk or step-ups', 2: 'Incline treadmill walk or bike' };
  const placeN = () => ['At home, no equipment', 'At home with dumbbells', 'At a gym'].indexOf(A.place);
  function buildWorkouts() {
    const days = parseInt(A.days) || 3, mins = parseInt(A.mins) || 30, pl = Math.max(0, placeN());
    const lim = (A.limits || []).filter(x => x !== 'None').map(x => x.toLowerCase());
    const lvl = A.level === 'I train regularly' ? 2 : A.level === 'I train sometimes' ? 1 : 0, beginner = lvl === 0 || A.pushups === '0–5';
    const focus = (A.focus || []).length ? A.focus : ['Full body'];
    const hard = A.pushups === '0–5' ? ['Push-ups', 'Pike push-ups', 'Triceps dips (chair)'] : [];
    const ok = x => x[1] <= pl && !x[3].some(t => lim.includes(t)) && !hard.includes(x[0]);
    const pool = X.filter(ok);
    const per = mins <= 15 ? 3 : mins <= 30 ? 5 : mins <= 45 ? 6 : 7;
    const muscle = /muscle|weight|strength|toned/i.test(A.goal || '');
    const sets = beginner ? 2 : lvl === 2 ? 4 : 3;
    const reps = muscle ? (beginner ? '10–12' : '8–12') : '12–15';
    // full-body days lead with the kinds the person said to focus on, then fill the rest, then focus again
    const KF = { 'Chest & arms': 'push', 'Arms & shoulders': 'push', 'Back & shoulders': 'pull', 'Back & posture': 'pull', 'Core': 'core', 'Legs': 'legs', 'Legs & glutes': 'legs' };
    const fk = [...new Set(focus.map(f => KF[f]).filter(Boolean))], full = [...fk, ...['legs', 'push', 'pull', 'core'].filter(k => !fk.includes(k)), ...fk];
    const split = days <= 3 ? Array(days).fill(full) : days === 4 ? [['push', 'pull', 'push', 'pull', 'core'], ['legs', 'legs', 'core'], ['push', 'pull', 'push', 'pull', 'core'], ['legs', 'legs', 'core']] : [['push', 'push', 'core'], ['pull', 'pull', 'core'], ['legs', 'legs', 'core'], ['push', 'pull'], ['legs', 'legs', 'core']];
    const names = days <= 3 ? Array(days).fill('Full body') : days === 4 ? ['Upper body', 'Lower body', 'Upper body', 'Lower body'] : ['Push', 'Pull', 'Legs', 'Upper body', 'Legs & core'];
    const score = x => x[2].filter(a => focus.includes(a)).length * 2 + (x[1] === pl ? 1 : 0);
    const seen = {};   // how often each move was used this week, so days vary
    return split.map((kinds, d) => {
      const picks = [];
      for (let k = 0; picks.length < per && k < 24; k++) {
        const kind = kinds[k % kinds.length];
        const c = pool.filter(x => x[4] === kind && !picks.includes(x)).sort((a, b) => (seen[a[0]] || 0) - (seen[b[0]] || 0) || score(b) - score(a))[0];
        if (c) { picks.push(c); seen[c[0]] = (seen[c[0]] || 0) + 1; }
      }
      const ex = picks.map(x => [x[0], /Plank|Superman/i.test(x[0]) ? `${sets} × ${beginner ? 20 : 40} s` : `${sets} × ${reps}`]);
      if (!muscle || A.stairs === 'Out of breath') ex.push([CARDIO[pl], `${mins <= 15 ? 5 : 10} min, easy pace`]);
      return { name: names[d], ex };
    });
  }
  function calories() {
    const inch = A.height?.cm ? A.height.cm / 2.54 : 0, lb = A.weight?.kg ? A.weight.kg * 2.2046 : 0, yrs = parseInt(A.years) || 30;
    if (!inch || !lb) return null;
    const kg = lb / 2.2046, cm = inch * 2.54;
    const bmr = 10 * kg + 6.25 * cm - 5 * yrs + (MEN ? 5 : -161);
    const act = ({ 'Mostly sitting': 1.2, 'On my feet a lot': 1.375, 'Physical work': 1.5 }[A.day] || 1.3) + ((parseInt(A.days) || 3) >= 4 ? .1 : .05);
    let tdee = bmr * act, adj = 0, note = 'to maintain your weight';
    const bmi = kg / ((cm / 100) ** 2);
    if (/lose fat/i.test(A.goal) && bmi >= 20) { adj = -400; note = 'for steady fat loss (a moderate deficit)'; }
    else if (/muscle|gain|strength|toned/i.test(A.goal)) { adj = /gain/i.test(A.goal) ? 350 : 200; note = /gain/i.test(A.goal) ? 'to gain weight steadily' : 'to build muscle'; }
    const cal = Math.max(MEN ? 1500 : 1200, Math.round((tdee + adj) / 50) * 50), protein = Math.round(kg * 1.6 / 5) * 5;
    return { cal, protein, note, lowBmi: bmi < 18.5 && /lose/i.test(A.goal) };
  }
  // ---- rendering
  const bar = () => `<div class="pq-top"><div class="pq-secs">${sections.map(s => `<span class="${s === S[i][0] ? 'on' : sections.indexOf(s) < sections.indexOf(S[i][0]) ? 'done' : ''}">${s}</span>`).join('')}</div><div class="pq-prog"><i style="width:${Math.round(i / (S.length - 1) * 100)}%"></i></div></div>`;
  const back = () => i ? `<button type="button" class="pq-back" aria-label="Back">‹ Back</button>` : '';
  function render() {
    const [sec, type, key, title, sub, opts, ex] = S[i]; ex || 0; let body = '';
    if (type === 'one' && IMG[key]) body = `<div class="pq-pics${opts.length === 3 ? ' rows' : opts.length % 2 ? ' odd' : ''}">${opts.map(o => `<button type="button" class="pq-pic${A[key] === o ? ' on' : ''}" data-v="${E(o)}"><img src="/assets/img/plan/${IMG[key][o]}.webp" alt="" width="300" height="300"><span>${E(o)}</span></button>`).join('')}</div>`;
    else if (type === 'one') body = (HDR[key] ? `<img class="pq-hdr" src="/assets/img/plan/${HDR[key]}.webp" alt="" width="600" height="600">` : '') + `<div class="pq-opts">${opts.map(o => `<button type="button" class="pq-o${A[key] === o ? ' on' : ''}" data-v="${E(o)}">${E(o)}</button>`).join('')}</div>`;
    else if (type === 'many') body = (MAPS[key] ? bodyMap(A[key] || [], MAPS[key]) : '') +`<div class="pq-opts">${opts.map(o => `<button type="button" class="pq-o pq-m${(A[key] || []).includes(o) ? ' on' : ''}" data-v="${E(o)}"><span class="pq-ck"></span>${E(o)}</button>`).join('')}</div><button type="button" class="pq-next"${(A[key] || []).length ? '' : ' disabled'}>Continue</button>`;
    else if (type === 'info') body = `${S[i][6]?.art ? `<img class="pq-art" src="/assets/img/${S[i][6].art}.webp" alt="" width="220" height="220">` : ''}<button type="button" class="pq-next">Continue</button>`;
    else if (type === 'height') body = `<div class="pq-units"><button type="button" data-u="in" class="${A._u !== 'cm' ? 'on' : ''}">ft / in</button><button type="button" data-u="cm" class="${A._u === 'cm' ? 'on' : ''}">cm</button></div>` +
      (A._u === 'cm' ? `<div class="pq-num"><input id="pq-cm" inputmode="numeric" placeholder="${MEN ? 178 : 165}" value="${A.height?.cm ? Math.round(A.height.cm) : ''}"><span>cm</span></div>`
        : `<div class="pq-num"><input id="pq-ft" inputmode="numeric" placeholder="${MEN ? 5 : 5}" value="${A.height?.ft ?? ''}"><span>ft</span><input id="pq-in" inputmode="numeric" placeholder="${MEN ? 10 : 5}" value="${A.height?.inch ?? ''}"><span>in</span></div>`) + `<button type="button" class="pq-next">Continue</button>`;
    else if (type === 'weight') body = `<div class="pq-units"><button type="button" data-u="lb" class="${A._w !== 'kg' ? 'on' : ''}">lb</button><button type="button" data-u="kg" class="${A._w === 'kg' ? 'on' : ''}">kg</button></div><div class="pq-num"><input id="pq-w" inputmode="decimal" placeholder="${A._w === 'kg' ? (MEN ? 80 : 65) : (MEN ? 175 : 145)}" value="${A.weight ? Math.round(A._w === 'kg' ? A.weight.kg : A.weight.kg * 2.2046) : ''}"><span>${A._w === 'kg' ? 'kg' : 'lb'}</span></div><button type="button" class="pq-next">Continue</button>`;
    else if (type === 'number') body = `<div class="pq-num"><input id="pq-n" inputmode="numeric" placeholder="${ex.min + 10}" value="${A[key] ?? ''}"><span>${ex.unit}</span></div><p class="pq-err" hidden>Enter an age from ${ex.min} to ${ex.max}.</p><button type="button" class="pq-next">Continue</button>`;
    else if (type === 'build') return building();
    root.innerHTML = `${bar()}<section class="pq-card">${back()}<h1>${title}</h1>${sub ? `<p class="pq-sub">${sub}</p>` : ''}${body}${ex?.first ? `<p class="pq-fine">Free. No account, no email. Your answers stay on your phone. By continuing you agree to our <a href="/terms/">Terms</a> and <a href="/privacy/">Privacy Policy</a>. Adults 18+.</p>` : ''}</section>`;
    root.querySelector('input')?.focus({ preventScroll: true });
    scrollTo({ top: 0 });
  }
  const next = () => { i = Math.min(S.length - 1, i + 1); render(); };
  root.addEventListener('click', e => {
    const ar = e.target.closest('[data-area]');
    const mk = S[i][2];
    if (ar && MAPS[mk]) {   // tap a body area: toggle the option that owns it ('Full body' / 'None' off first)
      const M = MAPS[mk], o = Object.keys(M).find(k => M[k].includes(ar.dataset.area)); if (!o) return;
      let v = (A[mk] || []).filter(x => x !== 'Full body' && x !== 'None'); v = v.includes(o) ? v.filter(x => x !== o) : [...v, o]; A[mk] = v; return render();
    }
    const b = e.target.closest('button'); if (!b) return; const [, type, key] = S[i];
    if (b.classList.contains('pq-back')) { i = Math.max(0, i - 1); return render(); }
    if (b.dataset.u) { if (type === 'height') A._u = b.dataset.u; else A._w = b.dataset.u; return render(); }
    if ((b.classList.contains('pq-o') || b.classList.contains('pq-pic')) && type === 'one') { A[key] = b.dataset.v; b.classList.add('on'); return setTimeout(next, 180); }
    if (b.classList.contains('pq-o') && type === 'many') {
      let v = A[key] || [], o = b.dataset.v;
      if (o === 'None' || o === 'Just consistency') v = v.includes(o) ? [] : [o]; else v = v.includes(o) ? v.filter(x => x !== o) : [...v.filter(x => x !== 'None' && x !== 'Just consistency'), o];
      A[key] = v; return render();
    }
    if (b.classList.contains('pq-next')) {
      if (type === 'height') { const cm = A._u === 'cm' ? +root.querySelector('#pq-cm').value : (+root.querySelector('#pq-ft').value * 12 + +root.querySelector('#pq-in').value) * 2.54;
        if (!(cm > 120 && cm < 230)) return root.querySelector('.pq-num').classList.add('bad'); A.height = { cm, ft: A._u === 'cm' ? undefined : +root.querySelector('#pq-ft').value, inch: A._u === 'cm' ? undefined : +root.querySelector('#pq-in').value }; }
      if (type === 'weight') { const w = +root.querySelector('#pq-w').value, kg = A._w === 'kg' ? w : w / 2.2046; if (!(kg > 35 && kg < 300)) return root.querySelector('.pq-num').classList.add('bad'); A.weight = { kg }; }
      if (type === 'number') { const n = +root.querySelector('#pq-n').value; if (!(n >= 18 && n <= 90)) { root.querySelector('.pq-err').hidden = false; return; } A[key] = n; }
      return next();
    }
  });
  root.addEventListener('keydown', e => { if (e.key === 'Enter') root.querySelector('.pq-next')?.click(); });
  function building() {
    const steps = ['Matching exercises to your space and time', 'Working around anything you said to go easy on', 'Estimating your daily calories and protein', 'Putting your week together'];
    root.innerHTML = `${bar()}<section class="pq-card pq-build"><h1>Building your plan…</h1><ul class="pq-steps">${steps.map(s => `<li>${s}</li>`).join('')}</ul></section>`;
    root.querySelectorAll('.pq-steps li').forEach((li, k) => setTimeout(() => li.classList.add('done'), 450 + k * 450));
    setTimeout(result, 450 + steps.length * 450 + 300);
  }
  function result() {
    const W = buildWorkouts(), c = calories(), days = parseInt(A.days) || 3;
    const plan = W.map((d, k) => `<details class="pq-day"${k ? '' : ' open'}><summary><b>Day ${k + 1}</b> <span>${E(d.name)} · ${d.ex.length} moves</span></summary><ol>${d.ex.map(([n, s]) => `<li><span>${E(n)}</span><b>${E(s)}</b></li>`).join('')}</ol></details>`).join('');
    const tips = [(A.hard || []).includes('Logging takes too long') ? 'Logging that takes seconds, not minutes: type or say what you ate.' : 'Log what you eat once a day, even roughly.',
      (A.protein === 'Rarely' || A.protein === 'Not sure') ? `Aim for some protein at every meal${c ? `, about ${c.protein} g a day in total` : ''}.` : `Keep protein in most meals${c ? ` (about ${c.protein} g a day)` : ''}.`,
      (A.hard || []).includes('Guessing portions') ? 'Use a photo or the barcode when you&#39;re unsure of portions.' : 'Check your totals at night and adjust tomorrow.'];
    root.innerHTML = `<section class="pq-res">
<p class="pq-kick">Your free plan</p><h1>${days} days a week, ${E(A.mins || '30 minutes')}.</h1>
<p class="pq-sub">Built from your answers: ${E((A.place || '').toLowerCase())}, ${E({ 'New to it': 'new to training', 'I train sometimes': 'training sometimes', 'I train regularly': 'training regularly' }[A.level] || '')}${(A.limits || []).filter(x => x !== 'None').length ? `, easy on ${E(A.limits.filter(x => x !== 'None').join(' and ').toLowerCase())}` : ''}.</p>
<div class="pq-plan">${plan}</div>
<p class="pq-fine">Warm up for 5 minutes first. Rest 60 to 90 seconds between sets. Stop any move that hurts. This is general fitness guidance, not medical advice.</p>
${c ? `<div class="pq-cal"><p class="pq-kick">Your daily food target (estimate)</p><div class="pq-calg"><div><b>${c.cal.toLocaleString('en-US')}</b><span>calories a day ${E(c.note)}</span></div><div><b>${c.protein} g</b><span>protein a day</span></div></div>
${c.lowBmi ? '<p class="pq-fine">Your numbers are already on the low side for your height, so we set this at maintenance. A doctor or dietitian can help you set a goal.</p>' : '<p class="pq-fine">Estimated from your height, weight, age and activity (Mifflin-St Jeor). Everyone is different: adjust after two weeks based on how you feel and how you&#39;re doing.</p>'}</div>` : ''}
<div class="pq-half"><h2>The workouts are half of it.</h2><p>Your food is the other half, and it&#39;s the half most people never track. That&#39;s what Meal Monster is for.</p></div>
<div class="pq-slides" aria-label="Meal Monster screens">
  ${[['shot-log', 'Log a meal by typing, talking or snapping a photo.'], ['shot-details', 'See calories, protein, carbs and fat. Every estimate is editable.'], ['shot-progress', 'Track your days against your calorie and protein targets.'], ['shot-skins', 'Earn collectible monster skins as you keep logging.']].map(([s, t]) => `<figure class="pq-slide"><img src="/assets/img/${s}.webp" alt="" loading="lazy"><figcaption>${t}</figcaption></figure>`).join('')}
</div>
<div class="pq-tips"><p class="pq-kick">Your food plan, step one</p><ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul></div>
<div class="pq-cta"><img src="/assets/img/monster-highfive.webp" alt="" width="120" height="120"><h2>Try Meal Monster free for a week.</h2><p>7-day free trial for eligible new subscribers, then the price shown in the App Store. Cancel anytime in Settings.</p>
<a class="pq-go" href="${APP}" rel="noopener">Download on the App Store</a><button type="button" class="pq-redo">Change my answers</button></div>
</section>`;
    root.querySelector('.pq-redo').onclick = () => { i = 1; render(); };
    scrollTo({ top: 0 });
  }
  render();
})();
