'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const code = ts.transpileModule(read('src/lib/owned-library.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function makeClient(json, status = 200) {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: status >= 200 && status < 300, status, json: async () => json };
  };
  const exports = {};
  new Function('exports', 'fetch', code)(exports, fetch);
  return { api: exports, calls };
}

test('Tariflerim uses authenticated owner page cursor and validates recipe author IDs', async () => {
  const h = makeClient({ data: [{ id: 41, author: { id: 5 }, slug: 'tarifim', title: 'Tarifim' }], count: 15, pages: 2, source: 'db' });
  const result = await h.api.getOwnedLibraryPage('recipes', 'jwt-123', 5, 2);
  assert.equal(result.total, 15);
  assert.equal(result.pages, 2);
  assert.equal(result.items[0].id, 41);
  assert.match(h.calls[0].url, /recipes\/search\?author=me&page=2$/);
  assert.equal(h.calls[0].options.headers.Authorization, 'Bearer jwt-123');
  assert.equal(h.calls[0].options.cache, 'no-store');
  const wrong = makeClient({ data: [{ id: 3, author: { id: 20 } }], count: 1, pages: 1 });
  await assert.rejects(() => wrong.api.getOwnedLibraryPage('recipes', 'jwt', 5, 1), /Hesabına ait olmayan/);
});

test('Sofralarım requires verified Core owner scope and rejects public menu look-alikes', async () => {
  const owner = makeClient({ source: 'db', scope: 'owner', data: [{ id: 16, author_id: 5, slug: 'sofram' }], count: 16, pages: 2 });
  const data = await owner.api.getOwnedLibraryPage('menus', 'jwt', 5, 1);
  assert.equal(data.items[0].id, 16);
  assert.match(owner.calls[0].url, /menus\/search\?author=me&page=1$/);
  const legacy = makeClient({ data: [], count: 0, pages: 0 });
  await assert.rejects(() => legacy.api.getOwnedLibraryPage('menus', 'jwt', 5, 1), /güncelleniyor/);
  const other = makeClient({ scope: 'owner', data: [{ id: 8, author_id: 8 }], count: 1, pages: 1 });
  await assert.rejects(() => other.api.getOwnedLibraryPage('menus', 'jwt', 5, 1), /Hesabına ait olmayan/);
});

test('empty owned libraries are not simulated on 401, 500, missing metadata or disconnected login', async () => {
  const empty = makeClient({ data: [], count: 0, pages: 0, scope: 'owner' });
  assert.deepEqual((await empty.api.getOwnedLibraryPage('menus', 'jwt', 5, 1)).items, []);
  const denied = makeClient({ message: 'Unauthenticated' }, 401);
  await assert.rejects(() => denied.api.getOwnedLibraryPage('recipes', 'jwt', 5, 1), /Oturumunu/);
  const down = makeClient({}, 500);
  await assert.rejects(() => down.api.getOwnedLibraryPage('recipes', 'jwt', 5, 1), /yüklenemiyor/);
  const malformed = makeClient({ data: [] });
  await assert.rejects(() => malformed.api.getOwnedLibraryPage('recipes', 'jwt', 5, 1), /eksik/);
  await assert.rejects(() => empty.api.getOwnedLibraryPage('menus', '', 5, 1), /giriş yapmalısın/);
  assert.equal(empty.calls.length, 1);
});

test('Web profile has one premium kitchen library; interactions and quotas remain available', () => {
  const profile = read('src/app/profile/page.tsx');
  const library = read('src/components/account/MyKitchenLibrary.tsx');
  for (const label of ['Tariflerim', 'Sofralarım', 'Favoriler', 'Pişirdiklerim']) {
    assert.match(profile, new RegExp(label));
  }
  assert.match(profile, /kind="recipes"/);
  assert.match(profile, /kind="menus"/);
  assert.match(profile, /getUserInteractions\(token, "cooked"\)/);
  assert.match(profile, /getUserInteractions\(token, "favorite"\)/);
  assert.match(profile, /<QuotaPanel/);
  assert.doesNotMatch(profile, /getUserRecipes\(/);
  assert.match(library, /toLocaleLowerCase\("tr-TR"\)/);
  assert.match(library, /getOwnedLibraryPage<Item>/);
  assert.match(library, /Daha fazla yükle/);
  assert.match(library, /retryPage/);
  assert.match(library, /previous\.some\(old => old\.id === item\.id\)/);
  assert.match(library, /\/recipe\/edit\/\$\{item\.id\}/);
  assert.match(library, /\/menu\/edit\/\$\{item\.slug\}/);
  assert.doesNotMatch(library, /updateRecipe|createRecipe|auto_publish/);
});

test('One global plus button opens three genuine routes and respects authentication', () => {
  const header = read('src/components/layout/Header.tsx');
  const menu = read('src/components/navigation/GlobalCreateMenu.tsx');
  assert.match(header, /<GlobalCreateMenu\s*\/>/);
  for (const uri of ['/recipe/create', '/recipe/aktar', '/menu/create']) {
    assert.ok(menu.includes('href: "' + uri + '"'), uri);
  }
  assert.match(menu, /user\?\.token \? href : "\/login"/);
  assert.match(menu, /aria-haspopup="dialog"/);
  assert.match(menu, /role="dialog" aria-modal="true"/);
  assert.match(menu, /event\.key === "Escape"/);
  assert.match(menu, /event\.key === "Tab"/);
  assert.match(menu, /createPortal/);
  assert.match(menu, /Tarif Aktar/);
  assert.match(read('src/app/recipe/aktar/page.tsx'), /RecipeTextImportPage initialMethod="social"/);
  assert.match(read('src/app/recipe/import/page.tsx'), /Tarif metni/);
  assert.match(menu, /href: "\/recipe\/aktar"/);
  assert.doesNotMatch(menu, /fotoğraf.*aktar/i);
  assert.doesNotMatch(header, /href="\/recipe\/create"/);
});
