'use strict';
/* Personal recipe notes (Notum / Notlarım, Core P11) and the opt-in
 * "Evime göre uyarla (N kişi)" household flag on POST /ai/generate.
 * Offline: TS modules are transpiled and run against a fake fetch. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const transpile = file => ts.transpileModule(read(file), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function load(file, modules = {}) {
  const mod = { exports: {} };
  const req = name => {
    if (Object.prototype.hasOwnProperty.call(modules, name)) return modules[name];
    throw Error(`unexpected_import ${name}`);
  };
  Function('module', 'exports', 'require', transpile(file))(mod, mod.exports, req);
  return mod.exports;
}

/** Replaces global fetch; records every call and answers from a queue. */
function fakeFetch(...answers) {
  const calls = [];
  const original = global.fetch;
  global.fetch = async (url, init = {}) => {
    calls.push({ url, init, body: init.body === undefined ? undefined : JSON.parse(init.body) });
    const next = answers.length > 1 ? answers.shift() : answers[0];
    const { status = 200, body = { success: true } } = next || {};
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
  return { calls, restore: () => { global.fetch = original; } };
}

const notes = load('src/lib/recipe-notes.ts');
const household = load('src/lib/household-adapt.ts');

/* ------------------------------------------------------------ notes client */

const NOTE = {
  recipe_id: 1234, note: 'Tuzu azalt,\n10 dk fazla pişir.',
  created_at: '2026-10-22T08:14:03+00:00', updated_at: '2026-10-22T09:02:41+00:00',
};

test('notes: GET my-note goes to the same-origin no-store route with the bearer token', async () => {
  const f = fakeFetch({ body: { success: true, recipe_id: 1234, note: NOTE, max_length: 2000 } }, { body: { success: true, recipe_id: 7, note: null, max_length: 2000 } });
  try {
    const note = await notes.getMyNote('jwt', 1234);
    assert.deepEqual(note, { recipeId: 1234, note: NOTE.note, createdAt: NOTE.created_at, updatedAt: NOTE.updated_at });
    assert.equal(f.calls[0].url, '/api/account/recipe-notes/1234');
    assert.equal(f.calls[0].init.method, 'GET');
    assert.equal(f.calls[0].init.cache, 'no-store');
    assert.equal(f.calls[0].init.next, undefined, 'never ISR');
    assert.equal(f.calls[0].init.headers.Authorization, 'Bearer jwt');
    assert.equal(await notes.getMyNote('jwt', 7), null, 'note: null → no note');
  } finally { f.restore(); }
});

test('notes: save is a PUT with { note }; empty or whitespace-only save deletes instead', async () => {
  const f = fakeFetch({ status: 201, body: { success: true, note: NOTE, created: true, deleted: false } }, { body: { success: true, deleted: true } });
  try {
    const saved = await notes.saveMyNote('jwt', 1234, '  Tuzu azalt,\r\n10 dk fazla pişir.  ');
    assert.equal(saved.note, NOTE.note, 'shows the server-cleaned text');
    assert.equal(f.calls[0].url, '/api/account/recipe-notes/1234');
    assert.equal(f.calls[0].init.method, 'PUT');
    assert.equal(f.calls[0].init.cache, 'no-store');
    assert.equal(f.calls[0].init.headers['Content-Type'], 'application/json');
    assert.deepEqual(f.calls[0].body, { note: '  Tuzu azalt,\r\n10 dk fazla pişir.  ' });

    assert.equal(await notes.saveMyNote('jwt', 1234, '   \n\t '), null);
    assert.equal(f.calls[1].init.method, 'DELETE', 'empty save → DELETE');
    assert.equal(f.calls[1].url, '/api/account/recipe-notes/1234');
    assert.equal(f.calls[1].body, undefined);

    await notes.deleteMyNote('jwt', 1234);
    assert.equal(f.calls[2].init.method, 'DELETE');
    assert.equal(f.calls.length, 3);
  } finally { f.restore(); }
});

test('notes: 2,000 characters counted like Core (Turkish letters once); longer is refused before any request', async () => {
  assert.equal(notes.NOTE_MAX_LENGTH, 2000);
  assert.equal(notes.noteLength('şğüçöı'), 6);
  assert.equal(notes.noteLength('🍋'), 1);
  assert.equal(notes.isNoteTooLong('ş'.repeat(2000)), false);
  assert.equal(notes.isNoteTooLong(`  ${'ş'.repeat(2000)}  `), false, 'trimmed like Core');
  assert.equal(notes.isNoteTooLong('a'.repeat(2001)), true);
  const f = fakeFetch({ body: { success: true, note: NOTE } });
  try {
    await assert.rejects(() => notes.saveMyNote('jwt', 1234, 'a'.repeat(2001)), e => e.code === 'recipe_note_too_long' && e.status === 400);
    await assert.rejects(() => notes.getMyNote('', 1234), e => e.status === 401, 'no token → no request');
    await assert.rejects(() => notes.getMyNote('jwt', 0), /geçersiz/);
    assert.equal(f.calls.length, 0);
  } finally { f.restore(); }
});

test('notes: 400 too_long, 401, 409 limit and 429 retry_after become clear Turkish errors', async () => {
  const f = fakeFetch(
    { status: 400, body: { code: 'recipe_note_too_long', message: 'Not en fazla 2.000 karakter olabilir.', data: { status: 400, max_length: 2000 } } },
    { status: 401, body: { code: 'rest_forbidden', message: 'Sorry, you are not allowed to do that.', data: { status: 401 } } },
    { status: 409, body: { code: 'recipe_note_limit', message: 'En fazla 1.000 not saklayabilirsin.', data: { status: 409 } } },
    { status: 429, body: { code: 'recipe_note_rate_limited', message: 'Çok hızlı.', data: { status: 429, retry_after: 125 } } },
  );
  try {
    await assert.rejects(() => notes.saveMyNote('jwt', 1, 'x'), e => e.status === 400 && e.code === 'recipe_note_too_long' && /2\.000/.test(e.message));
    await assert.rejects(() => notes.saveMyNote('jwt', 1, 'x'), e => e.status === 401 && /giriş yap/.test(e.message));
    await assert.rejects(() => notes.saveMyNote('jwt', 1, 'x'), e => e.status === 409 && e.message === 'En fazla 1.000 not saklayabilirsin.');
    await assert.rejects(() => notes.saveMyNote('jwt', 1, 'x'), e => e.status === 429 && e.retryAfter === 125 && /3 dakika sonra tekrar dene/.test(e.message));
  } finally { f.restore(); }
  assert.equal(notes.formatRetryAfter(45), '45 saniye');
  assert.equal(notes.formatRetryAfter(3600), '1 saat');
});

test('Notlarım: paged list URL, newest-first contract mapping, unavailable recipes carry no title/slug/image', async () => {
  const f = fakeFetch({ body: {
    success: true, page: 2, per_page: 20, total: 22, pages: 2,
    notes: [
      { recipe_id: 1234, available: true, slug: 'mercimek-corbasi', title: 'Mercimek Çorbası', image: 'https://api.tariften.com/m.jpg', note_excerpt: 'Tuzu azalt…', updated_at: '2026-10-22T09:02:41+00:00' },
      { recipe_id: 987, available: false, slug: null, title: null, image: null, note_excerpt: 'Fırını 10 derece düşük tut…', updated_at: '2026-10-19T17:45:00+00:00' },
      { recipe_id: 'x' }, null,
    ],
  } });
  try {
    const result = await notes.listMyNotes('jwt', 2);
    assert.equal(f.calls[0].url, '/api/account/recipe-notes?page=2&per_page=20');
    assert.equal(f.calls[0].init.method, 'GET');
    assert.equal(f.calls[0].init.cache, 'no-store');
    assert.deepEqual(result.notes.map(n => [n.recipeId, n.available, n.slug, n.title, n.image]), [
      [1234, true, 'mercimek-corbasi', 'Mercimek Çorbası', 'https://api.tariften.com/m.jpg'],
      [987, false, null, null, null],
    ]);
    assert.deepEqual([result.page, result.total, result.pages], [2, 22, 2]);
  } finally { f.restore(); }
  assert.equal(notes.notesListUrl(1, 500), '/api/account/recipe-notes?page=1&per_page=50', 'per_page capped at 50');
});

test('notes stay private: no server render, no ISR, no browser storage, plain-text rendering', () => {
  const lib = read('src/lib/recipe-notes.ts');
  assert.doesNotMatch(lib, /revalidate|localStorage|sessionStorage|"use server"/);
  const list = read('src/app/api/account/recipe-notes/route.ts');
  const item = read('src/app/api/account/recipe-notes/[id]/route.ts');
  const upstream = read('src/app/api/account/recipe-notes/upstream.ts');
  for (const route of [list, item]) assert.match(route, /export const dynamic = "force-dynamic"/);
  assert.match(item, /\$\{CORE\}\/recipes\/\$\{id\}\/my-note/);
  assert.match(item, /\^\[1-9\]\\d\{0,9\}\$/, 'numeric recipe id only');
  assert.match(list, /\$\{CORE\}\/me\/notes\?page=\$\{page\}&per_page=\$\{perPage\}/);
  assert.match(upstream, /cache: "no-store"/);
  assert.match(upstream, /"Cache-Control": "private, no-store, max-age=0"/);
  assert.match(upstream, /Bearer/);

  const card = read('src/components/recipe/RecipeNoteCard.tsx');
  assert.match(card, /^"use client";/);
  assert.match(card, /getMyNote\(token, recipeId\)/);
  assert.match(card, /whitespace-pre-wrap/);
  assert.doesNotMatch(card, /dangerouslySetInnerHTML|localStorage/);
  assert.match(card, /Yalnızca sen görürsün/);
  assert.match(card, /Bu tarife kendine not almak için/);
  assert.match(card, /NOTE_MAX_LENGTH\.toLocaleString\("tr-TR"\)/, 'character counter');
  assert.match(card, /status === 404/, 'invisible recipe → no card');
  // The server-rendered recipe page and server actions never touch notes.
  assert.doesNotMatch(read('src/app/recipe/[slug]/page.tsx'), /recipe-notes|my-note|getMyNote/);
  assert.doesNotMatch(read('src/lib/api.ts'), /my-note|me\/notes/);
  assert.match(read('src/components/recipe/RecipeDetailClient.tsx'), /<RecipeNoteCard recipeId=\{recipe\.id\} \/>/);

  const profile = read('src/app/profile/page.tsx');
  assert.match(profile, /\{ key: "notes", label: "Notlarım"/);
  assert.match(profile, /<MyRecipeNotes key="notes" token=\{user\.token\} \/>/);
  const mine = read('src/components/account/MyRecipeNotes.tsx');
  assert.match(mine, /listMyNotes\(token, nextPage\)/);
  assert.match(mine, /Bu tarif artık erişilebilir değil/);
  assert.match(mine, /deleteMyNote\(token, recipeId\)/);
  assert.match(mine, /Daha fazla yükle/);
});

/* ---------------------------------------------------- household opt-in */

test('household: size 1–12 only; adapt_household only when the toggle is on and a size exists', () => {
  for (const bad of [null, 0, 13, 2.5, '4', undefined]) assert.equal(household.householdSizeOf({ household_size: bad }), null);
  assert.equal(household.householdSizeOf(null), null);
  assert.equal(household.householdSizeOf({ household_size: 1 }), 1);
  assert.equal(household.householdSizeOf({ household_size: 12 }), 12);
  assert.equal(household.householdToggleLabel(3), 'Evime göre uyarla (3 kişi)');

  assert.deepEqual(household.householdRequest(false, 3), {});
  assert.deepEqual(household.householdRequest(true, null), {});
  assert.deepEqual(household.householdRequest(true, 3), { adaptHousehold: true });

  assert.deepEqual(household.buildGeneratePayload('menemen'), { ingredients: 'menemen', type: 'suggest' });
  assert.ok(!('adapt_household' in household.buildGeneratePayload('menemen', {})), 'off = field omitted');
  assert.deepEqual(household.buildGeneratePayload('menemen', { adaptHousehold: true }),
    { ingredients: 'menemen', type: 'suggest', adapt_household: true });
});

test('household: the browser /ai/generate transport sends adapt_household only when on', async () => {
  const client = load('src/lib/recipe-write-client.ts', {
    '@/lib/recipe-allergens': { allergenConflictFrom: () => null },
    '@/lib/household-adapt': household,
  });
  const f = fakeFetch({ body: { success: true, recipe: { title: 'Menemen' } } });
  try {
    await client.generateRecipeClient('jwt', 'menemen');
    await client.generateRecipeClient('jwt', 'menemen', household.householdRequest(false, 4));
    await client.generateRecipeClient('jwt', 'menemen', household.householdRequest(true, 4));
    await client.generateRecipeClient('jwt', 'menemen', household.householdRequest(true, null));
    assert.ok(f.calls.every(c => c.url === '/api/recipes/write' && c.body.action === 'generate'));
    assert.deepEqual(f.calls.map(c => 'adapt_household' in c.body.payload), [false, false, true, false]);
    assert.equal(f.calls[2].body.payload.adapt_household, true);
  } finally { f.restore(); }

  const route = read('src/app/api/recipes/write/route.ts');
  assert.match(route, /generatePayload\.adapt_household !== true\) \{\s*delete generatePayload\.adapt_household;/,
    'the proxy forwards only a literal true');
  const api = read('src/lib/api.ts');
  assert.match(api, /body: JSON\.stringify\(buildGeneratePayload\(ingredients, household\)\)/, 'server action uses the same payload builder');
});

test('household: every web /ai/generate caller shows the toggle (default off) and passes it through', () => {
  const files = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (/\.(ts|tsx)$/.test(entry.name)) files.push(rel);
    }
  };
  walk('src');

  // Only the two transports talk to /ai/generate directly.
  const direct = files.filter(file => /["'`][^"'`]*\/ai\/generate["'`]/.test(read(file)) || /\/ai\/generate`/.test(read(file)));
  assert.deepEqual(direct.sort(), ['src/app/api/recipes/write/route.ts', 'src/lib/api.ts']);

  const callers = files.filter(file => {
    const source = read(file);
    return /\b(generateRecipeClient|generateAIRecipe)\(/.test(source)
      && !/export async function (generateRecipeClient|generateAIRecipe)\(/.test(source);
  });
  assert.deepEqual(callers.sort(), ['src/app/pantry/page.tsx', 'src/app/recipes/page.tsx']);

  for (const file of callers) {
    const source = read(file);
    const calls = [...source.matchAll(/await (?:generateRecipeClient|generateAIRecipe)\(([^)]*)\)/g)].map(m => m[1]);
    assert.ok(calls.length > 0, file);
    for (const args of calls) assert.match(args, /, household$/, `${file}: ${args}`);
    assert.match(source, /const household = householdRequest\(adaptHousehold, householdSize\);/, file);
    assert.match(source, /const \[adaptHousehold, setAdaptHousehold\] = useState\(false\);/, `${file}: default off`);
    assert.match(source, /const householdSize = useHouseholdSize\(\);/, file);
    assert.match(source, /<HouseholdAdaptToggle size=\{householdSize\} checked=\{adaptHousehold\} onChange=\{setAdaptHousehold\}/, file);
  }

  const toggle = read('src/components/recipes/HouseholdAdaptToggle.tsx');
  assert.match(toggle, /if \(size === null\) return null;/, 'hidden without a household size');
  assert.match(toggle, /role="switch" aria-checked=\{checked\}/);
  assert.match(toggle, /householdToggleLabel\(size\)/);
  assert.match(read('src/hooks/useHouseholdSize.ts'), /kitchen\.status === "ready" \? householdSizeOf\(kitchen\.data\.profile\) : null/);
});
