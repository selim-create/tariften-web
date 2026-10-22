'use strict';
/*
 * Mutfak Rehberi P23 tools: pure logic for the egg, pasta, drying and measure
 * tools and the countdown timer. Roadmap rule under test: results can never
 * leave safe ranges, and the converter refuses what it cannot know.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const transpile = file => ts.transpileModule(read(file), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function load(file) {
  const mod = { exports: {} };
  Function('module', 'exports', 'require', transpile(file))(mod, mod.exports, () => { throw Error('unexpected_import'); });
  return mod.exports;
}

const t = load('src/lib/guide-tools.ts');
const g = load('src/lib/guides.ts');

/* ------------------------------------------------------------- tool keys */

test('tool keys: Core closed list, unknown keys ignored, every key has meta', () => {
  assert.deepEqual([...g.GUIDE_TOOL_KEYS], ['egg_doneness', 'pasta_timer', 'drying_guide', 'measure_converter']);
  assert.deepEqual([...t.GUIDE_TOOL_ORDER].sort(), [...g.GUIDE_TOOL_KEYS].sort());
  for (const key of g.GUIDE_TOOL_KEYS) {
    assert.equal(t.GUIDE_TOOLS[key].key, key);
    assert.match(t.GUIDE_TOOLS[key].anchor, /^[a-z]+$/);
  }
  const base = { slug: 'a-b', title: 'T' };
  assert.equal(g.normalizeGuideSummary({ ...base, tool: 'pasta_timer' }).tool, 'pasta_timer');
  assert.equal(g.normalizeGuideSummary({ ...base, tool: ' drying_guide ' }).tool, 'drying_guide');
  assert.equal(g.normalizeGuideSummary({ ...base, tool: 'jerky_maker' }).tool, null);
  assert.equal(g.normalizeGuideSummary({ ...base, tool: 7 }).tool, null);
  assert.equal(g.normalizeGuideSummary({ ...base }).tool, null);
});

/* ----------------------------------------------------------------- timer */

test('timer: timestamps, not ticks; pause/resume keeps the remaining time', () => {
  let s = t.timerIdle(60000);
  assert.equal(t.timerStatus(s, 0), 'idle');
  s = t.timerStart(s, 1000);
  assert.equal(s.endsAt, 61000);
  assert.equal(t.timerStatus(s, 1000), 'running');
  // A background tab that slept 40 s still shows the right time.
  assert.equal(t.timerRemaining(s, 41000), 20000);
  s = t.timerPause(s, 41000);
  assert.equal(t.timerStatus(s, 99999), 'paused');
  assert.equal(t.timerRemaining(s, 99999), 20000);
  assert.equal(t.timerStart(t.timerStart(s, 100000), 100500).endsAt, 120000, 'second start is a no-op');
  s = t.timerStart(s, 100000);
  assert.equal(t.timerRemaining(s, 130000), 0);
  assert.equal(t.timerStatus(s, 130000), 'done');
  assert.deepEqual(t.timerReset(s), t.timerIdle(60000));
  assert.equal(t.timerStatus(t.timerIdle(0), 0), 'idle', 'no valid time yet is idle, not done');
  assert.deepEqual(t.timerStart(t.timerIdle(0), 5), t.timerIdle(0), 'a zero timer cannot start');
  assert.deepEqual(t.timerReset(s, 5000), t.timerIdle(5000));
  assert.equal(t.formatClock(0), '0:00');
  assert.equal(t.formatClock(59.2), '1:00', 'rounds up so 0:00 means done');
  assert.equal(t.formatClock(690), '11:30');
  assert.equal(t.formatMinutes(450), '7 dk 30 sn');
  assert.equal(t.formatMinutes(660), '11 dk');
});

/* ------------------------------------------------------------------- egg */

test('egg: base times for an M egg from the fridge at sea level', () => {
  assert.equal(t.eggBoilTime({ size: 'M', start: 'fridge', doneness: 'rafadan' }).seconds, 360);
  assert.equal(t.eggBoilTime({ size: 'M', start: 'fridge', doneness: 'kayisi' }).seconds, 480);
  assert.equal(t.eggBoilTime({ size: 'M', start: 'fridge', doneness: 'kati' }).seconds, 660);
});

test('egg: size, room temperature and altitude adjust in half-minute steps', () => {
  assert.equal(t.eggBoilTime({ size: 'XL', doneness: 'kayisi' }).seconds, 540);
  assert.equal(t.eggBoilTime({ size: 'L', doneness: 'rafadan' }).seconds, 390);
  assert.equal(t.eggBoilTime({ size: 'M', start: 'room', doneness: 'rafadan' }).seconds, 300);
  assert.equal(t.eggBoilTime({ size: 'M', doneness: 'kati', altitude: 'mid' }).seconds, 720);
  assert.equal(t.eggBoilTime({ size: 'M', doneness: 'kati', altitude: 'high' }).seconds, 780);
  // Altitude is added before clamping: XL rafadan at 2000 m + would be 9 dk, the window caps it at 7,5.
  assert.equal(t.eggBoilTime({ size: 'XL', doneness: 'rafadan', altitude: 'high' }).seconds, 450);
  // Junk falls back to M / buzdolabı / kayısı / sea level.
  assert.deepEqual(t.eggBoilTime({ size: 'XXL', start: 'oven', doneness: 'raw', altitude: 'moon' }),
    { seconds: 480, minutes: 8, size: 'M', start: 'fridge', altitude: 'low', doneness: 'kayisi', forcedFullySet: false });
});

test('egg: every combination stays inside its safe range; katı is never under 10 minutes', () => {
  for (const size of t.EGG_SIZES) for (const start of t.EGG_STARTS) for (const altitude of t.EGG_ALTITUDES) {
    for (const d of t.EGG_DONENESS) for (const sensitive of [false, true]) {
      const r = t.eggBoilTime({ size: size.id, start: start.id, altitude: altitude.id, doneness: d.id, sensitive });
      const [min, max] = t.EGG_RANGE[r.doneness];
      assert.ok(r.minutes >= min && r.minutes <= max, JSON.stringify(r));
      assert.equal(r.seconds % 30, 0, 'half-minute steps');
      if (r.doneness === 'kati') assert.ok(r.seconds >= t.EGG_FULLY_SET_MIN_SECONDS);
      if (sensitive) assert.equal(r.doneness, 'kati', 'sensitive eaters always get a fully set yolk');
    }
  }
  // S egg at room temperature would compute 9:30 for katı: clamped up to 10:00.
  assert.equal(t.eggBoilTime({ size: 'S', start: 'room', doneness: 'kati' }).seconds, 600);
});

test('egg: child / pregnant / elderly → fully set yolk, flagged', () => {
  const r = t.eggBoilTime({ size: 'M', doneness: 'rafadan', sensitive: true });
  assert.equal(r.doneness, 'kati');
  assert.equal(r.forcedFullySet, true);
  assert.equal(r.seconds, 660);
  assert.equal(t.eggBoilTime({ doneness: 'kati', sensitive: true }).forcedFullySet, false);
  assert.equal(t.eggBoilTime({ doneness: 'rafadan', sensitive: 'yes' }).doneness, 'rafadan', 'only a real true forces it');
  assert.match(t.EGG_SAFETY_NOTE, /hamile/);
});

/* ----------------------------------------------------------------- pasta */

test('pasta: package time is the reference; al dente −1 min, yumuşak +1 min', () => {
  assert.deepEqual(t.pastaCookTime({ type: 'spagetti', texture: 'al_dente' }), { ok: true, seconds: 480, minutes: 8, packageMinutes: 9, texture: 'al_dente', note: null });
  assert.equal(t.pastaCookTime({ type: 'spagetti', texture: 'yumusak' }).seconds, 600);
  assert.equal(t.pastaCookTime({ type: 'taze', texture: 'al_dente' }).seconds, 120);
  assert.match(t.pastaCookTime({ type: 'taze', texture: 'al_dente' }).note, /Taze makarna/);
  assert.deepEqual(t.pastaCookTime({ type: 'lazanya', texture: 'al_dente' }), { ok: false, error: 'unknown_type' });
  assert.deepEqual(t.pastaCookTime({ type: 'penne', texture: 'cig' }), { ok: false, error: 'unknown_texture' });
});

test('pasta: typed package time is parsed and bounded (2–20 min); nonsense is refused', () => {
  assert.equal(t.pastaCookTime({ type: 'paket', packageMinutes: '12', texture: 'al_dente' }).seconds, 660);
  assert.equal(t.pastaCookTime({ type: 'paket', packageMinutes: '8,5', texture: 'yumusak' }).seconds, 570);
  assert.equal(t.pastaCookTime({ type: 'paket', packageMinutes: 2, texture: 'al_dente' }).seconds, 120, 'never below 2 minutes');
  assert.equal(t.pastaCookTime({ type: 'paket', packageMinutes: 20, texture: 'yumusak' }).seconds, 1200, 'never above 20 minutes');
  for (const bad of ['', 'abc', '0', '-5', '1', '1,5', '21', '31', '600', null, undefined, NaN, Infinity]) {
    assert.deepEqual(t.pastaCookTime({ type: 'paket', packageMinutes: bad, texture: 'al_dente' }), { ok: false, error: 'invalid_package_time' }, String(bad));
  }
  for (const p of t.PASTA_SHAPES) {
    for (const texture of ['al_dente', 'yumusak']) {
      const r = t.pastaCookTime({ type: p.id, texture });
      assert.ok(r.ok && r.minutes >= t.PASTA_TIMER_RANGE[0] && r.minutes <= t.PASTA_TIMER_RANGE[1], p.id);
    }
  }
});

test('pasta: 1 L water and 10 g salt per 100 g; 100 g per portion, 1–10 portions', () => {
  assert.deepEqual(t.pastaWaterSalt(2), { portions: 2, grams: 200, waterLiters: 2, saltGrams: 20, saltHint: 'yaklaşık 1 ¾ tatlı kaşığı', note: null });
  for (let p = 1; p <= 10; p++) {
    const x = t.pastaWaterSalt(p);
    assert.equal(x.grams, p * 100);
    assert.equal(x.waterLiters, p);
    assert.equal(x.saltGrams, p * 10);
    assert.match(x.saltHint, /^yaklaşık .*kaşığı$/);
  }
  assert.ok(t.pastaWaterSalt(8).note, 'large pots: split the batch');
  for (const bad of [0, 11, -1, NaN, 'abc']) assert.equal(t.pastaWaterSalt(bad), null, String(bad));
});

/* ---------------------------------------------------------------- drying */

test('drying: every food × method is a safe spec or an explicit "not recommended"', () => {
  assert.deepEqual(t.DRYING_FOODS.map(f => f.id), ['domates', 'biber', 'patlican', 'elma', 'armut', 'kayisi', 'mantar', 'nane', 'kekik']);
  for (const food of t.DRYING_FOODS) {
    for (const method of t.DRYING_METHODS.map(m => m.id)) {
      const plan = t.dryingPlan(food.id, method);
      if (!plan.ok) {
        assert.equal(plan.error, 'not_recommended', `${food.id}/${method}`);
        assert.ok(plan.reason.length > 20);
        assert.ok(plan.alternatives.length > 0);
        continue;
      }
      const [lo, hi] = t.DRYING_TEMP_LIMITS[food.group];
      if (plan.tempC) {
        assert.ok(plan.tempC[0] >= lo && plan.tempC[1] <= hi && plan.tempC[0] < plan.tempC[1], `${food.id}/${method} ${plan.tempC}`);
        if (method === 'makine' && food.group !== 'ot') assert.ok(plan.tempC[1] <= 60, 'dehydrator never above 60 °C');
      } else {
        assert.equal(method, 'gunes', 'only sun/shade drying has no oven temperature');
      }
      assert.ok(plan.time.min > 0 && plan.time.min < plan.time.max, `${food.id}/${method} time`);
      assert.equal(plan.time.unit, method === 'gunes' ? 'gün' : 'saat');
      for (const field of ['prep', 'conditions', 'ready', 'storage']) assert.ok(plan[field].length > 15, `${food.id}/${method} ${field}`);
      assert.match(plan.tempLabel, food.group === 'ot' && method === 'gunes' ? /^Gölgede/ : /°C/);
      assert.match(plan.timeLabel, /^\d+–\d+ (saat|gün)$/);
    }
  }
});

test('drying: low-acid vegetables are not sun-dried; sun-dried fruit gets the freezer/oven step; herbs dry in shade', () => {
  for (const key of ['biber', 'patlican', 'mantar']) {
    const plan = t.dryingPlan(key, 'gunes');
    assert.equal(plan.error, 'not_recommended', key);
    assert.deepEqual(plan.alternatives, ['firin', 'makine'], key);
  }
  for (const key of ['domates', 'elma', 'armut', 'kayisi']) {
    const plan = t.dryingPlan(key, 'gunes');
    assert.equal(plan.ok, true);
    assert.match(plan.conditions, /30 °C/);
    assert.ok(plan.notes.some(n => /dondurucu/.test(n) && /70 °C/.test(n)), `${key} pasteurization`);
    assert.equal(plan.finish, t.DRYING_SUN_PASTEURIZE);
    assert.equal(t.dryingPlan(key, 'firin').finish, null);
  }
  for (const key of ['nane', 'kekik']) {
    assert.match(t.dryingPlan(key, 'gunes').conditions, /gölge/i);
    assert.equal(t.dryingPlan(key, 'gunes').finish, null);
  }
  assert.match(t.dryingPlan('domates', 'firin').storage, /buzdolabında/, 'tomatoes in oil are refrigerated');
  assert.ok(t.dryingPlan('domates', 'makine').notes.some(n => /botulizm/.test(n)));
  assert.ok(t.dryingPlan('mantar', 'makine').notes.some(n => /yabani/.test(n)));
});

test('drying: no meat or fish; unknown foods and methods are refused; the reason is written down', () => {
  for (const key of ['et', 'sigir', 'tavuk', 'balik', 'hindi', 'pastirma', 'jerky', 'sucuk', 'muz', '', null]) {
    assert.deepEqual(t.dryingPlan(key, 'firin'), { ok: false, error: 'unknown_food' }, String(key));
  }
  assert.deepEqual(t.dryingPlan('domates', 'mikrodalga'), { ok: false, error: 'unknown_method' });
  assert.ok(t.DRYING_GENERAL_NOTES.some(n => /jerky/.test(n) && /balık/.test(n)));
  assert.match(t.DRYING_NO_MEAT_NOTE, /71 °C/);
  assert.ok(t.DRYING_FOODS.every(f => ['sebze', 'meyve', 'ot'].includes(f.group)));
});

/* --------------------------------------------------------------- measure */

test('measure: parses Turkish amounts like mobile', () => {
  assert.equal(t.parseAmount('2'), 2);
  assert.equal(t.parseAmount('1,5'), 1.5);
  assert.equal(t.parseAmount('1.5'), 1.5);
  assert.equal(t.parseAmount('1/2'), 0.5);
  assert.equal(t.parseAmount('1 1/2'), 1.5);
  assert.equal(t.parseAmount('1½'), 1.5);
  assert.equal(t.parseAmount('1 ½'), 1.5);
  assert.equal(t.parseAmount('¾'), 0.75);
  assert.equal(t.parseAmount(3), 3);
  for (const bad of ['', 'abc', '1/0', '2kg', '1,2,3', '1..5', '2e3', null, undefined, NaN, Infinity, '½½']) {
    assert.equal(t.parseAmount(bad), null, String(bad));
  }
  for (const bad of ['0', '-1', 0, -2]) assert.deepEqual(t.convertMeasure({ amount: bad, from: 'ml', to: 'su_bardagi' }), { ok: false, error: 'invalid_amount' }, String(bad));
});

test('measure: volume math between household units and ml', () => {
  const ok = (amount, from, to, ingredient) => {
    const r = t.convertMeasure({ amount, from, to, ingredient });
    assert.equal(r.ok, true, JSON.stringify(r));
    return r.result;
  };
  assert.equal(ok('1', 'su_bardagi', 'ml').rounded, 200);
  assert.equal(ok('1', 'su_bardagi', 'cay_bardagi').text, '2 çay bardağı');
  assert.equal(ok('1', 'su_bardagi', 'yemek_kasigi').value, 200 / 15);
  assert.equal(ok('1', 'su_bardagi', 'yemek_kasigi').text, '13 ¼ yemek kaşığı');
  assert.equal(ok('3', 'cay_kasigi', 'yemek_kasigi').text, '1 yemek kaşığı');
  assert.equal(ok('1', 'tatli_kasigi', 'cay_kasigi').text, '2 çay kaşığı');
  assert.equal(ok('150', 'ml', 'su_bardagi').text, '¾ su bardağı');
  assert.equal(ok('2', 'ml', 'su_bardagi').text, '¼ su bardağından az');
  assert.equal(ok('2', 'ml', 'su_bardagi').outOfRange, true);
  assert.equal(ok('1000', 'ml', 'yemek_kasigi').outOfRange, true, '66 yemek kaşığı is hidden, as on mobile');
  assert.equal(ok('1000', 'ml', 'yemek_kasigi').text, '20 yemek kaşığından fazla');
  assert.equal(ok('1/2', 'cay_bardagi', 'ml').text, '50 ml');
});

test('measure: grams by density; unknown ingredients refused; error texts exist', () => {
  assert.deepEqual(t.convertMeasure({ amount: '1', from: 'su_bardagi', to: 'g' }), { ok: false, error: 'unknown_ingredient' });
  assert.deepEqual(t.convertMeasure({ amount: '1', from: 'su_bardagi', to: 'g', ingredient: 'kinoa' }), { ok: false, error: 'unknown_ingredient' });
  assert.deepEqual(t.convertMeasure({ amount: '100', from: 'g', to: 'ml', ingredient: '' }), { ok: false, error: 'unknown_ingredient' });
  assert.deepEqual(t.convertMeasure({ amount: '1', from: 'kupa', to: 'ml' }), { ok: false, error: 'unknown_unit' });
  assert.equal(t.convertMeasure({ amount: '500', from: 'g', to: 'g' }).result.text, '500 g', 'same unit needs no ingredient');
  assert.equal(t.convertMeasure({ amount: '1', from: 'cay_kasigi', to: 'g', ingredient: 'kabartma_tozu' }).result.text, '4 g', 'web-only ingredient');
  for (const ing of t.MEASURE_INGREDIENTS) assert.ok(ing.density >= 0.3 && ing.density <= 1.5, ing.id);
  for (const key of ['invalid_amount', 'unknown_unit', 'unknown_ingredient', 'too_large']) assert.ok(t.MEASURE_ERRORS[key]);
});

test('measure: other units list skips silly amounts and never repeats from/to', () => {
  const r = t.convertMeasure({ amount: '1', from: 'su_bardagi', to: 'g', ingredient: 'un' });
  const units = r.others.map(o => o.unit);
  assert.ok(units.includes('cay_bardagi'));
  assert.ok(units.includes('ml'));
  assert.ok(units.includes('yemek_kasigi'));
  assert.ok(!units.includes('cay_kasigi'), '40 çay kaşığı is not a useful answer (more than 20 units is skipped)');
  assert.ok(!units.includes('su_bardagi') && !units.includes('g'), 'from and to are not repeated');
  const noIngredient = t.convertMeasure({ amount: '1', from: 'su_bardagi', to: 'ml' });
  assert.ok(!noIngredient.others.some(o => o.unit === 'g'), 'no grams without a known ingredient');
});

/* -------------------------------------------- parity with mobile (P23) */
/*
 * The mobile app (tariften-mobile lib/guide-tools.ts) is the source of truth.
 * These are the mobile suite's numeric expectations and the full mobile
 * output tables, so both suites assert the same numbers.
 */

const MOBILE_EGG_SECONDS = {
  'S/fridge/rafadan': 330, 'S/fridge/kayisi': 450, 'S/fridge/kati': 630,
  'S/room/rafadan': 270, 'S/room/kayisi': 390, 'S/room/kati': 600,
  'M/fridge/rafadan': 360, 'M/fridge/kayisi': 480, 'M/fridge/kati': 660,
  'M/room/rafadan': 300, 'M/room/kayisi': 420, 'M/room/kati': 600,
  'L/fridge/rafadan': 390, 'L/fridge/kayisi': 510, 'L/fridge/kati': 690,
  'L/room/rafadan': 330, 'L/room/kayisi': 450, 'L/room/kati': 630,
  'XL/fridge/rafadan': 420, 'XL/fridge/kayisi': 540, 'XL/fridge/kati': 720,
  'XL/room/rafadan': 360, 'XL/room/kayisi': 480, 'XL/room/kati': 660,
};

test('parity with mobile: egg minutes, offsets and windows', () => {
  assert.deepEqual(t.EGG_BASE_MINUTES, { rafadan: 6, kayisi: 8, kati: 11 });
  assert.deepEqual(t.EGG_SIZE_OFFSET, { S: -0.5, M: 0, L: 0.5, XL: 1 });
  assert.equal(t.EGG_ROOM_OFFSET, -1);
  assert.deepEqual(t.EGG_RANGE, { rafadan: [4.5, 7.5], kayisi: [6.5, 9.5], kati: [10, 13] });
  for (const [key, seconds] of Object.entries(MOBILE_EGG_SECONDS)) {
    const [size, start, doneness] = key.split('/');
    assert.equal(t.eggBoilTime({ size, start, doneness }).seconds, seconds, key);
    assert.equal(t.eggBoilTime({ size, start, doneness, altitude: 'low' }).seconds, seconds, `${key} at sea level`);
  }
  assert.equal(t.formatMinutes(t.eggBoilTime({ size: 'M', start: 'fridge', doneness: 'kayisi' }).seconds), '8 dk');
  assert.equal(t.formatMinutes(t.eggBoilTime({ size: 'S', start: 'fridge', doneness: 'rafadan' }).seconds), '5 dk 30 sn');
});

test('parity with mobile: pasta shapes, package window, timer window, water and salt', () => {
  assert.deepEqual(t.PASTA_SHAPES.map(s => [s.id, s.label, s.minutes]), [
    ['spagetti', 'Spagetti', 9], ['linguine', 'Linguine', 10], ['penne', 'Penne', 11], ['burgu', 'Burgu', 10],
    ['fiyonk', 'Fiyonk', 11], ['rigatoni', 'Rigatoni', 12], ['eriste', 'Erişte', 8], ['taze', 'Taze makarna', 3],
  ]);
  assert.deepEqual(t.PASTA_TEXTURES.map(x => x.id), ['al_dente', 'yumusak']);
  assert.deepEqual(t.PASTA_PACKAGE_RANGE, [2, 20]);
  assert.deepEqual(t.PASTA_TIMER_RANGE, [2, 20]);
  assert.deepEqual(t.PASTA_PORTION_RANGE, [1, 10]);
  const mobile = {
    spagetti: [480, 600], linguine: [540, 660], penne: [600, 720], burgu: [540, 660],
    fiyonk: [600, 720], rigatoni: [660, 780], eriste: [420, 540], taze: [120, 240],
  };
  for (const [type, [alDente, soft]] of Object.entries(mobile)) {
    assert.equal(t.pastaCookTime({ type, texture: 'al_dente' }).seconds, alDente, `${type} al dente`);
    assert.equal(t.pastaCookTime({ type, texture: 'yumusak' }).seconds, soft, `${type} yumuşak`);
  }
  const pkg = (packageMinutes, texture) => t.pastaCookTime({ type: 'paket', packageMinutes, texture });
  assert.equal(pkg(12, 'al_dente').seconds, 11 * 60);
  assert.equal(pkg(7.5, 'yumusak').seconds, 8.5 * 60);
  assert.equal(pkg(20, 'yumusak').seconds, 20 * 60, 'clamped');
  assert.equal(pkg(2, 'al_dente').seconds, 2 * 60, 'clamped');
  for (const bad of [0, 1, 1.5, 21, 90, NaN, -5]) assert.equal(pkg(bad, 'al_dente').ok, false, String(bad));
  const salt = {
    1: 'yaklaşık ¾ tatlı kaşığı', 2: 'yaklaşık 1 ¾ tatlı kaşığı', 3: 'yaklaşık 2 ½ tatlı kaşığı',
    5: 'yaklaşık 2 ¾ yemek kaşığı', 7: 'yaklaşık 4 yemek kaşığı', 10: 'yaklaşık 5 ½ yemek kaşığı',
  };
  for (const [portions, hint] of Object.entries(salt)) assert.equal(t.pastaWaterSalt(Number(portions)).saltHint, hint, portions);
  assert.equal(t.pastaWaterSalt(6).note, null);
  assert.ok(t.pastaWaterSalt(7).note, 'more than 6 L: split the batch');
  assert.equal(t.spoonHint(10, 'tuz'), 'yaklaşık ¾ tatlı kaşığı');
  assert.equal(t.spoonHint(20, 'tuz'), 'yaklaşık 1 ¾ tatlı kaşığı');
  assert.equal(t.spoonHint(60, 'tuz'), 'yaklaşık 3 ¼ yemek kaşığı');
  assert.equal(t.spoonHint(10, 'kinoa'), '');
});

test('parity with mobile: drying temperatures, times and sun rules', () => {
  const mobile = {
    'domates/firin': ['60–70 °C', '6–12 saat'], 'domates/makine': ['55–60 °C', '8–16 saat'], 'domates/gunes': ['Hava en az 30 °C', '4–8 gün'],
    'biber/firin': ['60–70 °C', '6–10 saat'], 'biber/makine': ['55–60 °C', '8–12 saat'], 'biber/gunes': null,
    'patlican/firin': ['60–70 °C', '4–8 saat'], 'patlican/makine': ['55–60 °C', '6–10 saat'], 'patlican/gunes': null,
    'elma/firin': ['60–70 °C', '5–10 saat'], 'elma/makine': ['55–60 °C', '6–12 saat'], 'elma/gunes': ['Hava en az 30 °C', '2–4 gün'],
    'armut/firin': ['60–70 °C', '6–12 saat'], 'armut/makine': ['55–60 °C', '8–14 saat'], 'armut/gunes': ['Hava en az 30 °C', '3–5 gün'],
    'kayisi/firin': ['60–70 °C', '12–20 saat'], 'kayisi/makine': ['55–60 °C', '18–30 saat'], 'kayisi/gunes': ['Hava en az 30 °C', '3–6 gün'],
    'mantar/firin': ['55–65 °C', '3–6 saat'], 'mantar/makine': ['50–55 °C', '4–8 saat'], 'mantar/gunes': null,
    'nane/firin': ['40–50 °C', '1–3 saat'], 'nane/makine': ['35–45 °C', '2–4 saat'], 'nane/gunes': ['Gölgede, oda sıcaklığı', '5–10 gün'],
    'kekik/firin': ['40–50 °C', '1–2 saat'], 'kekik/makine': ['35–45 °C', '2–4 saat'], 'kekik/gunes': ['Gölgede, oda sıcaklığı', '5–10 gün'],
  };
  assert.deepEqual(t.DRYING_METHODS.map(m => m.id), ['firin', 'makine', 'gunes']);
  assert.deepEqual(t.DRYING_TEMP_LIMITS, { sebze: [50, 70], meyve: [50, 70], ot: [35, 50] });
  for (const [key, expected] of Object.entries(mobile)) {
    const [food, method] = key.split('/');
    const plan = t.dryingPlan(food, method);
    if (expected === null) {
      assert.equal(plan.error, 'not_recommended', key);
      assert.deepEqual(plan.alternatives, ['firin', 'makine'], key);
    } else {
      assert.equal(plan.ok, true, key);
      assert.deepEqual([plan.tempLabel, plan.timeLabel], expected, key);
    }
  }
});

test('parity with mobile: converter units, densities, rounding, limits and hiding', () => {
  const ml = Object.fromEntries(t.MEASURE_UNITS.map(u => [u.id, u.ml]));
  assert.deepEqual(ml, { su_bardagi: 200, cay_bardagi: 100, yemek_kasigi: 15, tatli_kasigi: 10, cay_kasigi: 5, ml: 1, g: null });
  const mobileDensity = {
    un: 0.55, seker: 0.85, pudra_sekeri: 0.56, pirinc: 0.85, bulgur: 0.75, mercimek: 0.85, tuz: 1.2, tereyagi: 0.91, sut: 1.03,
    su: 1, yogurt: 1.05, sivi_yag: 0.92, zeytinyagi: 0.91, bal: 1.42, kakao: 0.42, irmik: 0.75, nisasta: 0.55,
  };
  for (const [id, density] of Object.entries(mobileDensity)) assert.equal(t.ingredientDensity(id).density, density, id);
  assert.equal(t.ingredientDensity('Buğday Unu').id, 'un');
  assert.equal(t.ingredientDensity('TOZ ŞEKER').id, 'seker');
  assert.equal(t.ingredientDensity('İRMİK').id, 'irmik');
  assert.equal(t.ingredientDensity('SIVI YAĞ').id, 'sivi_yag');
  for (const name of ['un', 'şeker', 'pudra şekeri', 'pirinç', 'tuz', 'tereyağı', 'süt', 'su', 'yağ', 'kakao', 'irmik']) assert.ok(t.ingredientDensity(name), name);
  for (const unknown of ['kinoa', 'chia', 'diger', '', null, undefined]) assert.equal(t.ingredientDensity(unknown), null, String(unknown));

  const c = (amount, from, to, ingredient) => t.convertMeasure({ amount, from, to, ingredient });
  const text = (...args) => c(...args).result.text;
  assert.equal(text('1', 'su_bardagi', 'ml'), '200 ml');
  assert.equal(text('1', 'su_bardagi', 'cay_bardagi'), '2 çay bardağı');
  assert.equal(text('1', 'yemek_kasigi', 'cay_kasigi'), '3 çay kaşığı');
  assert.equal(text('1,5', 'su_bardagi', 'ml'), '300 ml');
  assert.equal(text('1/2', 'su_bardagi', 'yemek_kasigi'), '6 ¾ yemek kaşığı');
  assert.equal(text('100', 'ml', 'su_bardagi'), '½ su bardağı');
  assert.equal(text('2', 'tatli_kasigi', 'yemek_kasigi'), '1 ¼ yemek kaşığı');
  assert.equal(c('1', 'su_bardagi', 'ml', 'bilinmeyen').ok, true, 'volume ↔ volume needs no ingredient');
  assert.equal(text('1', 'su_bardagi', 'g', 'un'), '110 g');
  assert.equal(text('1', 'su_bardagi', 'g', 'seker'), '170 g');
  assert.equal(text('1', 'su_bardagi', 'g', 'su'), '200 g');
  assert.equal(text('1', 'su_bardagi', 'g', 'sut'), '205 g');
  assert.equal(text('1', 'yemek_kasigi', 'g', 'tereyagi'), '14 g');
  assert.equal(text('1', 'cay_kasigi', 'g', 'tuz'), '6 g');
  assert.equal(text('1', 'yemek_kasigi', 'g', 'kakao'), '6,5 g');
  assert.equal(text('250', 'g', 'su_bardagi', 'un'), '2 ¼ su bardağı');
  assert.equal(text('100', 'g', 'ml', 'seker'), '120 ml');
  assert.equal(text('100', 'g', 'g', null), '100 g', 'g → g needs no density');

  // Limits: 10 L, grams count through their density (mobile).
  for (const bad of ['', '0', '-1', 'abc', '1/0', '1..5', null]) assert.equal(c(bad, 'su_bardagi', 'ml').ok, false, String(bad));
  assert.deepEqual(c('51', 'su_bardagi', 'ml'), { ok: false, error: 'too_large' }, '> 10 L');
  assert.deepEqual(c('20000', 'g', 'ml', 'su'), { ok: false, error: 'too_large' }, '> 10 kg');
  assert.equal(text('50', 'su_bardagi', 'ml'), '10000 ml');
  assert.equal(t.MEASURE_MAX_ML, 10000);

  // Rounding and formatting.
  assert.equal(t.roundMeasure(3.26, 'g'), 3.5);
  assert.equal(t.roundMeasure(47.4, 'ml'), 47);
  assert.equal(t.roundMeasure(117.6, 'ml'), 120);
  assert.equal(t.roundMeasure(1234, 'g'), 1230);
  assert.equal(t.formatMeasure(1.5, 'su_bardagi'), '1 ½ su bardağı');
  assert.equal(t.formatMeasure(0.25, 'cay_kasigi'), '¼ çay kaşığı');
  assert.equal(t.formatMeasure(6.5, 'g'), '6,5 g');

  // Rows (main result + others) hide cups/spoons outside ¼–20, exactly like mobile converterRows.
  const rows = (amount, from, ingredient, to) => {
    const r = c(amount, from, to, ingredient);
    return [r.result, ...r.others].filter(x => !x.outOfRange).map(x => x.unit);
  };
  const order = units => t.MEASURE_UNITS.map(u => u.id).filter(id => units.includes(id));
  assert.deepEqual(order(rows('1000', 'ml', 'su', 'su_bardagi')), ['su_bardagi', 'cay_bardagi', 'g'], '66 yemek kaşığı is not a useful answer');
  assert.deepEqual(order(rows('1', 'cay_kasigi', 'un', 'ml')), ['yemek_kasigi', 'tatli_kasigi', 'ml', 'g']);
  assert.ok(!c('1', 'su_bardagi', 'ml', null).others.some(o => o.unit === 'g'), 'grams refused without ingredient');
  assert.equal(c('100', 'g', 'ml', null).ok, false, 'from grams without ingredient: refused');
});

/* --------------------------------------------------------------- JSON-LD */

test('tools page JSON-LD: CollectionPage with four free WebApplications and breadcrumbs', () => {
  const [page, crumbs] = t.guideToolsJsonLd('https://tariften.com', 'Açıklama');
  assert.equal(page['@type'], 'CollectionPage');
  assert.equal(page.url, 'https://tariften.com/rehber/araclar');
  assert.equal(page.mainEntity.numberOfItems, 4);
  const apps = page.mainEntity.itemListElement.map(x => x.item);
  assert.deepEqual(apps.map(a => a.url), ['yumurta', 'makarna', 'kurutma', 'olcu'].map(a => `https://tariften.com/rehber/araclar#${a}`));
  for (const app of apps) {
    assert.equal(app['@type'], 'WebApplication');
    assert.equal(app.offers.price, '0');
    assert.equal(app.isAccessibleForFree, true);
  }
  assert.equal(crumbs['@type'], 'BreadcrumbList');
  assert.equal(crumbs.itemListElement[2].item, 'https://tariften.com/rehber/araclar');
});

/* ---------------------------------------------------- wiring (source scan) */

test('wiring: guide page renders the tool, list header links the tools page, sitemap and CI include it', () => {
  const detail = read('src/app/rehber/[slug]/page.tsx');
  assert.match(detail, /GuideToolCard/);
  assert.match(detail, /guide\.tool/);
  assert.match(read('src/app/rehber/page.tsx'), /GUIDE_TOOLS_PATH|\/rehber\/araclar/);
  const toolsPage = read('src/app/rehber/araclar/page.tsx');
  assert.match(toolsPage, /canonical/);
  assert.match(toolsPage, /guideToolsJsonLd/);
  assert.match(read('src/app/sitemap.ts'), /\/rehber\/araclar/);
  assert.match(read('.github/workflows/frontend-ci.yml'), /check-guide-tools\.test\.cjs/);
  const card = read('src/components/guide/tools/GuideToolCard.tsx');
  assert.match(card, /Tüm mutfak araçları/);
  const timer = read('src/components/guide/tools/KitchenTimer.tsx');
  assert.match(timer, /role="timer"/);
  assert.match(timer, /visibilitychange/);
  assert.match(timer, /AudioContext/);
  assert.doesNotMatch(timer, /\.(mp3|wav|ogg)\b/, 'beep is synthesised, no audio files');
});
