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
  assert.equal(t.eggBoilTime({ size: 'M', start: 'fridge', doneness: 'kayisi' }).seconds, 450);
  assert.equal(t.eggBoilTime({ size: 'M', start: 'fridge', doneness: 'kati' }).seconds, 660);
});

test('egg: size, room temperature and altitude adjust in 15 s steps', () => {
  assert.equal(t.eggBoilTime({ size: 'XL', doneness: 'kayisi' }).seconds, 540);
  assert.equal(t.eggBoilTime({ size: 'L', doneness: 'rafadan' }).seconds, 405);
  assert.equal(t.eggBoilTime({ size: 'M', start: 'room', doneness: 'rafadan' }).seconds, 300);
  assert.equal(t.eggBoilTime({ size: 'M', doneness: 'kati', altitude: 'mid' }).seconds, 720);
  assert.equal(t.eggBoilTime({ size: 'M', doneness: 'kati', altitude: 'high' }).seconds, 780);
  // Junk falls back to M / buzdolabı / kayısı / sea level.
  assert.deepEqual(t.eggBoilTime({ size: 'XXL', start: 'oven', doneness: 'raw', altitude: 'moon' }),
    { seconds: 450, size: 'M', start: 'fridge', altitude: 'low', doneness: 'kayisi', forcedFullySet: false });
});

test('egg: every combination stays inside its safe range; katı is never under 10 minutes', () => {
  for (const size of t.EGG_SIZES) for (const start of t.EGG_STARTS) for (const altitude of t.EGG_ALTITUDES) {
    for (const d of t.EGG_DONENESS) for (const sensitive of [false, true]) {
      const r = t.eggBoilTime({ size: size.id, start: start.id, altitude: altitude.id, doneness: d.id, sensitive });
      const level = t.EGG_DONENESS.find(x => x.id === r.doneness);
      assert.ok(r.seconds >= level.min && r.seconds <= level.max, JSON.stringify(r));
      assert.equal(r.seconds % 15, 0);
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
  assert.deepEqual(t.pastaCookTime({ type: 'spagetti', texture: 'aldente' }), { ok: true, seconds: 480, precook: false, packageMinutes: 9, texture: 'aldente' });
  assert.equal(t.pastaCookTime({ type: 'spagetti', texture: 'yumusak' }).seconds, 600);
  assert.equal(t.pastaCookTime({ type: 'penne' }).seconds, 600, 'al dente by default');
  assert.equal(t.pastaCookTime({ type: 'unknown' }).packageMinutes, 9, 'unknown type falls back to spagetti');
  const laz = t.pastaCookTime({ type: 'lazanya', texture: 'yumusak' });
  assert.equal(laz.precook, true);
  assert.equal(laz.texture, null);
  assert.equal(laz.seconds, 240, 'lazanya sheets are only pre-cooked');
});

test('pasta: typed package time is parsed and bounded (2–30 min); nonsense is refused', () => {
  assert.equal(t.pastaCookTime({ type: 'paket', packageMinutes: '12', texture: 'aldente' }).seconds, 660);
  assert.equal(t.pastaCookTime({ type: 'paket', packageMinutes: '8,5', texture: 'yumusak' }).seconds, 570);
  assert.equal(t.pastaCookTime({ type: 'paket', packageMinutes: 2, texture: 'aldente' }).seconds, 120, 'never below 2 minutes');
  for (const bad of ['', 'abc', '0', '-5', '1', '31', '600', null, undefined, NaN, Infinity]) {
    assert.deepEqual(t.pastaCookTime({ type: 'paket', packageMinutes: bad }), { ok: false, error: 'invalid_package_time' }, String(bad));
  }
  for (const p of t.PASTA_TYPES) {
    for (const texture of ['aldente', 'yumusak']) {
      const r = t.pastaCookTime({ type: p.id, texture });
      assert.ok(r.ok && r.seconds >= t.PASTA_MIN_SECONDS && r.seconds <= (t.PASTA_PACKAGE_MAX + 1) * 60);
    }
  }
});

test('pasta: 1 L water and 10 g salt per 100 g, scaled linearly, portion clamped', () => {
  assert.deepEqual(t.pastaWaterSalt(100), { grams: 100, waterLiters: 1, saltGrams: 10, saltSpoon: { amount: 1.5, unit: 'çay kaşığı' }, servings: 1 });
  const r = t.pastaWaterSalt(250);
  assert.equal(r.waterLiters, 2.5);
  assert.equal(r.saltGrams, 25);
  assert.deepEqual(r.saltSpoon, { amount: 1.5, unit: 'yemek kaşığı' });
  assert.equal(t.pastaWaterSalt(500).waterLiters, 5);
  assert.equal(t.pastaWaterSalt(500).saltGrams, 50);
  for (let grams = 50; grams <= 1000; grams += 50) {
    const x = t.pastaWaterSalt(grams);
    assert.equal(x.waterLiters, grams / 100);
    assert.equal(x.saltGrams, grams / 10);
    assert.equal(x.saltGrams / x.waterLiters, 10, '10 g salt per litre');
  }
  assert.equal(t.pastaWaterSalt(10).grams, 50);
  assert.equal(t.pastaWaterSalt(99999).grams, 1000);
  assert.equal(t.pastaWaterSalt(-3).grams, 50);
  assert.equal(t.pastaWaterSalt('abc').grams, 200);
  assert.equal(t.pastaWaterSalt(130).grams, 150, 'rounded to 50 g steps');
});

/* ---------------------------------------------------------------- drying */

test('drying: every temperature sits inside the safe bounds; times are sane', () => {
  assert.deepEqual(t.DRYING_SAFE_BOUNDS, { produce: { min: 50, max: 70 }, herb: { min: 35, max: 50 } });
  for (const food of t.DRYING_FOODS) {
    assert.ok(food.prep && food.ready && food.storage, food.id);
    for (const method of t.DRYING_METHODS) {
      const plan = food.methods[method.id];
      if (!plan) {
        assert.ok(food.unsupported && food.unsupported[method.id], `${food.id}/${method.id} needs a reason`);
        continue;
      }
      if (method.id === 'sun') assert.equal(plan.temperature, null, 'no fake temperature for sun drying');
      else {
        assert.ok(plan.temperature, `${food.id}/${method.id}`);
        assert.ok(t.dryingRangeIsSafe(food.kind, plan.temperature), `${food.id}/${method.id} ${JSON.stringify(plan.temperature)}`);
      }
      assert.ok(plan.time.min > 0 && plan.time.min < plan.time.max, `${food.id}/${method.id} time`);
      assert.ok(plan.time.unit === 'saat' ? plan.time.max <= 30 : plan.time.max <= 14, `${food.id}/${method.id} time unit`);
      assert.equal(plan.time.unit === 'gün', method.id === 'sun', 'machines in hours, sun in days');
    }
  }
  assert.equal(t.dryingRangeIsSafe('produce', { min: 45, max: 60 }), false);
  assert.equal(t.dryingRangeIsSafe('produce', { min: 60, max: 80 }), false);
  assert.equal(t.dryingRangeIsSafe('herb', { min: 40, max: 60 }), false);
});

test('drying: no meat or fish; the reason is written down', () => {
  const ids = t.DRYING_FOODS.map(f => `${f.id} ${f.label}`.toLocaleLowerCase('tr-TR')).join(' ');
  assert.doesNotMatch(ids, /et\b|balık|jerky|pastırma|sucuk|tavuk|hamsi/);
  assert.match(t.DRYING_NO_MEAT_NOTE, /71 °C/);
  for (const name of ['domates', 'biber', 'patlican', 'elma', 'kayisi', 'mantar', 'nane-kekik']) {
    assert.ok(t.DRYING_FOODS.some(f => f.id === name), name);
  }
});

test('drying: plans, sun finishing step, herb shade, refusals', () => {
  const tomato = t.dryingPlan('domates', 'oven');
  assert.equal(tomato.ok, true);
  assert.deepEqual(tomato.plan.temperature, { min: 60, max: 70 });
  assert.equal(tomato.finish, null);
  const sun = t.dryingPlan('kayisi', 'sun');
  assert.match(sun.finish, /dondurucu/);
  assert.match(sun.methodNotes[0], /30 °C/);
  const herb = t.dryingPlan('nane-kekik', 'sun');
  assert.equal(herb.finish, null);
  assert.match(herb.methodNotes[0], /gölgede/);
  const mushroom = t.dryingPlan('mantar', 'sun');
  assert.equal(mushroom.ok, false);
  assert.equal(mushroom.error, 'unsupported');
  assert.deepEqual(mushroom.alternatives, ['oven', 'dehydrator']);
  assert.deepEqual(t.dryingPlan('sucuk', 'oven'), { ok: false, error: 'unknown_food' });
  assert.deepEqual(t.dryingPlan('domates', 'microwave'), { ok: false, error: 'unknown_method' });
  assert.equal(t.formatRange({ min: 6, max: 12 }, 'saat'), '6–12 saat');
});

/* --------------------------------------------------------------- measure */

test('measure: parses Turkish amounts and refuses nonsense', () => {
  assert.equal(t.parseAmount('2'), 2);
  assert.equal(t.parseAmount('1,5'), 1.5);
  assert.equal(t.parseAmount('1.5'), 1.5);
  assert.equal(t.parseAmount('1/2'), 0.5);
  assert.equal(t.parseAmount('1 1/2'), 1.5);
  assert.equal(t.parseAmount('1½'), 1.5);
  assert.equal(t.parseAmount('¾'), 0.75);
  assert.equal(t.parseAmount(3), 3);
  for (const bad of ['', '0', '-1', 'abc', '1/0', '2kg', '1,2,3', null, undefined, NaN, -2, 0, Infinity, '½½']) {
    assert.equal(t.parseAmount(bad), null, String(bad));
  }
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
  assert.equal(ok('1', 'su_bardagi', 'yemek_kasigi').text, '13¼ yemek kaşığı');
  assert.equal(ok('3', 'cay_kasigi', 'yemek_kasigi').text, '1 yemek kaşığı');
  assert.equal(ok('1', 'tatli_kasigi', 'cay_kasigi').text, '2 çay kaşığı');
  assert.equal(ok('150', 'ml', 'su_bardagi').text, '¾ su bardağı');
  assert.equal(ok('2', 'ml', 'su_bardagi').text, '¼ su bardağından az');
  assert.equal(ok('2', 'ml', 'su_bardagi').tooSmall, true);
  assert.equal(ok('1/2', 'cay_bardagi', 'ml').text, '50 ml');
});

test('measure: grams by density; level measures; sensible rounding', () => {
  const r = (amount, from, to, ingredient) => t.convertMeasure({ amount, from, to, ingredient }).result;
  assert.equal(r('1', 'su_bardagi', 'g', 'un').text, '110 g');
  assert.equal(r('1', 'su_bardagi', 'g', 'toz-seker').text, '170 g');
  assert.equal(r('1', 'su_bardagi', 'g', 'su').text, '200 g');
  assert.equal(r('1', 'su_bardagi', 'g', 'sut').text, '205 g');
  assert.equal(r('1', 'yemek_kasigi', 'g', 'tuz').text, '18 g');
  assert.equal(r('1', 'cay_kasigi', 'g', 'kabartma-tozu').text, '4 g');
  assert.equal(r('1', 'yemek_kasigi', 'g', 'kakao').text, '6 g');
  assert.equal(r('1', 'yemek_kasigi', 'g', 'un').text, '8,5 g');
  assert.equal(r('250', 'g', 'su_bardagi', 'un').text, '2¼ su bardağı');
  assert.equal(r('100', 'g', 'ml', 'tereyagi').text, '105 ml');
  assert.equal(r('500', 'g', 'g').text, '500 g', 'same unit needs no ingredient');
  assert.equal(t.roundMetric(0.04), 0.1);
  assert.equal(t.roundMetric(3.3), 3.5);
  assert.equal(t.roundMetric(47.6), 48);
  assert.equal(t.roundMetric(168), 170);
  for (const ing of t.MEASURE_INGREDIENTS) assert.ok(ing.density >= 0.3 && ing.density <= 1.5, ing.id);
});

test('measure: grams for an unknown ingredient, bad amounts and huge amounts are refused', () => {
  assert.deepEqual(t.convertMeasure({ amount: '1', from: 'su_bardagi', to: 'g' }), { ok: false, error: 'unknown_ingredient' });
  assert.deepEqual(t.convertMeasure({ amount: '1', from: 'su_bardagi', to: 'g', ingredient: 'kinoa' }), { ok: false, error: 'unknown_ingredient' });
  assert.deepEqual(t.convertMeasure({ amount: '100', from: 'g', to: 'ml', ingredient: '' }), { ok: false, error: 'unknown_ingredient' });
  assert.deepEqual(t.convertMeasure({ amount: '-1', from: 'ml', to: 'su_bardagi' }), { ok: false, error: 'invalid_amount' });
  assert.deepEqual(t.convertMeasure({ amount: 'bir', from: 'ml', to: 'su_bardagi' }), { ok: false, error: 'invalid_amount' });
  assert.deepEqual(t.convertMeasure({ amount: '1', from: 'kupa', to: 'ml' }), { ok: false, error: 'unknown_unit' });
  assert.deepEqual(t.convertMeasure({ amount: '101', from: 'su_bardagi', to: 'ml' }), { ok: false, error: 'too_large' });
  assert.deepEqual(t.convertMeasure({ amount: '20001', from: 'g', to: 'ml', ingredient: 'su' }), { ok: false, error: 'too_large' });
  assert.equal(t.convertMeasure({ amount: '100', from: 'su_bardagi', to: 'ml' }).ok, true, '20 L is the limit');
  for (const key of ['invalid_amount', 'unknown_unit', 'unknown_ingredient', 'too_large']) assert.ok(t.MEASURE_ERRORS[key]);
});

test('measure: other units list skips tiny and silly amounts', () => {
  const r = t.convertMeasure({ amount: '1', from: 'su_bardagi', to: 'g', ingredient: 'un' });
  const units = r.others.map(o => o.unit);
  assert.ok(units.includes('cay_bardagi'));
  assert.ok(units.includes('ml'));
  assert.ok(units.includes('yemek_kasigi'));
  assert.ok(!units.includes('cay_kasigi'), '40 çay kaşığı is not a useful answer (more than 20 units is skipped)');
  assert.ok(!units.includes('su_bardagi') && !units.includes('g'), 'from and to are not repeated');
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
