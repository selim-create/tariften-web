/**
 * Source-grounded import UI contract tests; no network or paid AI requests.
 * Run: node --test scripts/check-recipe-text-import.test.cjs
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const file = fs.readFileSync(path.join(__dirname, '..', 'src/lib/recipe-text-import.ts'), 'utf8');
const compiled = ts.transpileModule(file, { compilerOptions: {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
} }).outputText;
const moduleShim = { exports: {} };
Function('module', 'exports', compiled)(moduleShim, moduleShim.exports);
const lib = moduleShim.exports;

const source = '2 yumurta ve 1 bardak sütü karıştır. Sonra kızgın tavada iki tarafını pişir.';
function fakePreview() {
  return {
    success: true,
    mode: 'manual_text_import',
    generation_status: 'needs_review',
    requires_approval: true,
    source_text: source,
    recipe: {
      title: 'Sütlü Yumurta',
      excerpt: 'Yumurtalı bir tavada hazırlık',
      ingredients: [
        { name: 'yumurta', amount: '2', unit: '', original_span: '2 yumurta', source_verified: true },
        { name: 'süt', amount: '1', unit: 'bardak', original_span: '1 bardak süt', source_verified: true },
      ],
      steps: [
        { content: '2 yumurta ve 1 bardak sütü karıştır.', original_span: '2 yumurta ve 1 bardak sütü karıştır.', source_verified: true },
        { content: 'Sonra kızgın tavada iki tarafını pişir.', original_span: 'Sonra kızgın tavada iki tarafını pişir.', source_verified: true },
      ],
      seo: { title: 'Pratik Yumurta', description: 'Tarif düzenlemesi', focus_keywords: ['yumurta', 'süt'] },
    },
    warnings: ['ingredient_amount_unverified'],
    needs_confirmation: ['ingredient_2_amount_missing'],
    provenance: { origin_type: 'manual_text', ingredient_evidence: 'exact_source_excerpt', step_evidence: 'exact_source_excerpt', editorial_fields: ['title', 'excerpt', 'seo'] },
  };
}

test('input validation enforces minimum text and UTF-8 bytes without sending data', () => {
  assert.match(lib.validateRecipeSource('tarif'), /ayrıntılı/);
  assert.equal(lib.validateRecipeSource(source), null);
  assert.match(lib.validateRecipeSource('ş'.repeat(11000)), /20 KB/);
});

test('verified preview parsed and editable recipe faithfully copies user data', () => {
  const preview = lib.parseImportPreview(fakePreview());
  const editor = lib.editorFromPreview(preview);
  assert.equal(editor.ingredients.length, 2);
  assert.deepEqual(editor.steps.map(s => s.content), preview.recipe.steps.map(s => s.original_span));
  assert.equal(editor.seoKeywords, 'yumurta, süt');
  assert.equal(lib.publishValidation(editor), null);
  const payload = lib.buildApprovedRecipe(editor);
  assert.equal(payload.title, 'Sütlü Yumurta');
  assert.deepEqual(payload.ingredients[0], { name: 'yumurta', amount: '2', unit: '' });
  assert.equal(payload.steps[0], '2 yumurta ve 1 bardak sütü karıştır.');
  assert.equal(payload.seo.focus_keywords, 'yumurta, süt');
  assert.equal(Object.hasOwn(payload, 'image'), false, 'never auto-request paid image');
  assert.equal(Object.hasOwn(payload, 'source_text'), false, 'do not save private raw text in public recipe');
  assert.equal(Object.hasOwn(payload, 'requires_approval'), false);
});

test('untrusted or ungrounded AI preview response rejected before showing it', () => {
  const a = fakePreview();
  a.requires_approval = false;
  assert.throws(() => lib.parseImportPreview(a), /beklenen biçimde/);
  const b = fakePreview();
  b.recipe.ingredients[0].original_span = '1 litre zeytinyağı';
  assert.throws(() => lib.parseImportPreview(b), /Malzeme kanıtı/);
  const c = fakePreview();
  c.recipe.steps[0].content = 'İki yumurta ile bir bardak sütü güzelce karıştırın.';
  c.recipe.steps[0].editorial_rewrite = true;
  assert.equal(lib.parseImportPreview(c).recipe.steps[0].content, c.recipe.steps[0].content);
  c.recipe.steps[0].original_span = 'Kaynakta yer almayan adım.';
  assert.throws(() => lib.parseImportPreview(c), /adımı kaynakla/);
  const d = fakePreview();
  d.recipe.steps = Array.from({ length: 41 }, () => d.recipe.steps[0]);
  assert.throws(() => lib.parseImportPreview(d), /beklenmeyen türde/);
});

test('Turkish typo correction keeps immutable literal source and flags editorial suggestion', () => {
  const value = fakePreview();
  value.source_text = 'Bir domatası rendele. Sonra tavada pişir.';
  value.recipe.ingredients = [{
    name: 'domates', source_name: 'domatas', name_corrected: true,
    amount: '', unit: '', original_span: 'Bir domatası rendele', source_verified: true,
  }];
  value.recipe.steps = [{
    content: 'Domatesi rendeleyin.',
    original_span: 'Bir domatası rendele.', editorial_rewrite: true, source_verified: true,
  }];
  const reviewed = lib.parseImportPreview(value);
  assert.equal(reviewed.recipe.ingredients[0].name, 'domates');
  assert.equal(reviewed.recipe.ingredients[0].source_name, 'domatas');
  assert.equal(reviewed.recipe.steps[0].content, 'Domatesi rendeleyin.');
  const corrupted = fakePreview();
  corrupted.recipe.ingredients[0].name = 'avokado';
  corrupted.recipe.ingredients[0].name_corrected = true;
  assert.throws(() => lib.parseImportPreview(corrupted), /Malzeme kanıtı/);
});

test('editable fields require explicit user completion but never require invented amounts', () => {
  const editor = lib.editorFromPreview(fakePreview());
  editor.ingredients[1].amount = '';
  assert.equal(lib.publishValidation(editor), null, 'source can omit a quantity');
  editor.title = '';
  assert.match(lib.publishValidation(editor), /başlığını/);
  editor.title = 'Yumurta';
  editor.ingredients = [];
  assert.match(lib.publishValidation(editor), /malzeme/);
  editor.ingredients = [{ name: 'yumurta', amount: '', unit: '', original_span: '', source_verified: false }];
  editor.steps[0].content = '';
  assert.match(lib.publishValidation(editor), /adım/);
});

test('warnings and unknown source confirmation codes never render untranslated internals', () => {
  assert.match(lib.importWarningLabel('high_salt_quantity_review'), /Tuz miktarı/);
  assert.match(lib.importWarningLabel('ingredient_4_amount_missing'), /malzeme/);
  assert.match(lib.importWarningLabel('step_2_source_check'), /adım/);
  assert.match(lib.importWarningLabel('unknown_request'), /kaynak metinle/);
});

test('route is strictly authorized, no-store, bounded, preview-only and uses the existing Core endpoint', () => {
  const route = fs.readFileSync(path.join(__dirname, '..', 'src/app/api/recipe-import/preview/route.ts'), 'utf8');
  assert.match(route, /\/tariften\/v1\/ai\/recipe-import\/preview/);
  assert.match(route, /authorization/);
  assert.match(route, /status: 401/);
  assert.match(route, /source_text/);
  assert.match(route, /20000/);
  assert.match(route, /no-store/);
  assert.doesNotMatch(route, /console\.(log|error)\(/);
  assert.doesNotMatch(route, /\/recipes\/create/);
});

test('screen requires login, approval and independent quota checks before public publish', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'src/app/recipe/import/page.tsx'), 'utf8');
  assert.match(page, /if \(!token\)/);
  assert.match(page, /fetchAccountQuotas\(token\)/);
  assert.match(page, /quotaReached\(fresh, "recipe_ai_day"\)/);
  assert.match(page, /quotaReached\(fresh, "recipe_day"\)/);
  assert.match(page, /!accepted/);
  assert.match(page, /<input type="checkbox" checked=\{accepted\}/);
  assert.match(page, /buildApprovedRecipe\(editor\)/);
  assert.match(page, /createRecipe\(token, buildApprovedRecipe\(editor\)\)/);
  assert.match(page, /herkese açık yayımlanacağını/);
  assert.match(page, /const \[accepted, setAccepted\] = useState\(true\)/);
  assert.match(page, /setAccepted\(true\)/);
  assert.doesNotMatch(page, /setAccepted\(false\)/);
  assert.match(page, /setPreview\(null\)/);
  assert.match(page, /onChange=\{e => setAccepted\(e.target.checked\)\}/);
  assert.match(page, /!accepted \|\| busy/);
  assert.match(page, /disabled=\{!accepted/);
  assert.doesNotMatch(page, /fetch_smart_image|generate_image|uploadMedia/);
});

test('import uses a warm, accessible editor workspace with compact source evidence', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'src/app/recipe/import/page.tsx'), 'utf8');
  const footer = fs.readFileSync(path.join(__dirname, '..', 'src/components/layout/Footer.tsx'), 'utf8');
  assert.match(page, /bg-\[#fffbf7\]/);
  assert.match(page, /lg:sticky lg:top-20/);
  assert.match(page, /lg:max-h-\[calc\(100dvh-6rem\)\]/);
  assert.match(page, /lg:grid-cols-\[minmax\(0,0\.78fr\)_minmax\(0,1\.22fr\)\]/);
  assert.match(page, /aria-expanded=\{activeIngredient === i\}/);
  assert.match(page, /aria-expanded=\{activeStep === i\}/);
  assert.match(page, /Miktar belirtilmemiş/);
  assert.match(page, /<details className="group/);
  assert.match(page, /CompactQuota/);
  assert.match(page, /lg:overflow-y-auto/, 'sticky source panel can scroll if taller than the viewport');
  assert.doesNotMatch(page, /<QuotaPanel /);
  assert.match(footer, /pathname === '\/recipe\/import'/);
});

test('WordPress missing REST route and closed beta feature are distinct errors', async () => {
  const routeSource = fs.readFileSync(path.join(__dirname, '..', 'src/app/api/recipe-import/preview/route.ts'), 'utf8');
  assert.match(routeSource, /upstream\.status === 404/);
  assert.match(routeSource, /data\.code === "rest_no_route"/);
  assert.match(routeSource, /recipe_import_route_missing/);
  assert.match(routeSource, /recipe_import_unavailable/);
  const compiled = ts.transpileModule(routeSource, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const mod = { exports: {} };
  Function('module', 'exports', 'require', compiled)(
    mod, mod.exports, (name) => {
      if (name === 'next/server') return { NextResponse: {
        json: (payload, options) => ({ payload, status: options.status, headers: options.headers }),
      } };
      throw Error('Unexpected import ' + name);
    }
  );
  const before = global.fetch;
  try {
    let calls = 0;
    global.fetch = async () => { calls++; return new Response(JSON.stringify({
      code: 'rest_no_route',
      message: 'İstek yöntemi ve bağlantıyla eşleşen yol bulunamadı.',
    }), { status: 404, headers: { 'content-type': 'application/json' } }); };
    const request = new Request('http://localhost/api/recipe-import/preview', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-jwt' },
      body: JSON.stringify({ source_text: source }),
    });
    const missing = await mod.exports.POST(request);
    assert.equal(calls, 1);
    assert.equal(missing.status, 503);
    assert.equal(missing.payload.code, 'recipe_import_route_missing');
    assert.ok(!missing.payload.message.includes('İstek yöntemi'));

    global.fetch = async () => new Response(JSON.stringify({
      code: 'recipe_import_unavailable', message: 'Beta kapalı.',
    }), { status: 503, headers: { 'content-type': 'application/json' } });
    const disabled = await mod.exports.POST(new Request('http://localhost/api/recipe-import/preview', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-jwt' },
      body: JSON.stringify({ source_text: source }),
    }));
    assert.equal(disabled.payload.code, 'recipe_import_unavailable');
    assert.equal(disabled.status, 503);
    const unauthorized = await mod.exports.POST(new Request('http://localhost/api/recipe-import/preview', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source_text: source }),
    }));
    assert.equal(unauthorized.status, 401);
  } finally {
    global.fetch = before;
  }
});
