'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const MOBILE = path.join(ROOT, '..', 'tariften-mobile');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const hasMobile = fs.existsSync(path.join(MOBILE, 'lib', 'kitchen-merge.ts'));

/** Transpile a TS module and its relative imports (no node_modules). */
function loadTs(file, globals = {}, cache = new Map()) {
  const abs = path.resolve(file);
  if (cache.has(abs)) return cache.get(abs).exports;
  const out = ts.transpileModule(fs.readFileSync(abs, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  cache.set(abs, mod);
  const req = spec => {
    if (!spec.startsWith('.')) throw Error(`unexpected_import ${spec}`);
    return loadTs(path.join(path.dirname(abs), `${spec}.ts`), globals, cache);
  };
  const names = Object.keys(globals);
  Function('module', 'exports', 'require', ...names, out)(mod, mod.exports, req, ...names.map(n => globals[n]));
  return mod.exports;
}

const ks = loadTs(path.join(ROOT, 'src/lib/kitchen-sync.ts'));

/* ------------------------------------------------------------ parity */

test('kitchen-merge.ts is byte-identical to the app copy', { skip: !hasMobile && 'tariften-mobile not checked out next to tariften-web' }, () => {
  const web = fs.readFileSync(path.join(ROOT, 'src/lib/kitchen-merge.ts'));
  const app = fs.readFileSync(path.join(MOBILE, 'lib/kitchen-merge.ts'));
  assert.ok(web.equals(app), 'src/lib/kitchen-merge.ts must stay identical to tariften-mobile/lib/kitchen-merge.ts');
});

const SAMPLE = [
  { title: 'Menemen', ingredients: [
    { name: 'Domates', amount: '3', unit: 'adet' },
    { name: 'Yumurta', amount: '2', unit: 'adet' },
    { name: 'Tuz', amount: '', unit: '' },
    { name: 'Zeytinyağı', amount: '1/2', unit: 'Su Bardağı' },
  ] },
  { title: 'Çoban Salata', ingredients: [
    { name: 'domates', amount: '2', unit: 'adet' },
    { name: 'Zeytinyağı', amount: '1,5', unit: 'su bardağı' },
    { name: 'Tuz', amount: '1 tutam', unit: '' },
    { name: 'ŞALGAM  suyu', amount: '2-3', unit: 'ÇAY bardağı' },
    { ingredient_id: 41, name: 'Biber', amount: '1', unit: 'adet' },
  ] },
];

test('shopping row keys are the same function as the app (checked keys match across devices)', { skip: !hasMobile && 'tariften-mobile not checked out' }, () => {
  const app = loadTs(path.join(MOBILE, 'lib/shopping-list.ts'));
  const web = loadTs(path.join(ROOT, 'src/lib/menu-shopping-list.ts'));
  assert.deepEqual(web.buildShoppingList(SAMPLE), app.buildShoppingList(SAMPLE));
  const strip = src => src.replace(/^\/\*\*[\s\S]*?\*\/\s*/, '');
  assert.equal(strip(read('src/lib/menu-shopping-list.ts')), strip(fs.readFileSync(path.join(MOBILE, 'lib/shopping-list.ts'), 'utf8')),
    'code below the header comment is identical');
});

test('shopping rows from the kitchen document use the folded name|unit keys', () => {
  let s = ks.emptyKitchen();
  s = ks.addRecipeToShopping(s, { id: 1, slug: 'menemen', title: 'Menemen', ingredients: SAMPLE[0].ingredients }, 10);
  s = ks.addRecipeToShopping(s, { id: 2, slug: 'coban', title: 'Çoban Salata', ingredients: SAMPLE[1].ingredients }, 20);
  const keys = ks.shoppingRows(s).map(r => r.key);
  assert.deepEqual(keys, [
    'name:domates|adet', 'name:yumurta|adet', 'name:tuz|', 'name:zeytinyagi|su bardagi', 'name:salgam suyu|cay bardagi', 'name:biber|adet',
  ]);
  const rows = ks.kitchenListRows(ks.addManualItem(s, ' Ekmek ', 30));
  const tomato = rows.find(r => r.key === 'name:domates|adet');
  assert.equal(tomato.amount, '5 adet');
  assert.deepEqual(tomato.recipes, ['Menemen', 'Çoban Salata']);
  assert.equal(rows.find(r => r.key === 'name:zeytinyagi|su bardagi').amount, '2 Su Bardağı');
  assert.equal(rows.find(r => r.key === 'name:tuz|').amount, '1 tutam', 'parts as written, nothing estimated');
  assert.deepEqual(rows.at(-1), { key: 'manual:30', name: 'Ekmek', amount: '', recipes: [], manual: true });
  assert.match(ks.kitchenListText(rows), /^Alışveriş listem\n\n- 5 adet Domates\n/);
});

/* ------------------------------------------------------------ edits */

test('edits mirror the app store: ids, manual keys, replace-per-recipe, clearChecked', () => {
  let s = ks.emptyKitchen();
  s = ks.addToPlan(s, { id: 7, slug: 'mercimek', title: 'Mercimek', image: 'http://x/y.jpg' }, '2026-10-22', 1000);
  assert.deepEqual(s.plan[0], { id: '7-2026-10-22-1000', recipeId: 7, slug: 'mercimek', title: 'Mercimek', day: '2026-10-22', addedAt: 1000 },
    'non-https image is left out (Core rejects it)');
  s = ks.addToPlan(s, { id: 7, slug: 'mercimek', title: 'Mercimek', image: 'https://cdn/x.jpg' }, '2026-10-23', 1001);
  assert.equal(s.plan[1].image, 'https://cdn/x.jpg');
  s = ks.removeFromPlan(s, '7-2026-10-22-1000');
  assert.equal(s.plan.length, 1);

  s = ks.addRecipeToShopping(s, { id: 7, slug: 'mercimek', title: 'Mercimek', servings: 4, ingredients: [{ name: ' Mercimek ', amount: 1, unit: 'su bardağı' }, { name: '' }] }, 5);
  s = ks.addRecipeToShopping(s, { id: 7, slug: 'mercimek', title: 'Mercimek', servings: 4, ingredients: [{ name: 'Mercimek', amount: '2', unit: 'su bardağı' }] }, 6);
  assert.equal(s.shopping.length, 1, 'adding the same recipe replaces its source');
  assert.deepEqual(s.shopping[0], { recipeId: 7, slug: 'mercimek', title: 'Mercimek', servings: 4, ingredients: [{ name: 'Mercimek', amount: '2', unit: 'su bardağı' }], addedAt: 6 });
  assert.equal(ks.isInShopping(s, 7), true);

  s = ks.addManualItem(s, 'x'.repeat(100), 50);
  assert.equal(s.manual[0].key, 'manual:50');
  assert.equal(s.manual[0].name.length, 80);
  assert.equal(ks.addManualItem(s, '   ', 51), s, 'blank input is a no-op');
  s = ks.addManualItem(s, 'Süt', 52);
  s = ks.toggleChecked(s, 'manual:50');
  s = ks.toggleChecked(s, 'name:mercimek|su bardagi');
  s = ks.clearChecked(s);
  assert.deepEqual(s.manual.map(m => m.key), ['manual:52'], 'checked manual rows go');
  assert.deepEqual(s.checked, []);
  assert.equal(s.shopping.length, 1, 'recipe sources stay');
  s = ks.toggleChecked(ks.toggleChecked(s, 'manual:52'), 'manual:52');
  assert.deepEqual(s.checked, []);
  s = ks.removeManualItem(ks.toggleChecked(s, 'manual:52'), 'manual:52');
  assert.deepEqual([s.manual, s.checked], [[], []]);
  s = ks.removeRecipeFromShopping(s, 7);
  assert.equal(s.shopping.length, 0);
});

test('Monday-first weeks and local day keys', () => {
  const thu = new Date(2026, 9, 22); // Thursday
  const days = ks.weekDays(thu).map(d => ks.localDay(d));
  assert.deepEqual(days, ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']);
  assert.equal(ks.localDay(ks.weekDays(new Date(2026, 9, 25))[0]), '2026-10-19', 'Sunday belongs to the week that started Monday');
  assert.equal(ks.localDay(ks.weekAt(1, thu)[0]), '2026-10-26');
  assert.equal(ks.localDay(ks.weekAt(-1, thu)[6]), '2026-10-18');
  assert.deepEqual([...ks.DAY_LONG], ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']);
});

test('sanitize keeps only renderable rows; limits match Core', () => {
  const s = ks.sanitizeKitchen({ plan: [{ slug: 'a', day: '2026-1-1' }, { id: 'x', slug: 'b', day: '2026-10-22' }], shopping: [{ title: 'T', ingredients: [] }, { title: 1 }], manual: [{ name: 'a' }, {}], checked: ['a', 3] });
  assert.equal(s.plan.length, 1);
  assert.equal(s.shopping.length, 1);
  assert.equal(s.manual.length, 1);
  assert.deepEqual(s.checked, ['a']);
  assert.deepEqual(ks.sanitizeKitchen(null), ks.emptyKitchen());
  const corePath = path.join(ROOT, '..', 'tariften-core', 'includes', 'class-tariften-kitchen-sync.php');
  const core = fs.existsSync(corePath) ? fs.readFileSync(corePath, 'utf8') : null; // checked when Core sits next to the web repo
  for (const [key, value] of Object.entries({ plan: 200, shopping: 60, ingredients: 120, manual: 200, checked: 600 })) {
    assert.equal(ks.KITCHEN_LIMITS[key], value);
    if (core) assert.match(core, new RegExp(`'${key}'\\s*=>\\s*${value}`));
  }
  const big = { ...ks.emptyKitchen(), manual: Array.from({ length: 201 }, (_, i) => ({ key: `m${i}`, name: 'x', addedAt: i })) };
  assert.equal(ks.kitchenLimitField(big), 'manual');
});

/* ------------------------------------------------------------ sync engine */

function harness(responses) {
  const calls = [];
  const queue = [...responses];
  const timers = [];
  let clock = 1000;
  const fetch = async (url, options) => {
    const body = options.body ? JSON.parse(options.body) : undefined;
    calls.push({ url, method: options.method, headers: options.headers, body, cache: options.cache });
    const next = queue.shift();
    if (!next) throw Error('unexpected request');
    if (next.throws) throw Error('offline');
    const value = typeof next === 'function' ? next(body) : next;
    if (value.before) await value.before();
    return { status: value.status, json: async () => value.json };
  };
  const sync = ks.createKitchenSync({
    token: 'jwt-1', fetch, debounceMs: 800,
    setTimer: (fn, ms) => { const t = { fn, ms, live: true }; timers.push(t); return t; },
    clearTimer: t => { t.live = false; },
    now: () => ++clock,
  });
  const runTimers = async () => {
    for (let guard = 0; guard < 20; guard++) {
      const live = timers.filter(t => t.live);
      if (!live.length) return;
      for (const t of live) { t.live = false; t.fn(); }
      await settle();
    }
  };
  return { sync, calls, timers, runTimers, queue };
}
const settle = () => new Promise(resolve => setTimeout(resolve, 5));
const doc = (state, rev) => ({ status: 200, json: { success: true, state, rev, updated_at: '2026-10-22T10:00:00+00:00' } });
const conflict = (state, rev) => ({ status: 409, json: { code: 'kitchen_conflict', message: 'Liste başka bir cihazda değişti.', data: { status: 409, current: { state, rev, updated_at: null } } } });
const withManual = (...names) => ({ ...ks.emptyKitchen(), manual: names.map((n, i) => ({ key: `manual:${i + 1}`, name: n, addedAt: i + 1 })) });

test('load uses the same-origin route with bearer, no cache; edits debounce one PUT with base_rev', async () => {
  const h = harness([doc(withManual('Süt'), 4), body => doc(body.state, 5)]);
  await h.sync.load();
  assert.deepEqual(h.calls[0], { url: '/api/account/kitchen', method: 'GET', headers: { Authorization: 'Bearer jwt-1' }, body: undefined, cache: 'no-store' });
  const snap = h.sync.getSnapshot();
  assert.equal(snap.loaded, true);
  assert.equal(snap.rev, 4);
  assert.equal(snap.state.manual[0].name, 'Süt');

  assert.equal(h.sync.edit((s, at) => ks.addManualItem(s, 'Ekmek', at)), '');
  assert.equal(h.sync.edit(s => ks.toggleChecked(s, 'manual:1')), '');
  assert.equal(h.sync.getSnapshot().dirty, true, 'optimistic');
  assert.equal(h.sync.getSnapshot().state.manual.length, 2);
  assert.equal(h.timers.filter(t => t.live).length, 1, 'debounced to one pending write');
  assert.equal(h.timers.at(-1).ms, 800);
  await h.runTimers();
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1].method, 'PUT');
  assert.equal(h.calls[1].headers['Content-Type'], 'application/json');
  assert.equal(h.calls[1].body.base_rev, 4);
  assert.deepEqual(h.calls[1].body.state.checked, ['manual:1']);
  const after = h.sync.getSnapshot();
  assert.equal(after.rev, 5);
  assert.equal(after.dirty, false);
  assert.equal(after.status, 'ready');
  assert.deepEqual(after.base, after.state, 'server state adopted as base');
});

test('409: three-way merge with the server copy and PUT again (phone and web edits both kept)', async () => {
  const base = withManual('Süt');
  // The phone added "Yumurta" and unchecked nothing; the web adds "Ekmek" and removes "Süt".
  const phone = { ...base, manual: [...base.manual, { key: 'manual:9', name: 'Yumurta', addedAt: 9 }] };
  const h = harness([doc(base, 1), conflict(phone, 2), body => doc(body.state, 3)]);
  await h.sync.load();
  h.sync.edit(s => ks.removeManualItem(s, 'manual:1'));
  h.sync.edit((s, at) => ks.addManualItem(s, 'Ekmek', at));
  await h.runTimers();
  assert.equal(h.calls.length, 3);
  assert.equal(h.calls[1].body.base_rev, 1);
  assert.equal(h.calls[2].body.base_rev, 2, 'retry names the revision from the conflict');
  assert.deepEqual(h.calls[2].body.state.manual.map(m => m.name), ['Yumurta', 'Ekmek'], 'deleted on web stays deleted, added on phone kept');
  const snap = h.sync.getSnapshot();
  assert.equal(snap.rev, 3);
  assert.equal(snap.dirty, false);
  assert.deepEqual(snap.state.manual.map(m => m.name), ['Yumurta', 'Ekmek']);
});

test('409 retries stop after three merges and back off; local edits are kept', async () => {
  const base = withManual('Süt');
  const h = harness([doc(base, 1), conflict(withManual('Süt', 'A'), 2), conflict(withManual('Süt', 'B'), 3), conflict(withManual('Süt', 'C'), 4), conflict(withManual('Süt', 'D'), 5)]);
  await h.sync.load();
  h.sync.edit((s, at) => ks.addManualItem(s, 'Ekmek', at));
  h.timers.filter(t => t.live).forEach(t => { t.live = false; t.fn(); });
  await settle();
  assert.equal(h.calls.filter(c => c.method === 'PUT').length, 4, 'first PUT + three merged retries');
  const snap = h.sync.getSnapshot();
  assert.equal(snap.status, 'error');
  assert.equal(snap.dirty, true);
  assert.ok(snap.state.manual.some(m => m.name === 'Ekmek'));
  assert.equal(snap.rev, 5, 'remembers the newest server revision');
  const retry = h.timers.filter(t => t.live);
  assert.equal(retry.length, 1);
  assert.ok(retry[0].ms >= 5000, 'retries later instead of hammering');
});

test('edits made while a PUT is in flight are kept and written next (adopt)', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const h = harness([doc(ks.emptyKitchen(), 0), body => ({ ...doc(body.state, 1), before: () => gate }), body => doc(body.state, 2)]);
  await h.sync.load();
  h.sync.edit((s, at) => ks.addManualItem(s, 'Süt', at));
  h.timers.filter(t => t.live).forEach(t => { t.live = false; t.fn(); });
  await settle();
  assert.equal(h.sync.getSnapshot().status, 'saving');
  h.sync.edit((s, at) => ks.addManualItem(s, 'Ekmek', at)); // while the first PUT waits
  release();
  await settle();
  const mid = h.sync.getSnapshot();
  assert.deepEqual(mid.state.manual.map(m => m.name), ['Süt', 'Ekmek'], 'in-flight edit not lost');
  assert.equal(mid.rev, 1);
  assert.equal(mid.dirty, true);
  await h.runTimers();
  const puts = h.calls.filter(c => c.method === 'PUT');
  assert.equal(puts.length, 2);
  assert.equal(puts[1].body.base_rev, 1);
  assert.deepEqual(puts[1].body.state.manual.map(m => m.name), ['Süt', 'Ekmek']);
  assert.equal(h.sync.getSnapshot().dirty, false);
});

test('refresh (window focus) adopts remote changes; with unsaved edits it merges and writes', async () => {
  const h = harness([doc(withManual('Süt'), 1), doc(withManual('Süt', 'Yumurta'), 2), doc(withManual('Süt', 'Yumurta', 'Un'), 3), body => doc(body.state, 4)]);
  await h.sync.load();
  await h.sync.refresh();
  assert.deepEqual(h.sync.getSnapshot().state.manual.map(m => m.name), ['Süt', 'Yumurta']);
  assert.equal(h.sync.getSnapshot().dirty, false);
  h.sync.edit(s => ks.toggleChecked(s, 'manual:1'));
  await h.sync.refresh();
  assert.equal(h.sync.getSnapshot().rev, 3);
  await h.runTimers();
  const put = h.calls.find(c => c.method === 'PUT');
  assert.equal(put.body.base_rev, 3);
  assert.deepEqual(put.body.state.checked, ['manual:1']);
  assert.equal(put.body.state.manual.length, 3);
});

test('network errors keep local edits; 400/413 restore the account copy; limits refuse edits up front', async () => {
  const h = harness([doc(withManual('Süt'), 1), { throws: true }, { status: 413, json: { code: 'kitchen_too_large', message: 'Liste çok büyüdü; tamamlananları temizleyip yeniden dene.', data: { status: 413 } } }]);
  await h.sync.load();
  h.sync.edit((s, at) => ks.addManualItem(s, 'Ekmek', at));
  h.timers.filter(t => t.live).forEach(t => { t.live = false; t.fn(); });
  await settle();
  let snap = h.sync.getSnapshot();
  assert.equal(snap.status, 'error');
  assert.match(snap.error, /Bağlantı kurulamadı/);
  assert.equal(snap.state.manual.length, 2);
  await h.sync.flush();
  snap = h.sync.getSnapshot();
  assert.match(snap.error, /çok büyüdü/);
  assert.deepEqual(snap.state.manual.map(m => m.name), ['Süt']);
  assert.equal(snap.dirty, false);

  const full = { ...ks.emptyKitchen(), shopping: Array.from({ length: 60 }, (_, i) => ({ recipeId: i + 1, slug: `r${i}`, title: `R${i}`, servings: null, ingredients: [], addedAt: i })) };
  const g = harness([doc(full, 1)]);
  await g.sync.load();
  const msg = g.sync.edit((s, at) => ks.addRecipeToShopping(s, { id: 999, slug: 'x', title: 'X', ingredients: [] }, at));
  assert.match(msg, /en fazla 60 tarif/);
  assert.equal(g.sync.getSnapshot().state.shopping.length, 60);
  assert.equal(g.timers.filter(t => t.live).length, 0);
});

/* ------------------------------------------------------------ source contracts */

test('proxy route forwards GET/PUT to Core /me/kitchen with bearer only, no cache', () => {
  const route = read('src/app/api/account/kitchen/route.ts');
  assert.match(route, /wp-json\/tariften\/v1\/me\/kitchen"/);
  for (const verb of ['GET', 'PUT']) assert.match(route, new RegExp(`export async function ${verb}\\(`));
  assert.doesNotMatch(route, /export async function DELETE/);
  assert.match(route, /\^Bearer\\s\+\\S\+\$/);
  assert.match(route, /private, no-store/);
  assert.match(route, /cache: "no-store"/);
  assert.match(route, /status: upstream\.status/, '409 with data.current passes through');
});

test('pages: signed-out prompt with callback, no device-only list; header + middleware', () => {
  const week = read('src/app/bu-hafta/WeekScreen.tsx');
  const shop = read('src/app/alisveris/ShoppingScreen.tsx');
  const parts = read('src/components/kitchen/KitchenParts.tsx');
  assert.match(week, /Haftanın \*sofrası\.\*/);
  assert.match(shop, /Alışveriş \*listen\.\*/);
  assert.match(week, /callbackPath="\/bu-hafta"/);
  assert.match(shop, /callbackPath="\/alisveris"/);
  assert.match(parts, /\/login\?callbackUrl=\$\{encodeURIComponent\(callbackPath\)\}/);
  assert.match(week, /getRecipe\(slug\)/, 'ingredients fetched at click time');
  for (const file of ['src/context/KitchenContext.tsx', 'src/lib/kitchen-sync.ts', 'src/components/kitchen/ShoppingList.tsx', 'src/components/kitchen/WeekPlanner.tsx']) {
    assert.doesNotMatch(read(file), /localStorage|sessionStorage|indexedDB/, `${file}: no device-only list`);
  }
  const list = read('src/components/kitchen/ShoppingList.tsx');
  assert.match(list, /Liste hesabına kaydedilir; uygulamada da aynısını görürsün\. Miktarlar tariflerde yazdığı gibidir; kişi sayısına göre ölçeklenmez\./);
  assert.match(list, /İşaretlileri temizle/);
  assert.match(list, /role="checkbox" aria-checked=\{checked\}/);
  assert.match(list, /navigator\.clipboard\.writeText\(kitchenListText/);
  const planner = read('src/components/kitchen/WeekPlanner.tsx');
  assert.match(planner, /Önceki hafta/);
  assert.match(planner, /Sonraki hafta/);
  assert.match(planner, /href=\{`\/recipe\/\$\{entry\.slug\}`\}/);
  assert.match(planner, /href="\/recipes"/);
  const header = read('src/components/layout/Header.tsx');
  assert.match(header, /href: "\/bu-hafta", label: "Bu Hafta"/);
  assert.match(header, /href: "\/alisveris"/);
  const mw = read('src/middleware.ts');
  assert.match(mw, /'\/cookbook', '\/bu-hafta', '\/alisveris'/);
  const login = read('src/app/login/page.tsx');
  assert.match(login, /safeCallbackPath\(new URLSearchParams\(window\.location\.search\)\.get\("callbackUrl"\)\)/);
  const ctx = read('src/context/KitchenContext.tsx');
  assert.match(ctx, /addEventListener\("focus", onFocus\)/);
  assert.match(read('src/app/layout.tsx'), /<KitchenProvider>/);
});

test('login callback accepts only same-site paths', () => {
  const { safeCallbackPath } = loadTs(path.join(ROOT, 'src/lib/login-callback.ts'));
  assert.equal(safeCallbackPath('/bu-hafta'), '/bu-hafta');
  assert.equal(safeCallbackPath('/recipe/mercimek-corbasi'), '/recipe/mercimek-corbasi');
  assert.equal(safeCallbackPath(null), '/profile');
  for (const bad of ['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '/login?callbackUrl=/x', '']) {
    assert.equal(safeCallbackPath(bad), '/profile', bad);
  }
});

test('recipe page offers Haftaya ekle (this + next week, today default) and the shopping toggle', () => {
  const page = read('src/app/recipe/[slug]/page.tsx');
  assert.match(page, /<RecipeKitchenActions recipe=\{\{/);
  const ui = read('src/components/recipe/RecipeKitchenActions.tsx');
  assert.match(ui, /"Haftaya ekle"/);
  assert.match(ui, /"Alışverişte" : "Alışverişe ekle"/);
  assert.match(ui, /useState\(today\)/);
  assert.match(ui, /value === 0 \? "Bu hafta" : "Gelecek hafta"/);
  assert.match(ui, /DAY_LONG\[i\]/);
  assert.match(ui, /\/login\?callbackUrl=\$\{encodeURIComponent\(pathname\)\}/);
  assert.match(ui, /role="dialog" aria-modal="true"/);
});
