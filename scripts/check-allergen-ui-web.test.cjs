'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const transpile = file => ts.transpileModule(read(file), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function load(file, fetchImpl) {
  const mod = { exports: {} };
  Function('module', 'exports', 'require', 'fetch', transpile(file))(
    mod, mod.exports, () => { throw Error('unexpected_import'); }, fetchImpl || (async () => { throw Error('no_fetch'); }),
  );
  return mod.exports;
}

const ra = load('src/lib/recipe-allergens.ts');
const OPTIONS = [
  { value: 'gluten', label: 'Gluten içeren tahıllar' },
  { value: 'peanuts', label: 'Yer fıstığı' },
  { value: 'milk', label: 'Süt ve süt ürünleri' },
  { value: 'tree_nuts', label: 'Sert kabuklu yemişler (fındık, ceviz, badem…)' },
  { value: 'mustard', label: 'Hardal' },
];
const CONSENT = '2026-10-20T09:00:00Z';
const plain = runs => runs.map(r => r.text).join('');

/* ------------------------------------------------------------ pure logic */

test('recipe.allergens: known EU keys only, EU order, no key in both lists; absent means unknown', () => {
  assert.equal(ra.parseRecipeAllergens(undefined), null);
  assert.equal(ra.parseRecipeAllergens(null), null);
  assert.equal(ra.parseRecipeAllergens({}), null, 'old cache without a summary is unknown, not "none"');
  assert.deepEqual(ra.parseRecipeAllergens({ contains: [], possible: [] }), { contains: [], possible: [] });
  assert.deepEqual(
    ra.parseRecipeAllergens({ contains: ['milk', 'bogus', 'gluten', 'milk', 5], possible: ['milk', 'mustard', 'eggs'] }),
    { contains: ['gluten', 'milk'], possible: ['eggs', 'mustard'] },
  );
  assert.equal(ra.EU_ALLERGEN_KEYS.length, 14);
  assert.deepEqual(Object.keys(ra.PUBLIC_ALLERGEN_LABELS), [...ra.EU_ALLERGEN_KEYS]);
});

test('labels: Core option label (parenthetical trimmed for sentences), then the public fallback', () => {
  assert.equal(ra.allergenLabel('tree_nuts', OPTIONS), 'Sert kabuklu yemişler');
  assert.equal(ra.allergenLabel('gluten', OPTIONS), 'Gluten içeren tahıllar');
  assert.equal(ra.allergenLabel('sesame', OPTIONS), 'Susam', 'missing option → fallback map');
  assert.equal(ra.allergenLabel('sesame'), 'Susam');
  assert.equal(ra.allergenLabel('unknown_key'), 'unknown_key');
  assert.equal(ra.shortAllergenLabel('Acı bakla (lupin)'), 'Acı bakla');
  assert.equal(ra.shortAllergenLabel('(sadece parantez)'), '(sadece parantez)');
});

test('member match: only with consent and declared allergens; contains and possible intersect separately', () => {
  const recipe = { contains: ['gluten', 'peanuts', 'milk'], possible: ['mustard', 'tree_nuts'] };
  const declared = [{ key: 'peanuts', type: 'allergy' }, { key: 'mustard', type: 'intolerance' }, { key: 'fish', type: 'allergy' }];
  const none = { contains: [], possible: [] };
  assert.deepEqual(ra.matchProfileAllergens(recipe, declared, null, OPTIONS), none, 'no consent → no band');
  assert.deepEqual(ra.matchProfileAllergens(recipe, [], CONSENT, OPTIONS), none, 'no allergens → no band');
  assert.deepEqual(ra.matchProfileAllergens(null, declared, CONSENT, OPTIONS), none, 'unknown summary → no band');
  assert.deepEqual(ra.matchProfileAllergens({ contains: ['eggs'], possible: [] }, declared, CONSENT, OPTIONS), none);
  const match = ra.matchProfileAllergens(recipe, declared, CONSENT, OPTIONS);
  assert.deepEqual(match, {
    contains: [{ key: 'peanuts', label: 'Yer fıstığı' }],
    possible: [{ key: 'mustard', label: 'Hardal' }],
  });
  assert.equal(ra.hasAllergenMatch(match), true);
  assert.equal(ra.hasAllergenMatch(none), false);
});

test('band sentences: calm Turkish copy, singular/plural, possible-only and combined', () => {
  const hit = (key, label) => ({ key, label });
  const one = ra.allergenNoticeSentences({ contains: [hit('peanuts', 'Yer fıstığı')], possible: [] });
  assert.equal(one.length, 1);
  assert.equal(plain(one[0]), 'Bu tarif profilindeki Yer fıstığı alerjenini içeriyor.');
  assert.deepEqual(one[0].filter(r => r.strong).map(r => r.text), ['Yer fıstığı'], 'labels are the bold runs');
  const many = ra.allergenNoticeSentences({ contains: [hit('gluten', 'Gluten'), hit('eggs', 'Yumurta'), hit('milk', 'Süt')], possible: [] });
  assert.equal(plain(many[0]), 'Bu tarif profilindeki Gluten, Yumurta ve Süt alerjenlerini içeriyor.');
  const maybe = ra.allergenNoticeSentences({ contains: [], possible: [hit('mustard', 'Hardal')] });
  assert.equal(plain(maybe[0]), 'Bu tarif profilindeki Hardal alerjenini içerebilir.');
  const both = ra.allergenNoticeSentences({ contains: [hit('peanuts', 'Yer fıstığı')], possible: [hit('mustard', 'Hardal')] });
  assert.deepEqual(both.map(plain), [
    'Bu tarif profilindeki Yer fıstığı alerjenini içeriyor.',
    'Hardal alerjenini de içerebilir.',
  ]);
  assert.deepEqual(ra.allergenNoticeSentences({ contains: [], possible: [] }), []);
  assert.equal(ra.joinTr([]), '');
  assert.equal(ra.joinTr(['A']), 'A');
  assert.equal(ra.joinTr(['A', 'B', 'C']), 'A, B ve C');
  assert.equal(ra.ALLERGEN_DISCLAIMER, 'Malzeme adlarından otomatik çıkarılır; etiket okumanın yerini tutmaz.');
});

test('public "Alerjen bilgisi" only when contains is non-empty', () => {
  assert.equal(ra.publicAllergenSummary(null), null);
  assert.equal(ra.publicAllergenSummary({ contains: [], possible: ['milk'] }), null);
  assert.deepEqual(ra.publicAllergenSummary({ contains: ['gluten', 'sesame'], possible: ['milk'] }),
    { contains: ['Gluten', 'Susam'], possible: ['Süt ve süt ürünleri'] });
  assert.deepEqual(ra.publicAllergenSummary({ contains: ['gluten'], possible: [] }, OPTIONS).contains, ['Gluten içeren tahıllar']);
});

test('422 ai_allergen_conflict → typed error with Core message and ingredients; other failures untouched', () => {
  const body = {
    success: false, code: 'ai_allergen_conflict',
    message: 'Bu tarif alerji listendeki malzemeleri (yer fıstığı) içermeden üretilemedi.',
    allergen_conflicts: [{ key: 'peanuts', label: 'Yer fıstığı', ingredients: ['Fıstık ezmesi', ' <b>yer fıstığı</b> ', ''] }, { nope: 1 }],
  };
  const error = ra.allergenConflictFrom(422, body);
  assert.ok(error instanceof ra.AllergenConflictError);
  assert.ok(error instanceof Error);
  assert.equal(error.code, 'ai_allergen_conflict');
  assert.equal(error.message, body.message);
  assert.deepEqual(error.conflicts, [{ key: 'peanuts', label: 'Yer fıstığı', ingredients: ['Fıstık ezmesi', 'yer fıstığı'] }]);
  assert.equal(ra.isAllergenConflict(error), true);
  assert.equal(ra.isAllergenConflict(new Error('x')), false);
  assert.equal(ra.allergenConflictFrom(500, { success: false, message: 'Bütçe' }), null);
  assert.equal(ra.allergenConflictFrom(422, null), null);
  const bare = ra.allergenConflictFrom(422, { success: false, code: 'ai_allergen_conflict' });
  assert.match(bare.message, /alerji listendeki/);
  assert.deepEqual(bare.conflicts, []);
});

test('successful generation: allergen_warning and cautions read before saving', () => {
  assert.equal(ra.allergenCautionsFrom({ title: 'Pilav' }), null);
  assert.equal(ra.allergenCautionsFrom(null), null);
  const caution = ra.allergenCautionsFrom({
    allergen_warning: 'Bazı malzemeler alerji listendekileri içerebilir (bitter çikolata). Etiketini kontrol et.',
    allergen_cautions: [{ key: 'milk', label: 'Süt ve süt ürünleri', ingredients: ['Bitter çikolata'] }],
  });
  assert.match(caution.warning, /bitter çikolata/);
  assert.deepEqual(caution.cautions, [{ key: 'milk', label: 'Süt ve süt ürünleri', ingredients: ['Bitter çikolata'] }]);
  const onlyList = ra.allergenCautionsFrom({ allergen_cautions: [{ key: 'milk', label: 'Süt', ingredients: [] }] });
  assert.match(onlyList.warning, /etiket okumanın yerini tutmaz/);
});

test('kitchen profile is fetched once per token per tab; failures are not cached; saves refresh it', async () => {
  const profile = { allergens: [{ key: 'peanuts', type: 'allergy' }], allergen_consent_at: CONSENT };
  const options = { allergens: OPTIONS };
  let calls = 0;
  let fail = false;
  const kp = load('src/lib/kitchen-profile.ts', async () => {
    calls++;
    if (fail) return { ok: false, status: 503, json: async () => ({ success: false, message: 'Servis yok' }) };
    return { ok: true, status: 200, json: async () => ({ success: true, profile, options }) };
  });
  assert.equal(kp.peekKitchenProfile('t1'), null);
  const [a, b] = await Promise.all([kp.loadKitchenProfile('t1'), kp.loadKitchenProfile('t1')]);
  await kp.loadKitchenProfile('t1');
  assert.equal(calls, 1, 'concurrent and later readers share one GET');
  assert.equal(a, b);
  assert.deepEqual(kp.peekKitchenProfile('t1').profile.allergens, [{ key: 'peanuts', type: 'allergy' }]);

  fail = true;
  await assert.rejects(kp.loadKitchenProfile('t2'));
  assert.equal(kp.peekKitchenProfile('t2'), null);
  fail = false;
  await kp.loadKitchenProfile('t2');
  assert.equal(calls, 3, 'a failed GET is retried by the next reader');

  const saved = kp.parseKitchenProfile({ allergens: [], allergen_consent_at: null });
  kp.rememberKitchenProfile('t1', saved);
  assert.deepEqual(kp.peekKitchenProfile('t1').profile.allergens, []);
  assert.ok(kp.peekKitchenProfile('t1').options, 'options are kept after a save');
  kp.rememberKitchenProfile('t3', saved);
  assert.equal(kp.peekKitchenProfile('t3'), null, 'without options nothing is cached');
  kp.forgetKitchenProfiles();
  assert.equal(kp.peekKitchenProfile('t1'), null);
});

/* -------------------------------------------------------- source contracts */

test('recipe page: band above Malzemeler, renders nothing until the profile is known', () => {
  const page = read('src/components/recipe/RecipeDetailView.tsx');
  assert.match(page, /<RecipeAllergenNotice allergens=\{recipe\.allergens\} \/>/);
  assert.ok(page.indexOf('<RecipeAllergenNotice') < page.indexOf('<RecipeDetailClient'));
  assert.ok(page.indexOf('<RecipeAllergenNotice') > page.indexOf('aria-label="Tarif işlemleri"'));
  const band = read('src/components/recipe/RecipeAllergenNotice.tsx');
  assert.match(band, /^"use client";/);
  assert.match(band, /useKitchenProfile\(\)/);
  assert.match(band, /if \(kitchen\.status !== "ready"\) return null;/);
  assert.match(band, /if \(!hasAllergenMatch\(match\)\) return null;/);
  assert.match(band, /profile\.allergen_consent_at/);
  assert.match(band, /options\.allergens/);
  assert.match(band, /ALLERGEN_DISCLAIMER/);
  assert.match(band, /ALLERGEN_PROFILE_HREF/);
  assert.match(band, /Alerji bilgimi düzenle/);
  assert.match(band, /<details/);
  assert.doesNotMatch(band, /Skeleton|animate-pulse|min-h-/, 'no placeholder that would reserve space for everyone');
  assert.equal(read('src/lib/recipe-allergens.ts').match(/ALLERGEN_PROFILE_HREF = "\/profile\/kitchen"/)?.length, 1);
  const detail = read('src/components/recipe/RecipeDetailClient.tsx');
  assert.match(detail, /<RecipeAllergenInfo allergens=\{recipe\.allergens\} \/>/);
  assert.match(read('src/types/index.ts'), /allergens\?: RecipeAllergenSummary;/);
});

test('profile cache is memory-only, shared through one hook and cleared on sign-out', () => {
  const hook = read('src/hooks/useKitchenProfile.ts');
  assert.match(hook, /loadKitchenProfile\(token\)/);
  assert.match(hook, /peekKitchenProfile\(token\)/);
  const lib = read('src/lib/kitchen-profile.ts');
  for (const source of [hook, lib, read('src/components/recipe/RecipeAllergenNotice.tsx')]) {
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/);
  }
  const kitchen = read('src/app/profile/kitchen/page.tsx');
  assert.equal(kitchen.match(/rememberKitchenProfile\(token, /g)?.length, 3, 'load, save and erase refresh the cache');
  assert.match(read('src/context/AuthContext.tsx'), /forgetKitchenProfiles\(\)/);
  // Only the public fallback lives in one place; member labels come from Core options.
  for (const file of ['src/components/recipe/RecipeAllergenNotice.tsx', 'src/components/recipes/AllergenGenerationNotice.tsx']) {
    assert.doesNotMatch(read(file), /Yer fıstığı|Süt ve süt ürünleri|Sert kabuklu/);
  }
});

test('every web /ai/generate call handles the 422 allergen refusal and the success warning', () => {
  const client = read('src/lib/recipe-write-client.ts');
  assert.match(client, /const conflict = allergenConflictFrom\(res\.status, data\);\s*if \(conflict\) throw conflict;/);
  const api = read('src/lib/api.ts');
  assert.match(api, /res\.status === 422 && data\?\.code === "ai_allergen_conflict"/);

  const quick = read('src/app/recipes/page.tsx');
  const generate = quick.slice(quick.indexOf('const handleGenerateRecipe = async ()'), quick.indexOf('const handlePublishQuickRecipe ='));
  assert.match(generate, /if \(isAllergenConflict\(error\)\)/);
  assert.match(generate, /conflicts: error\.conflicts/);
  assert.match(generate, /void quotas\.reload\(\)/);
  assert.match(generate, /allergenCautionsFrom\(aiResponse\.recipe\)/);
  assert.ok(generate.indexOf('else if (caution)') < generate.lastIndexOf('await publishGeneratedRecipe(draft, token)'),
    'a candidate with a warning opens the caution dialog instead of auto-publishing');
  assert.match(generate, /else if \(allergenCaution\) setCautionOpen\(true\);/);
  assert.match(quick, /<AllergenConflictDetails conflicts=\{modal\.conflicts\}/);
  assert.match(quick, /<AllergenCautionDialog/);
  assert.match(quick, /allergenWarning=\{allergenCaution\?\.warning\}/);
  assert.match(quick, /if \(!modal\.show \|\| modalSticky\) return;/);
  assert.match(read('src/components/recipes/SimilarRecipeChoice.tsx'), /allergenWarning &&/);

  const pantry = read('src/app/pantry/page.tsx');
  assert.doesNotMatch(pantry, /generateAIRecipe/);
  assert.match(pantry, /await generateRecipeClient\(user\.token, prompt(?:, household)?\)/);
  assert.match(pantry, /if \(isAllergenConflict\(error\)\)/);
  assert.match(pantry, /<AllergenConflictDetails conflicts=\{notice\.conflicts\}/);
  const action = pantry.slice(pantry.indexOf('const handleAiAction'), pantry.indexOf('const confirmPendingSave'));
  assert.ok(action.indexOf('allergenCautionsFrom(aiResponse.recipe)') < action.indexOf('createRecipe(user.token, aiResponse.recipe)'),
    'pantry shows the warning before saving');
  assert.match(pantry, /<AllergenCautionDialog/);

  const notice = read('src/components/recipes/AllergenGenerationNotice.tsx');
  assert.match(notice, /ALLERGEN_ATTEMPT_NOTE/);
  assert.match(read('src/lib/recipe-allergens.ts'), /ALLERGEN_ATTEMPT_NOTE = "Bu deneme günlük AI tarif hakkından sayıldı\."/);
  assert.match(notice, /ALLERGEN_PROFILE_HREF/);
  assert.doesNotMatch(notice, /hakkın doldu/, 'a refusal is never presented as an exhausted quota');

  const menu = read('src/app/menu/create/page.tsx');
  assert.match(menu, /failure\.error === "ai_allergen_conflict"/);
  assert.match(menu, /href="\/profile\/kitchen"/);
});
