const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '..', 'src/lib/lokma-emoji.ts'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const shim = {exports:{}};
Function('module','exports',compiled)(shim,shim.exports);
const {lokmaIngredient} = shim.exports;
const key = name => { const r = lokmaIngredient(name); return r.art || r.emoji; };

test('Turkish compound names resolve to their head noun', () => {
  const cases = [
    ['Patates gnocchi', '🍝'],
    ['Gnocchi haşlama suyu', '🫗'],
    ['Makarna haşlama suyu', '🫗'],
    ['Tavuk suyu', '🫗'],
    ['Domates salçası', 'paste'],
    ['Pirinç unu', 'flour'],
    ['Mısır nişastası', 'flour'],
    ['Tavuk göğsü', '🍗'],
    ['Yumurta sarısı', '🥚'],
  ];
  for (const [name, expected] of cases) assert.equal(key(name), expected, name);
});

test('the juice of a food keeps the food, plain water stays water', () => {
  assert.equal(key('Limon suyu'), '🍋');
  assert.equal(key('Yarım limonun suyu'), '🍋');
  assert.equal(key('Portakal suyu'), '🍊');
  assert.equal(key('Su'), '🫗');
  assert.equal(key('Ilık su'), '🫗');
  assert.equal(key('Maden suyu'), '🫗');
});

test('alternatives in parentheses never replace the ingredient; descriptors still help', () => {
  assert.equal(key('Parmesan peyniri (veya Grana Padano / Pecorino)'), '🧀');
  assert.equal(key('Tereyağı (veya zeytinyağı)'), '🧈');
  assert.equal(key('Kuru domates (yağda veya yumuşatılmış)'), '🍅');
  assert.equal(key('Kırmızı acı biber (chili)'), 'pepper');
  assert.equal(key('kırmızı biber (baharat)'), 'paprikaspice');
});

test('missing Turkish characters and inflections still match', () => {
  assert.equal(key('Taze feslegen yaprakları'), '🌿');
  assert.equal(key('Taze fesleğen yaprakları'), '🌿');
  assert.equal(key('cig badem'), 'almond');
  assert.equal(key('Bademler'), 'almond');
  assert.equal(key('Kültür mantarı'), '🍄');
  assert.equal(key('Labne peyniri'), '🧀');
});

test('variety names beat the generic family noun', () => {
  assert.equal(key('Çarliston biber'), 'carliston');
  assert.equal(key('Sivri biber'), 'sivri');
  assert.equal(key('Kapya biber'), 'kapiapepper');
  assert.equal(key('Bal kabağı'), 'pumpkin');
  assert.equal(key('Taze fasulye'), 'greenbean');
  assert.equal(key('Karabiber'), 'blackpepper', 'black pepper is peppercorns, never a pepper pod');
});

test('this recipe: Kuru Domates ve Badem Pestolu Gnocchi has no wrong icon', () => {
  const recipe = {
    'Kuru domates (yağda veya yumuşatılmış)': '🍅', 'Çiğ badem': 'almond', 'Kırmızı acı biber (chili)': 'pepper',
    'Parmesan peyniri (veya Grana Padano / Pecorino)': '🧀', 'Tuz': 'salt', 'Taze çekilmiş karabiber': 'blackpepper',
    'Zeytinyağı': 'oliveoil', 'Patates gnocchi': '🍝', 'Tereyağı': '🧈', 'Gnocchi haşlama suyu': '🫗',
    'Taze feslegen yaprakları': '🌿',
  };
  for (const [name, expected] of Object.entries(recipe)) assert.equal(key(name), expected, name);
});

test('unknown words never become food by accident', () => {
  assert.equal(key('bilinmeyen gurme malzeme'), '🍽️');
  assert.equal(key('unlu mamul'), '🍽️', '"un" must not match inside unrelated words');
  assert.equal(key('suşi pirinci'), '🍚');
});
