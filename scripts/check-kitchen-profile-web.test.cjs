'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const code = ts.transpileModule(read('src/lib/kitchen-profile.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function load(fetchImpl) {
  const mod = { exports: {} };
  Function('module', 'exports', 'require', 'fetch', code)(
    mod, mod.exports, () => { throw Error('unexpected_import'); }, fetchImpl || (async () => { throw Error('no_fetch'); }),
  );
  return mod.exports;
}
const kp = load();
const LIMITS = { max_items: 30, max_length: 40 };

function profile(overrides = {}) {
  return { ...kp.emptyKitchenProfile(), ...overrides };
}
function client(json, status = 200) {
  const calls = [];
  const api = load(async (url, options) => {
    calls.push({ url, options });
    return { ok: status >= 200 && status < 300, status, json: async () => json };
  });
  return { api, calls };
}
const OPTIONS = {
  household_size: { min: 1, max: 12 },
  diets: [{ value: 'vegan', label: 'Vegan' }, { value: 'vegetarian', label: 'Vejetaryen' }],
  equipment: [{ value: 'oven', label: 'Fırın' }],
  experience: [{ value: 'beginner', label: 'Yeni başlıyorum' }],
  time_preference: [{ value: 'under_20', label: '20 dakikadan az' }],
  allergens: [{ value: 'gluten', label: 'Gluten' }, { value: 'milk', label: 'Süt' }],
  reactions: [{ value: 'allergy', label: 'Alerji' }, { value: 'intolerance', label: 'İntolerans' }],
  dislikes: { max_items: 30, max_length: 40 },
  allergen_notice: 'Sağlık verisi; yalnızca öneriler için kullanılır.',
};

/* ------------------------------------------------------------ pure logic */

test('dislike tags: comma/Enter splitting, Turkish case-folded de-duplication, limits reported', () => {
  const first = kp.addTags([], ' kişniş,  bamya ,, Ciğer ', LIMITS);
  assert.deepEqual(first.tags, ['kişniş', 'bamya', 'Ciğer']);
  assert.equal(first.error, '');
  const dup = kp.addTags(first.tags, 'KİŞNİŞ, ciğer', LIMITS);
  assert.deepEqual(dup.tags, first.tags, 'Turkish İ/i folding treats KİŞNİŞ as kişniş');
  assert.deepEqual(dup.added, []);
  const long = kp.addTags([], 'a'.repeat(41), LIMITS);
  assert.deepEqual(long.tags, []);
  assert.match(long.error, /40 karakter/);
  const full = Array.from({ length: 30 }, (_, i) => `m${i}`);
  const over = kp.addTags(full, 'yeni', LIMITS);
  assert.equal(over.tags.length, 30);
  assert.match(over.error, /En fazla 30/);
  assert.equal(kp.normalizeTag('  çok   acı\tbiber '), 'çok acı biber');
  assert.deepEqual(kp.removeTag(['a', 'b'], 'a'), ['b']);
});

test('household stepper clamps to Core range; toggles keep order', () => {
  const range = { min: 1, max: 12 };
  assert.equal(kp.clampHousehold(0, range), 1);
  assert.equal(kp.clampHousehold(13, range), 12);
  assert.equal(kp.clampHousehold(4.6, range), 5);
  assert.equal(kp.clampHousehold(NaN, range), 1);
  assert.deepEqual(kp.toggleValue(['vegan'], 'keto'), ['vegan', 'keto']);
  assert.deepEqual(kp.toggleValue(['vegan', 'keto'], 'vegan'), ['keto']);
  const allergens = kp.toggleAllergen([], 'gluten');
  assert.deepEqual(allergens, [{ key: 'gluten', type: 'allergy' }]);
  assert.deepEqual(kp.setAllergenReaction(allergens, 'gluten', 'intolerance'), [{ key: 'gluten', type: 'intolerance' }]);
  assert.deepEqual(kp.toggleAllergen(allergens, 'gluten'), []);
});

test('step patch is partial: only changed keys of the current step are sent', () => {
  const saved = profile({ household_size: 2, diets: ['vegan'] });
  const draft = { ...kp.draftFromProfile(saved), household_size: 4, diets: ['vegan', 'keto'] };
  assert.deepEqual(kp.buildStepPatch('household', draft, saved), { household_size: 4 });
  assert.deepEqual(kp.buildStepPatch('diets', draft, saved), { diets: ['vegan', 'keto'] });
  assert.deepEqual(kp.buildStepPatch('dislikes', draft, saved), {});
  assert.deepEqual(kp.buildStepPatch('kitchen', draft, saved, { complete: true }), { complete: true });
  assert.equal(kp.isStepDirty('household', draft, saved), true);
  assert.equal(kp.isStepDirty('dislikes', draft, saved), false);
  const cleared = { ...kp.draftFromProfile(saved), household_size: null };
  assert.deepEqual(kp.buildStepPatch('household', cleared, saved), { household_size: null });
});

test('allergen consent accompanies only the first non-empty save and is required before it', () => {
  const blank = profile();
  const draft = { ...kp.draftFromProfile(blank), allergens: [{ key: 'milk', type: 'intolerance' }] };
  assert.equal(kp.allergenConsentMissing(draft, blank, false), true);
  assert.equal(kp.allergenConsentMissing(draft, blank, true), false);
  assert.deepEqual(kp.buildStepPatch('allergens', draft, blank, { consentChecked: true, complete: true }), {
    allergens: [{ key: 'milk', type: 'intolerance' }], allergen_consent: true, complete: true,
  });
  const consented = profile({ allergens: [{ key: 'milk', type: 'intolerance' }], allergen_consent_at: '2026-10-20T10:00:00Z' });
  const more = { ...kp.draftFromProfile(consented), allergens: [...consented.allergens, { key: 'gluten', type: 'allergy' }] };
  assert.equal(kp.allergenConsentMissing(more, consented, false), false);
  assert.equal('allergen_consent' in kp.buildStepPatch('allergens', more, consented, { consentChecked: true }), false);
  const none = kp.draftFromProfile(blank);
  assert.equal(kp.allergenConsentMissing(none, blank, false), false, 'no allergens → no consent needed');
});

test('saved step merges server values without discarding unsaved edits of other steps', () => {
  const before = profile();
  const draft = { ...kp.draftFromProfile(before), household_size: 3, diets: ['vegan'] };
  const saved = profile({ household_size: 3 });
  const merged = kp.mergeSavedStep('household', draft, saved);
  assert.equal(merged.household_size, 3);
  assert.deepEqual(merged.diets, ['vegan']);
  assert.equal(kp.isStepFilled('household', saved), true);
  assert.equal(kp.filledStepCount(profile({ diets: ['vegan'], allergens: [{ key: 'milk', type: 'allergy' }] })), 2);
  assert.equal(kp.KITCHEN_STEPS.length, 5);
  assert.deepEqual(kp.KITCHEN_STEPS.map(s => s.key), ['household', 'diets', 'dislikes', 'kitchen', 'allergens']);
});

test('parsers accept only the contract and labels come from options', () => {
  const p = kp.parseKitchenProfile({
    version: 1, household_size: 3, diets: ['vegan', 7, ''], dislikes: ['bamya'], equipment: ['oven'],
    experience: 'chef', time_preference: 'under_45', allergens: [{ key: 'milk', type: 'intolerance' }, { key: 'egg', type: 'x' }, {}],
    allergen_consent_at: '2026-10-20T10:00:00Z', completed_at: null, updated_at: '',
  });
  assert.deepEqual(p.diets, ['vegan']);
  assert.equal(p.experience, null);
  assert.equal(p.time_preference, 'under_45');
  assert.deepEqual(p.allergens, [{ key: 'milk', type: 'intolerance' }, { key: 'egg', type: 'allergy' }]);
  assert.equal(p.updated_at, null);
  assert.throws(() => kp.parseKitchenProfile(null), /eksik/);
  const o = kp.parseKitchenOptions({ ...OPTIONS, diets: [...OPTIONS.diets, { value: 1 }], dislikes: {} });
  assert.equal(o.diets.length, 2);
  assert.deepEqual(o.dislikes, { max_items: 30, max_length: 40 });
  assert.equal(kp.optionLabel(o.allergens, 'milk'), 'Süt');
  assert.equal(kp.optionLabel(o.allergens, 'unknown'), 'unknown');
});

/* ------------------------------------------------------------- transport */

test('transport uses the same-origin route with JWT bearer and no cache', async () => {
  const h = client({ success: true, profile: profile({ household_size: 2 }), options: OPTIONS });
  const data = await h.api.getKitchenProfile('jwt-1');
  assert.equal(data.profile.household_size, 2);
  assert.equal(data.options.allergen_notice, OPTIONS.allergen_notice);
  assert.equal(h.calls[0].url, '/api/account/kitchen-profile');
  assert.equal(h.calls[0].options.method, 'GET');
  assert.equal(h.calls[0].options.headers.Authorization, 'Bearer jwt-1');
  assert.equal(h.calls[0].options.cache, 'no-store');
  const put = client({ success: true, profile: profile({ completed_at: '2026-10-22T09:00:00Z' }) });
  await put.api.updateKitchenProfile('jwt-1', { complete: true });
  assert.equal(put.calls[0].options.method, 'PUT');
  assert.equal(put.calls[0].options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(put.calls[0].options.body), { complete: true });
  const del = client({ success: true, profile: profile() });
  await del.api.deleteKitchenProfile('jwt-1');
  assert.equal(del.calls[0].options.method, 'DELETE');
  await assert.rejects(() => h.api.getKitchenProfile(''), /giriş yapmalısın/);
});

test('400 field errors surface code + field; consent error maps to the consent field', async () => {
  const bad = client({ code: 'invalid_household_size', message: 'Hane 1–12 kişi olmalı.', data: { status: 400, field: 'household_size' } }, 400);
  await assert.rejects(() => bad.api.updateKitchenProfile('jwt', { household_size: 40 }), err => {
    assert.equal(err.name, 'KitchenProfileError');
    assert.equal(err.status, 400);
    assert.equal(err.field, 'household_size');
    assert.equal(err.message, 'Hane 1–12 kişi olmalı.');
    return true;
  });
  const consent = kp.kitchenErrorFrom(400, { code: 'allergen_consent_required', message: 'Onay gerekli.', data: { status: 400 } });
  assert.equal(consent.field, 'allergen_consent');
  assert.match(kp.kitchenErrorFrom(500, { message: '<html>fatal</html>' }).message, /kaydedilemedi/);
  assert.match(kp.kitchenErrorFrom(401, null).message, /yeniden giriş/);
  const malformed = client({ profile: {} }, 200);
  await assert.rejects(() => malformed.api.getKitchenProfile('jwt'), /kaydedilemedi|servis/);
});

/* ------------------------------------------------------ source contracts */

test('proxy route forwards GET/PUT/DELETE to Core /me/kitchen-profile with bearer only', () => {
  const route = read('src/app/api/account/kitchen-profile/route.ts');
  assert.match(route, /wp-json\/tariften\/v1\/me\/kitchen-profile/);
  for (const verb of ['GET', 'PUT', 'DELETE']) assert.match(route, new RegExp(`export async function ${verb}\\(`));
  assert.match(route, /\^Bearer\\s\+\\S\+\$/);
  assert.match(route, /private, no-store/);
  assert.match(route, /cache: "no-store"/);
});

test('wizard renders labels from options, five skippable steps, consent gate and erase', () => {
  const ui = read('src/components/account/KitchenProfileWizard.tsx');
  assert.match(ui, /options\.diets\.map/);
  assert.match(ui, /options\.equipment\.map/);
  assert.match(ui, /options\.allergens\.map/);
  assert.match(ui, /options\.reactions\.map/);
  assert.match(ui, /options\.time_preference/);
  assert.match(ui, /options\.allergen_notice/);
  assert.doesNotMatch(ui, /"Vegan"|"Glutensiz"|"Fıstık"|"Airfryer"/, 'no hardcoded option labels');
  assert.match(ui, /Şimdilik atla/);
  assert.match(ui, /aria-pressed=\{selected\}/);
  assert.match(ui, /aria-pressed=\{active\}/);
  assert.match(ui, /role="progressbar"/);
  assert.match(ui, /event\.key === "Enter"/);
  assert.match(ui, /disabled=\{saving \|\| consentMissing/);
  assert.match(ui, /Onay verildi · \{formatTrDate\(profile\.allergen_consent_at\)\}/);
  assert.match(ui, /Alerji bilgimi sil/);
  assert.match(ui, /save\(\{ allergen_consent: false \}\)/);
  assert.match(ui, /complete: last/);
  assert.match(ui, /focus-visible:outline-brand/);
  assert.match(ui, /"Kaydet"/);
});

test('page: protected route, welcome intro, editor mode and success redirect', () => {
  const page = read('src/app/profile/kitchen/page.tsx');
  assert.match(page, /Mutfağını \*tanıyalım\.\*/);
  assert.match(page, /params\.get\("welcome"\) === "1"/);
  assert.match(page, /getKitchenProfile\(token\)/);
  assert.match(page, /router\.push\("\/profile\?mutfak=kaydedildi"\)/);
  assert.match(page, /<Suspense/);
  const mw = read('src/middleware.ts');
  assert.match(mw, /'\/profile'/);
  assert.match(mw, /path\.startsWith\(`\$\{route\}\/`\)/);
});

test('registration signs in through AuthContext.login and lands on the kitchen profile', () => {
  const reg = read('src/app/register/page.tsx');
  assert.match(reg, /const data = await registerUser\(formData\)/);
  assert.match(reg, /if \(hasRegistrationSession\(data\)\) \{\s*\/\/[^\n]*\n\s*login\(data\);/);
  assert.match(reg, /router\.push\("\/profile\/kitchen\?welcome=1"\)/);
  assert.match(reg, /setShowModal\(true\)/, 'legacy response keeps today’s success modal');
  assert.match(reg, /typeof value\.token === "string"/);
  const auth = read('src/context/AuthContext.tsx');
  assert.match(auth, /document\.cookie = `tariften_token=\$\{tokenToStore\}/);
  assert.match(auth, /kitchen_profile_completed: userData\.kitchen_profile_completed === true/);
});

test('profile shows a calm kitchen card; edit keeps diet/experience and links to the full profile', () => {
  const profilePage = read('src/app/profile/page.tsx');
  assert.match(profilePage, /<KitchenProfileCard token=\{user\.token\} completed=\{user\.kitchen_profile_completed\}/);
  const card = read('src/components/account/KitchenProfileCard.tsx');
  assert.match(card, /Mutfak profilin/);
  assert.match(card, /href="\/profile\/kitchen"/);
  assert.match(card, /\{done \? "Düzenle" : "Tamamla"\}/);
  assert.match(card, /mutfak"\) === "kaydedildi"/);
  const edit = read('src/app/profile/edit/page.tsx');
  assert.match(edit, /id="edit-diet"/);
  assert.match(edit, /id="edit-experience"/);
  assert.match(edit, /href="\/profile\/kitchen"/);
});
