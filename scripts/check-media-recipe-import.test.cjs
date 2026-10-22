'use strict';
/**
 * Photo / notebook / own-video recipe web contract tests. Offline: fetch and
 * XMLHttpRequest are stubbed, no AI or upload request leaves the machine.
 * Run: node --test scripts/check-media-recipe-import.test.cjs
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const load = file => {
  const js = ts.transpileModule(read(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  Function('module', 'exports', 'require', js)(mod, mod.exports, name => { throw Error('unexpected import ' + name); });
  return mod.exports;
};

const lib = load('src/lib/media-recipe-import.ts');
const videoLib = load('src/lib/video-recipe-import.ts');
const display = load('src/lib/video-transfer-display.ts');

const CORE = 'https://api.tariften.com/wp-json/tariften/v1';
const TOKEN = 'a'.repeat(32);
const photo = (name = 'tabak.jpg', type = 'image/jpeg', size = 1000) =>
  new File([new Uint8Array(size)], name, { type });

function dishFixture(extra = {}) {
  return {
    success: true, mode: 'dish', generation_status: 'needs_review', requires_approval: true,
    ai_estimated: true, label: 'AI Tahmini Tarif',
    detected: { dish: 'Adana Kebap', confidence: 0.82, confidence_level: 'high', alternatives: ['Urfa Kebap'] },
    recipe: {
      title: 'Evde Adana Kebap', excerpt: 'Közde acılı kebap.', prep_time: '30', cook_time: 20, calories: '', servings: '4',
      cuisine: ['Türk Mutfağı'], meal_type: ['Akşam Yemeği'], difficulty: ['Orta'], diet: [],
      ingredients: [{ name: 'Dana kıyma', amount: '500', unit: 'gram' }, { name: 'Lavaş', amount: '4', unit: 'adet' }],
      steps: ['Kıymayı yoğurun.', 'Közde pişirin.'],
      chef_tip: 'Elinizi buzlu suya batırın.',
      seo: { title: 'Adana Kebap', description: 'Evde kebap', focus_keywords: 'adana kebap, kebap' },
      ai_estimated: true, nutrition_status: 'unverified',
    },
    assumptions: ['Acı seviyesi nottan alındı.'], uncertain: [], illegible: [],
    warnings: ['ai_estimated_recipe', 'nutrition_unverified'], needs_confirmation: [],
    allergens: { contains: ['gluten'], possible: [] }, allergen_conflicts: [], allergen_cautions: [], allergen_warning: '',
    preview_token: 'Qm3fAbCdEfGhIjKlMnOpQrStUvWxYz12', expires_at: '2026-10-22T14:05:00+00:00',
    page_count: 1, cover_available: true, default_visibility: 'private', source_kind: 'photo',
    ...extra,
  };
}

function notebookFixture() {
  return {
    success: true, mode: 'notebook', generation_status: 'needs_review', requires_approval: true,
    ai_estimated: false, label: '', detected: null,
    recipe: {
      title: 'Anneannemin Un Kurabiyesi', excerpt: '', prep_time: '', cook_time: '20', servings: '',
      cuisine: ['Türk Mutfağı'], meal_type: ['Tatlı'], difficulty: ['Kolay'],
      ingredients: [
        { name: 'Tereyağı', amount: '250', unit: 'gram', uncertain: false, note: '', original_text: '250 gr tereyağ', page: 1 },
        { name: 'Pudra şekeri', amount: '1', unit: 'su bardağı', uncertain: true, note: '1 mi 7 mi okunamadı', original_text: '1 (7?) sb pudra şekeri', page: 1 },
        { name: 'Un', amount: '3', unit: 'su bardağı', uncertain: true, note: '', original_text: '3 S.B. un', page: 2 },
      ],
      steps: ['Tereyağı ve şekeri çırpın.', 'Unu azar azar ekleyin.', 'Fırında pişirin.'],
      ai_estimated: false,
    },
    source_notes: 'Bayramlarda yapılırdı',
    assumptions: [],
    uncertain: [
      { field: 'ingredients', index: 1, note: '1 mi 7 mi okunamadı' },
      { field: 'steps', index: 1, text: 'Unu azar azar ekleyin.', note: 'Un miktarı silik' },
      { field: 'steps', index: 99, note: 'out of range is ignored' },
    ],
    illegible: ['Sayfa 2 sol alt köşe'],
    warnings: ['transcription_review', 'illegible_parts', 'uncertain_items'],
    needs_confirmation: ['uncertain_items'],
    allergens: { contains: ['gluten', 'milk'], possible: [] }, allergen_conflicts: [], allergen_cautions: [], allergen_warning: '',
    preview_token: 'NbAbCdEfGhIjKlMnOpQrStUvWxYz1234', expires_at: '', page_count: 2,
    cover_available: false, default_visibility: 'private', source_kind: 'notebook',
  };
}

async function withFetch(handler, run) {
  const before = global.fetch;
  const calls = [];
  global.fetch = async (url, init = {}) => { calls.push({ url: String(url), init }); return handler(String(url), init); };
  try { return await run(calls); } finally { global.fetch = before; }
}
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });

/* ------------------------------------------------------------------ photo */

test('photo endpoints are the documented Core URLs', () => {
  assert.equal(lib.PHOTO_PREVIEW_URL, CORE + '/ai/photo-recipe');
  assert.equal(lib.PHOTO_SAVE_URL, CORE + '/ai/photo-recipe/save');
  assert.equal(lib.RECIPE_VISIBILITY_URL, CORE + '/recipes/visibility');
  assert.equal(lib.VIDEO_UPLOAD_URL, CORE + '/ai/video-upload');
  assert.equal(lib.DEFAULT_VISIBILITY, 'private');
});

test('dish preview multipart: mode, exactly one images[] file, note and keep_cover', () => {
  const form = lib.buildPhotoPreviewForm('dish', [photo('Ayşe’nin tabağı.JPG')], '  restoranda yedim, acılıydı  ');
  assert.equal(form.get('mode'), 'dish');
  const images = form.getAll('images[]');
  assert.equal(images.length, 1);
  assert.equal(images[0].name, 'yemek.jpg', 'ASCII transport filename');
  assert.equal(form.get('note'), 'restoranda yedim, acılıydı');
  assert.equal(form.get('keep_cover'), '1');
  assert.equal(lib.buildPhotoPreviewForm('dish', [photo()], '', false).get('keep_cover'), '0');
  assert.equal(lib.buildPhotoPreviewForm('dish', [photo()], '').has('note'), false, 'empty note not sent');
  assert.throws(() => lib.buildPhotoPreviewForm('dish', [photo(), photo()], ''), /tek bir fotoğraf/);
  assert.throws(() => lib.buildPhotoPreviewForm('dish', [], ''), /fotoğraf/);
});

test('notebook preview keeps page order, 1–4 pages, no keep_cover', () => {
  const pages = [photo('c.png', 'image/png'), photo('a.webp', 'image/webp'), photo('b.jpg')];
  const form = lib.buildPhotoPreviewForm('notebook', pages, 'Anneannemin kurabiyesi');
  assert.equal(form.get('mode'), 'notebook');
  assert.deepEqual(form.getAll('images[]').map(f => f.name), ['sayfa-1.png', 'sayfa-2.webp', 'sayfa-3.jpg']);
  assert.equal(form.has('keep_cover'), false);
  assert.throws(() => lib.buildPhotoPreviewForm('notebook', Array.from({ length: 5 }, () => photo()), ''), /En fazla 4/);
  assert.throws(() => lib.buildPhotoPreviewForm('notebook', [photo()], 'x'.repeat(301)), /300/);
  // Reorder / remove helpers never mutate the member's list.
  const list = ['s1', 's2', 's3'];
  assert.deepEqual(lib.movePage(list, 2, 0), ['s3', 's1', 's2']);
  assert.deepEqual(lib.movePage(list, 0, 5), list);
  assert.deepEqual(lib.removePage(list, 1), ['s1', 's3']);
  assert.deepEqual(list, ['s1', 's2', 's3']);
});

test('photo file checks: type and 8 MB limit (bigger picks are scaled down first)', () => {
  assert.equal(lib.validatePhotoFile(photo()), null);
  assert.equal(lib.validatePhotoFile({ name: 'IMG_1.HEIC', type: '', size: 10 }), null, 'HEIC without MIME');
  assert.match(lib.validatePhotoFile({ name: 'a.gif', type: 'image/gif', size: 10 }), /JPG, PNG, WebP/);
  assert.equal(lib.validatePhotoFile({ name: 'a.jpg', type: 'image/jpeg', size: 8 * 1024 * 1024 }), null);
  assert.match(lib.validatePhotoFile({ name: 'a.jpg', type: 'image/jpeg', size: 8 * 1024 * 1024 + 1 }), /8 MB/);
  assert.equal(lib.validatePhotoPick({ name: 'a.jpg', type: 'image/jpeg', size: 20 * 1024 * 1024 }), null);
  assert.match(lib.validatePhotoPick({ name: 'a.jpg', type: 'image/jpeg', size: 41 * 1024 * 1024 }), /çok büyük/);
});

test('preview request: POST multipart with Bearer JWT straight to Core', async () => {
  await withFetch(() => json(dishFixture()), async calls => {
    const preview = await lib.requestPhotoPreview(TOKEN, 'dish', [photo()], 'acılı');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, CORE + '/ai/photo-recipe');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[0].init.headers.Authorization, 'Bearer ' + TOKEN);
    assert.equal(calls[0].init.headers['Content-Type'], undefined, 'browser sets the multipart boundary');
    assert.ok(calls[0].init.body instanceof FormData);
    assert.equal(calls[0].init.cache, 'no-store');
    assert.equal(preview.aiEstimated, true);
    assert.equal(preview.label, 'AI Tahmini Tarif');
    assert.equal(preview.detected.dish, 'Adana Kebap');
    assert.equal(preview.recipe.cook_time, '20', 'numbers become editable strings');
  });
});

test('friendly errors: not_food, unreadable page, feature off, quota and timeout', async () => {
  const cases = [
    [422, 'photo_recipe_not_food', /yemek göremedik/],
    [422, 'photo_recipe_unreadable', /okuyamadık/],
    [422, 'photo_recipe_not_recipe_page', /tarif bulamadık/],
    [415, 'photo_recipe_heic_unsupported', /JPG olarak/],
    [429, 'tariften_quota_exceeded', /hakkını kullandın/],
    [504, '', /uzun sürdü/],
    [413, '', /8 MB/],
  ];
  for (const [status, code, pattern] of cases) {
    await withFetch(() => json({ code, message: 'internal', data: { status } }, status), async () => {
      await assert.rejects(lib.requestPhotoPreview(TOKEN, 'dish', [photo()], ''), error => {
        assert.equal(error.name, 'MediaRecipeError');
        assert.match(error.message, pattern, code || String(status));
        return true;
      });
    });
  }
  await withFetch(() => json({ code: 'photo_recipe_unavailable', message: 'kapalı' }, 503), async () => {
    await assert.rejects(lib.requestPhotoPreview(TOKEN, 'notebook', [photo()], ''), error => {
      assert.equal(lib.isPhotoFeatureOff(error.failure), true);
      assert.match(error.message, /yakında/i);
      return true;
    });
  });
});

test('availability probe is the free save-validation path (no quota, no write)', async () => {
  await withFetch(() => json({ code: 'photo_recipe_save_invalid' }, 400), async calls => {
    assert.equal(await lib.checkPhotoRecipeAvailable(TOKEN), 'available');
    assert.equal(calls[0].url, CORE + '/ai/photo-recipe/save');
    assert.equal(calls[0].init.body, '{}');
  });
  await withFetch(() => json({ code: 'photo_recipe_unavailable' }, 503), async () => {
    assert.equal(await lib.checkPhotoRecipeAvailable(TOKEN), 'off');
  });
  await withFetch(() => json({ code: 'ai_upstream_error' }, 502), async () => {
    assert.equal(await lib.checkPhotoRecipeAvailable(TOKEN), 'unknown', 'only an explicit 503 hides the feature');
  });
});

test('untrusted preview shapes are rejected before display', () => {
  assert.throws(() => lib.parsePhotoPreview({ ...dishFixture(), requires_approval: false }, 'dish'), /beklenen biçimde/);
  assert.throws(() => lib.parsePhotoPreview({ ...dishFixture(), preview_token: 'short' }, 'dish'), /beklenen biçimde/);
  assert.throws(() => lib.parsePhotoPreview(dishFixture(), 'notebook'), /beklenen biçimde/, 'mode must match the request');
  const many = dishFixture();
  many.recipe.steps = Array.from({ length: 41 }, () => 'x');
  assert.throws(() => lib.parsePhotoPreview(many, 'dish'), /eksik/);
  // A dish estimate is always labelled; private is the default even if the field is missing.
  const unlabeled = lib.parsePhotoPreview({ ...dishFixture(), ai_estimated: false, label: '', default_visibility: undefined }, 'dish');
  assert.equal(unlabeled.aiEstimated, true);
  assert.equal(unlabeled.label, 'AI Tahmini Tarif');
  assert.equal(unlabeled.defaultVisibility, 'private');
});

test('notebook: uncertain ingredients/steps and illegible notes are flagged for the member', () => {
  const preview = lib.parsePhotoPreview(notebookFixture(), 'notebook');
  assert.equal(preview.aiEstimated, false);
  assert.equal(preview.coverAvailable, false);
  assert.deepEqual(preview.illegible, ['Sayfa 2 sol alt köşe']);
  assert.equal(preview.sourceNotes, 'Bayramlarda yapılırdı');
  const editor = lib.photoEditorFromPreview(preview);
  assert.deepEqual(editor.ingredients.map(i => i.uncertain), [false, true, true], 'inline flag on Un is kept');
  assert.deepEqual(editor.steps.map(s => s.uncertain), [false, true, false]);
  assert.equal(editor.steps[1].note, 'Un miktarı silik');
  assert.equal(editor.servings, '', 'missing servings are not invented');
  const none = { dish: false, allergens: false };
  assert.deepEqual(lib.pendingConfirmations(preview, editor, none), ['2 belirsiz malzemeyi kontrol et.', '1 belirsiz adımı kontrol et.']);
  editor.ingredients = editor.ingredients.map(i => ({ ...i, uncertain: false }));
  editor.steps = editor.steps.map(s => ({ ...s, uncertain: false }));
  assert.deepEqual(lib.pendingConfirmations(preview, editor, none), []);
  assert.equal(lib.photoSaveValidation(editor), null, 'empty servings/times are allowed');
});

test('dish: low confidence and allergen conflicts must be confirmed before save', () => {
  const preview = lib.parsePhotoPreview(dishFixture({
    detected: { dish: 'Mantı', confidence: 0.3, confidence_level: 'low', alternatives: ['Hingel'] },
    warnings: ['low_confidence', 'allergen_conflict'], needs_confirmation: ['dish', 'allergens'],
    allergen_conflicts: [{ key: 'gluten', label: 'Gluten', ingredients: ['Lavaş'] }],
    allergen_warning: 'Bu tarif alerji listendeki malzemeleri içeriyor (Gluten: Lavaş).',
  }), 'dish');
  const editor = lib.photoEditorFromPreview(preview);
  assert.equal(preview.allergenConflicts[0].label, 'Gluten');
  assert.equal(lib.pendingConfirmations(preview, editor, { dish: false, allergens: false }).length, 2);
  assert.deepEqual(lib.pendingConfirmations(preview, editor, { dish: true, allergens: false }), ['Alerjen uyarısını okuduğunu onayla.']);
  assert.deepEqual(lib.pendingConfirmations(preview, editor, { dish: true, allergens: true }), []);
});

test('save payload: private by default, server-owned fields never sent, cover only for dish', () => {
  const preview = lib.parsePhotoPreview(dishFixture(), 'dish');
  const editor = lib.photoEditorFromPreview(preview);
  const payload = lib.buildPhotoSavePayload(preview, editor, { visibility: preview.defaultVisibility, useCover: true });
  assert.deepEqual(Object.keys(payload).sort(), ['preview_token', 'recipe', 'use_photo_as_cover', 'visibility']);
  assert.equal(payload.visibility, 'private');
  assert.equal(payload.use_photo_as_cover, true);
  assert.equal(payload.preview_token, 'Qm3fAbCdEfGhIjKlMnOpQrStUvWxYz12');
  for (const key of ['image', 'ai_estimated', 'visibility', 'source_kind', 'status', 'author', 'id', 'quality_check']) {
    assert.equal(Object.hasOwn(payload.recipe, key), false, key);
  }
  assert.deepEqual(payload.recipe.ingredients[0], { name: 'Dana kıyma', amount: '500', unit: 'gram' });
  assert.deepEqual(payload.recipe.steps, ['Kıymayı yoğurun.', 'Közde pişirin.']);
  assert.deepEqual(payload.recipe.cuisine, ['Türk Mutfağı']);
  assert.equal(lib.buildPhotoSavePayload(preview, editor, { visibility: 'public', useCover: false }).visibility, 'public');
  assert.equal(lib.buildPhotoSavePayload(preview, editor, { visibility: 'everyone', useCover: false }).visibility, 'private', 'unknown → private');
  assert.equal(lib.buildPhotoSavePayload(preview, editor, { visibility: 'private', useCover: false }).use_photo_as_cover, false);
  const nb = lib.parsePhotoPreview(notebookFixture(), 'notebook');
  assert.equal(lib.buildPhotoSavePayload(nb, lib.photoEditorFromPreview(nb), { visibility: 'private', useCover: true }).use_photo_as_cover, false);
  const noCover = lib.parsePhotoPreview(dishFixture({ cover_available: false }), 'dish');
  assert.equal(lib.buildPhotoSavePayload(noCover, editor, { visibility: 'private', useCover: true }).use_photo_as_cover, false);
  editor.title = '';
  assert.throws(() => lib.buildPhotoSavePayload(preview, editor, { visibility: 'private', useCover: false }), /isim/);
});

test('save request posts JSON to /ai/photo-recipe/save and maps expiry', async () => {
  const preview = lib.parsePhotoPreview(dishFixture(), 'dish');
  const payload = lib.buildPhotoSavePayload(preview, lib.photoEditorFromPreview(preview), { visibility: 'private', useCover: true });
  await withFetch(() => json({ success: true, id: 4812, slug: 'evde-adana-kebap', visibility: 'private', cover_attached: true }, 201), async calls => {
    const saved = await lib.savePhotoRecipe(TOKEN, payload);
    assert.deepEqual(saved, { id: 4812, slug: 'evde-adana-kebap', visibility: 'private', coverAttached: true });
    assert.equal(calls[0].url, CORE + '/ai/photo-recipe/save');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(calls[0].init.body), payload);
  });
  await withFetch(() => json({ code: 'photo_recipe_preview_expired', message: '' }, 410), async () => {
    await assert.rejects(lib.savePhotoRecipe(TOKEN, payload), /süresi doldu/);
  });
});

/* ------------------------------------------------------ visibility, badges */

test('visibility toggle: POST /recipes/visibility {id, visibility}', async () => {
  const request = lib.buildVisibilityRequest(TOKEN, 4812, 'public');
  assert.equal(request.url, CORE + '/recipes/visibility');
  assert.equal(request.init.method, 'POST');
  assert.equal(request.init.headers.Authorization, 'Bearer ' + TOKEN);
  assert.deepEqual(JSON.parse(request.init.body), { id: 4812, visibility: 'public' });
  assert.throws(() => lib.buildVisibilityRequest(TOKEN, 0, 'public'));
  assert.throws(() => lib.buildVisibilityRequest(TOKEN, 1, 'friends'));
  await withFetch(() => json({ success: true, id: 4812, visibility: 'public' }), async () => {
    assert.equal(await lib.setRecipeVisibility(TOKEN, 4812, 'public'), 'public');
  });
  await withFetch(() => json({ code: 'recipe_visibility_unsupported' }, 409), async () => {
    await assert.rejects(lib.setRecipeVisibility(TOKEN, 4812, 'private'), /değiştirilemez/);
  });
});

test('badge logic: AI label for everyone, private badge and toggle only for the owner', () => {
  const recipe = { ai_estimated: true, visibility: 'private', source_kind: 'photo', author: { id: 7 } };
  assert.deepEqual(lib.recipeBadgeState(recipe, 7), { aiEstimated: true, privateForOwner: true, canToggleVisibility: true, visibility: 'private' });
  assert.deepEqual(lib.recipeBadgeState(recipe, 8), { aiEstimated: true, privateForOwner: false, canToggleVisibility: false, visibility: 'private' });
  assert.equal(lib.recipeBadgeState(recipe, null).privateForOwner, false);
  assert.equal(lib.recipeBadgeState({ ...recipe, visibility: 'public' }, 7).privateForOwner, false);
  assert.equal(lib.recipeBadgeState({ ...recipe, source_kind: '' }, 7).canToggleVisibility, false, 'normal recipes have no switch');
  assert.equal(lib.recipeBadgeState({ source_kind: 'notebook', author: { id: 7 } }, 7).aiEstimated, false);
  assert.equal(lib.recipeBadgeState({ ai_estimated: 'true' }, 7).aiEstimated, false, 'only a real boolean');
});

test('owner lookup for private recipes: member token, no-store, never ISR', () => {
  const bySlug = lib.buildOwnerRecipeLookup(TOKEN, 'evde-adana-kebap');
  assert.equal(bySlug.url, CORE + '/recipes/search?slug=evde-adana-kebap');
  assert.equal(bySlug.init.cache, 'no-store');
  assert.equal(bySlug.init.headers.Authorization, 'Bearer ' + TOKEN);
  assert.equal(Object.hasOwn(bySlug.init, 'next'), false);
  assert.equal(lib.buildOwnerRecipeLookup(TOKEN, '4812').url, CORE + '/recipes/search?id=4812');
  assert.equal(lib.buildOwnerRecipeLookup('', 'x'), null);
});

/* --------------------------------------------------------------- own video */

test('video file checks: MP4/MOV only, ≤200 MB, ≤3:00 from <video> metadata', () => {
  const MB = 1024 * 1024;
  assert.equal(lib.validateVideoFile({ name: 'IMG_0042.MOV', type: 'video/quicktime', size: 50 * MB }), null);
  assert.equal(lib.validateVideoFile({ name: 'a.mp4', type: 'video/mp4', size: 200 * MB }), null);
  assert.match(lib.validateVideoFile({ name: 'a.mp4', type: 'video/mp4', size: 200 * MB + 1 }), /200 MB/);
  assert.match(lib.validateVideoFile({ name: 'a.webm', type: 'video/webm', size: 10 }), /MP4 veya MOV/);
  assert.equal(lib.validateVideoFile({ name: 'clip.mov', type: '', size: 10 }), null);
  assert.equal(lib.validateVideoDuration(180), null);
  assert.equal(lib.validateVideoDuration(180.4), null, 'container rounding');
  assert.match(lib.validateVideoDuration(181), /3 dakika/);
  assert.equal(lib.validateVideoDuration(null), null, 'unknown duration is checked by Core');
  assert.equal(lib.isKnownDuration(NaN), false);
  assert.equal(lib.formatDuration(125.6), '2:06');
});

test('video multipart: video, note and the idempotency request_id', () => {
  const file = new File([new Uint8Array(10)], 'IMG 0042.MOV', { type: 'video/quicktime' });
  const id = '3f6c2a8e-7d41-4b1e-9a55-0c2d9e7b1a10';
  const form = lib.buildVideoUploadForm(file, ' 4 kişilik ', id);
  assert.equal(form.get('video').name, 'video.mov');
  assert.equal(form.get('note'), '4 kişilik');
  assert.equal(form.get('request_id'), id);
  assert.throws(() => lib.buildVideoUploadForm(file, '', 'short'), /kimliği/);
  assert.throws(() => lib.buildVideoUploadForm(file, 'x'.repeat(1001), id), /1000/);
});

function fakeXhr(respond) {
  const sent = [];
  class FakeXhr {
    constructor() { this.headers = {}; this.upload = { onprogress: null }; this.status = 0; this.responseText = ''; sent.push(this); }
    open(method, url) { this.method = method; this.url = url; }
    setRequestHeader(k, v) { this.headers[k] = v; }
    abort() { this.onabort?.(); }
    send(body) { this.body = body; queueMicrotask(() => respond(this)); }
  }
  return { FakeXhr, sent };
}

test('upload uses XHR with progress, Bearer JWT and the same request_id on retry', async () => {
  const before = global.XMLHttpRequest;
  const file = new File([new Uint8Array(10)], 'a.mp4', { type: 'video/mp4' });
  const id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  try {
    let attempt = 0;
    const { FakeXhr, sent } = fakeXhr(xhr => {
      attempt++;
      if (attempt === 1) { xhr.onerror(); return; }
      xhr.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
      xhr.upload.onprogress({ lengthComputable: true, loaded: 100, total: 100 });
      xhr.status = 202;
      xhr.responseText = JSON.stringify({ job_id: 412, success: true, id: 412, status: 'queued', source_url: 'upload:9b1f0c7e2d4a4f8e8a6b3c2d1e0f9a8b', source_kind: 'upload' });
      xhr.onload();
    });
    global.XMLHttpRequest = FakeXhr;
    await assert.rejects(lib.uploadOwnVideo({ token: TOKEN, file, note: '', requestId: id }), /ikinci kez hak düşmez/);
    const progress = [];
    const accepted = await lib.uploadOwnVideo({ token: TOKEN, file, note: '', requestId: id, onProgress: p => progress.push(p) });
    assert.deepEqual(accepted, { jobId: 412, status: 'queued', message: '', errorCode: '' });
    assert.deepEqual(progress, [0.5, 1]);
    assert.equal(sent.length, 2);
    for (const xhr of sent) {
      assert.equal(xhr.method, 'POST');
      assert.equal(xhr.url, CORE + '/ai/video-upload');
      assert.equal(xhr.headers.Authorization, 'Bearer ' + TOKEN);
      assert.equal(xhr.body.get('request_id'), id, 'retry keeps the request_id');
    }
  } finally { global.XMLHttpRequest = before; }
});

test('upload errors: proxy HTML 413, too long, feature off', async () => {
  const before = global.XMLHttpRequest;
  const file = new File([new Uint8Array(10)], 'a.mp4', { type: 'video/mp4' });
  const id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  try {
    for (const [status, body, pattern] of [
      [413, '<html>413 Request Entity Too Large</html>', /200 MB/],
      [422, JSON.stringify({ code: 'video_upload_too_long', message: 'x' }), /3 dakika/],
      [503, JSON.stringify({ code: 'video_upload_unavailable', message: 'x' }), /yakında/i],
      [429, JSON.stringify({ code: 'video_upload_busy', message: 'x' }), /iki videon/],
    ]) {
      const { FakeXhr } = fakeXhr(xhr => { xhr.status = status; xhr.responseText = body; xhr.onload(); });
      global.XMLHttpRequest = FakeXhr;
      await assert.rejects(lib.uploadOwnVideo({ token: TOKEN, file, note: '', requestId: id }), pattern);
    }
  } finally { global.XMLHttpRequest = before; }
});

test('own-upload jobs parse, show as "Kendi videon" and are never treated as links', () => {
  const job = videoLib.parseVideoJob({
    success: true, id: 412, status: 'processing', source_url: 'upload:9b1f0c7e2d4a4f8e8a6b3c2d1e0f9a8b',
    source_kind: 'upload', requires_approval: true, message: 'Video analiz ediliyor.',
  });
  assert.equal(videoLib.isOwnUploadJob(job), true);
  assert.equal(videoLib.isVideoRecipeLink(job.source_url), false);
  assert.throws(() => videoLib.parseVideoJob({ ...job, source_kind: 'social' }), /beklenen biçimde/, 'upload ref requires source_kind=upload');
  assert.throws(() => videoLib.parseVideoJob({ ...job, source_url: 'upload:../../etc' }), /beklenen biçimde/);
  assert.equal(lib.isUploadSourceUrl(job.source_url), true);
  assert.equal(lib.isUploadSourceUrl('https://youtu.be/abcdefghijk'), false);
  assert.equal(display.transferPlatform(job.source_url), 'Kendi videon');
  assert.equal(display.transferTitle(job.source_url), 'Kendi videon');
  assert.equal(display.transferTitle('https://www.instagram.com/reel/abc/'), 'Instagram videosu');
});

/* -------------------------------------------------------- source contracts */

test('own video screen: quota pre-check, uuid per file, progress, polling, "Yeni video yükle"', () => {
  const page = read('src/components/media-recipe/OwnVideoStudio.tsx');
  assert.ok(page.indexOf('fetchAccountQuotas(token)') < page.indexOf('uploadOwnVideo({'), 'quota checked before the upload starts');
  assert.match(page, /quotaReached\(fresh, "recipe_ai_day"\)/);
  assert.match(page, /requestIdRef\.current = crypto\.randomUUID\(\)/);
  assert.match(page, /requestId: requestIdRef\.current/);
  assert.match(page, /onloadedmetadata/);
  assert.match(page, /validateVideoDuration\(duration\)/);
  assert.match(page, /role="progressbar"/);
  assert.match(page, /\/api\/recipe-social\/video\/status\/\$\{jobId\}/);
  assert.match(page, /router\.push\(`\/recipe\/aktar\?job=\$\{job\.id\}`\)/);
  assert.match(page, /Yeni video yükle/);
  assert.doesNotMatch(page, /source_url/, 'the upload reference is never shown');
  assert.doesNotMatch(page, /Yeniden dene</, 'a failed job is not retried; the file is deleted');
});

test('transfers and review screen never link an upload reference', () => {
  const tracker = read('src/app/recipe/aktarimlarim/page.tsx');
  assert.match(tracker, /isUpload\(item\) \? \(\s*<Link href="\/recipe\/kendi-videon"/);
  assert.match(tracker, /item\.status === "failed" && item\.retryable/);
  const importPage = read('src/app/recipe/import/page.tsx');
  assert.match(importPage, /setSocialUrl\(ownUpload \? "" : job\.source_url\)/);
  assert.match(importPage, /Kendi videon · düzenlenmiş tarif sağda/);
  assert.equal((importPage.match(/if \(!isOwnUploadJob\(job\)\) setSocialUrl\(job\.source_url\)/g) || []).length, 2);
});

test('photo screens: quota check first, "Yakında" when off, private default and cover option', () => {
  const studio = read('src/components/media-recipe/PhotoRecipeStudio.tsx');
  const editor = read('src/components/media-recipe/MediaRecipeEditor.tsx');
  assert.ok(studio.indexOf('fetchAccountQuotas(token)') < studio.indexOf('requestPhotoPreview(token'), 'quota before the paid preview');
  assert.match(studio, /checkPhotoRecipeAvailable\(token/);
  assert.match(studio, /Yakında/);
  assert.match(studio, /void quotas\.reload\(\)/);
  assert.match(editor, /useState<RecipeVisibility>\(preview\.defaultVisibility \|\| DEFAULT_VISIBILITY\)/);
  assert.match(editor, /"Sadece ben"/);
  assert.match(editor, /"Herkese açık"/);
  assert.match(editor, /Fotoğrafı kapak yap/);
  assert.match(editor, /AI Tahmini Tarif/);
  assert.match(editor, /pendingConfirmations\(preview, editor, confirmed\)/);
  assert.match(editor, /pending\.length === 0/);
  for (const page of ['src/app/recipe/fotograftan/page.tsx', 'src/app/recipe/defterden/page.tsx', 'src/app/recipe/kendi-videon/page.tsx']) {
    assert.ok(fs.existsSync(path.join(root, page)), page);
  }
});

test('private recipe detail: client fallback with the member token, no JSON-LD, owner badges', () => {
  const page = read('src/app/recipe/[slug]/page.tsx');
  const notFound = read('src/app/recipe/[slug]/not-found.tsx');
  const fallback = read('src/components/recipe/PrivateRecipeFallback.tsx');
  const view = read('src/components/recipe/RecipeDetailView.tsx');
  const badges = read('src/components/recipe/RecipeStatusBadges.tsx');
  const cards = read('src/components/recipes/RecipeCardBadges.tsx');
  assert.match(page, /notFound\(\)/);
  assert.match(page, /<RecipeDetailView recipe=\{recipe\} \/>/);
  assert.match(notFound, /<PrivateRecipeFallback fallback=\{<NotFound \/>\} \/>/);
  assert.match(fallback, /fetchOwnerRecipe<Recipe>\(token, slug/);
  assert.match(fallback, /<RecipeDetailView recipe=\{state\.recipe\} \/>/);
  assert.match(view, /recipe\.visibility !== "private" && <RecipeJsonLd/);
  assert.match(view, /<RecipeStatusBadges recipe=\{recipe\} \/>/);
  assert.match(badges, /Sadece sen görüyorsun/);
  assert.match(badges, /setRecipeVisibility\(user\.token, recipe\.id, next\)/);
  assert.match(cards, /AI Tahmini Tarif/);
  for (const list of ['src/components/recipes/RecipeCard.tsx', 'src/components/account/MyKitchenLibrary.tsx']) {
    assert.match(read(list), /<RecipeCardBadges recipe=\{recipe\} \/>/, list);
  }
  assert.match(read('src/app/recipe/edit/[id]/page.tsx'), /fetchOwnerRecipe<Recipe>\(token, String\(recipeId\)\)/);
});

test('entry points: global + menu and import screens offer the three new ways', () => {
  const menu = read('src/components/navigation/GlobalCreateMenu.tsx');
  for (const href of ['/recipe/fotograftan', '/recipe/defterden', '/recipe/kendi-videon']) {
    assert.ok(menu.includes('href: "' + href + '"'), href);
    assert.ok(read('src/components/media-recipe/MediaRecipeLinks.tsx').includes('href: "' + href + '"'), href);
    assert.ok(read('src/app/recipe/create/page.tsx').includes('href="' + href + '"'), href);
  }
  assert.match(read('src/app/recipe/import/page.tsx'), /<MediaRecipeLinks current="link" \/>/);
});
