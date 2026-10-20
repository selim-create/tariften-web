'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const js = ts.transpileModule(read('src/lib/video-recipe-import.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
Function('module', 'exports', 'require', js)(mod, mod.exports, () => { throw Error('unexpected_import'); });
const { isYouTubeVideoLink, isInstagramReelLink, isInstagramPostLink, isVideoRecipeLink, parseVideoJob, videoEditorFromJob } = mod.exports;
const link = 'https://www.youtube.com/watch?v=abcdefghijk';

function fixture() {
  return {
    success: true, id: 17, status: 'needs_review', source_url: link,
    message: 'Tarif hazır', requires_approval: true,
    preview: {
      status: 'needs_review', requires_approval: true,
      recipe: {
        title: 'Kuru Domatesli Gnocchi', excerpt: 'Bademli kırmızı pesto.',
        servings: 2, cuisine: 'İtalyan', meal_type: 'Ana Yemek',
        needs_confirmation: ['Sarımsak videoda eksik algılanmış olabilir.'],
        quality_review: { issues: [{
          code: 'sauce_batch_usage_unclear', message: 'Kalan pesto miktarını kontrol et.',
        }] },
        ingredients: [
          { name: 'Gnocchi', amount: 400, unit: 'g', evidence: 'visual', quantity_verified: false },
          { name: 'Sarımsak', amount: null, unit: null, evidence: 'inferred', quantity_verified: false },
        ],
        steps: [{ instruction: 'Pestoyu gnocchiyle karıştırın.', evidence: 'visual' }],
        nutrition: { calories_per_serving: null },
      },
    },
  };
}
test('YouTube/Shorts detector is bounded to exact allowed URLs, not hostile lookalikes', () => {
  assert.equal(isYouTubeVideoLink(link), true);
  assert.equal(isYouTubeVideoLink('https://youtu.be/abcdefghijk'), true);
  assert.equal(isYouTubeVideoLink('https://youtube.com/shorts/abcdefghijk'), true);
  for (const url of [
    'https://youtube.com.evil.test/watch?v=abcdefghijk', 'http://youtube.com/watch?v=abcdefghijk',
    'https://youtube.com/shorts/abcdefghijk/trap', 'https://youtube.com/embed/abcdefghijk',
    'https://instagram.com/reel/abcdefghijk',
  ]) assert.equal(isYouTubeVideoLink(url), false, url);
});
test('Instagram Reels detection and review keep exact host, rights and YouTube compatibility', () => {
  const reel = 'https://www.instagram.com/reel/C5ToOyqIZvb/';
  assert.equal(isInstagramReelLink(reel), true);
  assert.equal(isInstagramReelLink('https://instagram.com/reels/C5ToOyqIZvb/?igsh=abc'), true);
  assert.equal(isVideoRecipeLink(reel), true);
  assert.equal(isVideoRecipeLink(link), true);
  for (const bad of [
    'http://instagram.com/reel/C5ToOyqIZvb/', 'https://instagram.com.evil.test/reel/C5ToOyqIZvb/',
    'https://user@instagram.com/reel/C5ToOyqIZvb/', 'https://instagram.com:444/reel/C5ToOyqIZvb/',
    'https://instagram.com/p/C5ToOyqIZvb/', 'https://instagram.com/tv/C5ToOyqIZvb/',
    'https://instagram.com/reel/C5ToOyqIZvb/extra', 'https://instagram.com/reel/four',
  ]) assert.equal(isInstagramReelLink(bad), false, bad);
  const job = parseVideoJob({ ...fixture(), source_url: reel });
  assert.equal(videoEditorFromJob(job).editor.title, 'Kuru Domatesli Gnocchi');
  const page = read('src/app/recipe/import/page.tsx');
  const start = read('src/app/api/recipe-social/video/start/route.ts');
  assert.match(page, /\[instagramRightsConfirmed, setInstagramRightsConfirmed\] = useState\(true\)/);
  assert.match(page, /setInstagramRightsConfirmed\(true\); setSocialUrl/);
  assert.match(page, /onChange=\{event => setInstagramRightsConfirmed\(event.target.checked\)\}/);
  assert.match(page, /text-\[11px\] leading-4/);
  assert.doesNotMatch(page, /Herkese açık olması tek başına kullanım hakkı vermez/);
  assert.match(page, /rights_confirmed: true/);
  assert.match(start, /request_id,rights_confirmed,source_url/);
  assert.match(start, /p.rights_confirmed !== true/);
});

test('true Gemini video preview maps to editable fields without falsifying source proof', () => {
  const raw = fixture();
  const job = parseVideoJob(raw);
  const { editor, warnings } = videoEditorFromJob(job);
  assert.equal(editor.title, 'Kuru Domatesli Gnocchi');
  assert.equal(editor.servings, '2');
  assert.equal(editor.calories, '', 'no fabricated calories');
  assert.equal(editor.ingredients[0].amount, '400');
  assert.equal(editor.ingredients[1].amount, '');
  assert.equal(editor.ingredients[0].source_verified, false);
  assert.equal(editor.ingredients[1].source_verified, false);
  assert.equal(editor.ingredients[0].original_span, '', 'never forge source excerpt');
  assert.equal(editor.steps[0].source_verified, false);
  assert.ok(warnings.some(w => w.includes('pesto')));
  assert.ok(warnings.some(w => w.includes('Sarımsak')));
  assert.equal(raw.preview.recipe.ingredients[0].amount, 400, 'source remains unchanged');
});
test('rejects false success statuses and malformed video output', () => {
  assert.throws(() => parseVideoJob({ ...fixture(), requires_approval: false }), /beklenen biçimde/);
  const pending = { ...fixture(), status: 'processing' };
  assert.throws(() => videoEditorFromJob(parseVideoJob(pending)), /henüz hazır/);
  const forged = fixture();
  forged.preview.recipe.ingredients = [];
  assert.throws(() => videoEditorFromJob(parseVideoJob(forged)), /eksik/);
  const invalid = fixture();
  invalid.preview.requires_approval = false;
  assert.throws(() => videoEditorFromJob(parseVideoJob(invalid)), /inceleme formatında/);
});
test('Web video routes and UX use only server Core, idempotent request and explicit edit/publish', () => {
  const start = read('src/app/api/recipe-social/video/start/route.ts');
  const status = read('src/app/api/recipe-social/video/status/[id]/route.ts');
  const page = read('src/app/recipe/import/page.tsx');
  assert.match(start, /ai\/recipe-social\/video/);
  assert.match(start, /AbortSignal\.timeout/);
  assert.match(start, /cache: "no-store"/);
  assert.match(status, /Bearer/);
  assert.match(status, /AbortSignal\.timeout/);
  assert.match(page, /parseVideoJob\(payload\)/);
  assert.match(page, /videoEditorFromJob\(job\)/);
  assert.match(page, /request_id: requestId/);
  assert.match(page, /\/api\/recipe-social\/video\/status/);
  assert.match(page, /videoReview \? "AI önerisi/);
  assert.match(page, /publishValidation\(editor\)/);
  assert.match(page, /buildApprovedRecipe\(editor\)/);
  assert.doesNotMatch(page, /generateImage/);
});

test('published source lookup, private history and video owner publish use guarded routes', () => {
  const page = read('src/app/recipe/import/page.tsx');
  const resolve = read('src/app/api/recipe-social/video/resolve/route.ts');
  const history = read('src/app/api/recipe-social/video/history/route.ts');
  const publish = read('src/app/api/recipe-social/video/publish/route.ts');
  assert.match(page, /\/api\/recipe-social\/video\/resolve/);
  assert.match(page, /\/api\/recipe-social\/video\/history/);
  assert.match(page, /\/api\/recipe-social\/video\/publish/);
  assert.match(page, /found\.status === "existing"/);
  assert.match(page, /found\.status === "published"/);
  assert.match(page, /reviewJobId/);
  assert.match(page, /router\.push\(\`\/recipe\/aktarimlarim\?job=/);
  assert.doesNotMatch(page, /attempt < 18/, 'Web never waits for the paid worker');
  assert.match(page, /Tarif Aktarımlarım/);
  for (const route of [resolve, history, publish]) {
    assert.match(route, /Authorization: token/);
    assert.match(route, /cache: "no-store"/);
    assert.match(route, /AbortSignal\.timeout/);
  }
  assert.match(resolve, /isVideoRecipeLink/);
  assert.match(publish, /job_id,recipe/);
  assert.doesNotMatch(page, /attempt < 100/, 'no five-minute spinner');
});

test('provider estimated calories are labelled tentative, not silently removed', () => {
  const job = fixture();
  job.preview.recipe.nutrition.calories_per_serving = 926.2;
  const { editor, warnings } = videoEditorFromJob(parseVideoJob(job));
  assert.equal(editor.calories, '926');
  assert.ok(warnings.some(w => w.includes('Kalori') && w.includes('tahminidir')));
});

test('social source card is premium, safe and genuinely attributable', () => {
  const card = read('src/components/recipe/SocialRecipeSourceCard.tsx');
  const detail = read('src/app/recipe/[slug]/page.tsx');
  const types = read('src/types/index.ts');
  assert.match(card, /Orijinal videoyu aç/);
  assert.match(card, /rel="noopener noreferrer nofollow"/);
  assert.match(card, /setWatching\(true\)/);
  assert.match(card, /source\.creator_handle/);
  assert.doesNotMatch(card, /viewCount|likeCount|2\.8M|35K/, 'social counts are never fabricated');
  assert.match(detail, /<SocialRecipeSourceCard source=\{recipe\.social_source\}/);
  assert.match(types, /social_source\?: RecipeSocialSource/);
});

test('async recipe transfer gives a notification without blocking the editor', () => {
  const page = read('src/app/recipe/import/page.tsx');
  const ready = read('src/components/layout/VideoRecipeReadyNotice.tsx');
  const layout = read('src/app/layout.tsx');
  assert.match(page, /\/recipe\/aktarimlarim\?job=/);
  assert.match(page, /deepLinkOpenedRef/);
  assert.match(page, /URLSearchParams\(window\.location\.search\)/);
  assert.match(page, /Tarif Aktarımlarım/);
  assert.match(ready, /setInterval\(\(\) => \{ void check\(\); \}, 60000\)/);
  assert.match(ready, /\["needs_review", "published"\]/);
  assert.match(ready, /\/recipe\/aktar\?job=/);
  assert.match(layout, /<VideoRecipeReadyNotice/);
});

test('Instagram standard post may be photo or carousel; cannot be silently sold as video', () => {
  const standard = 'https://www.instagram.com/p/DFiPb_aoAXi/';
  assert.equal(isInstagramPostLink(standard), true);
  assert.equal(isVideoRecipeLink(standard), false);
  assert.equal(isInstagramPostLink('https://www.instagram.com/p/DFiPb_aoAXi/?igsh=test'), true);
  assert.equal(isInstagramReelLink(standard), false);
  for (const suspicious of [
    'https://instagram.com.evil.tld/p/DFiPb_aoAXi/',
    'http://www.instagram.com/p/DFiPb_aoAXi/',
    'https://www.instagram.com/p/abcd/',
    'https://user@www.instagram.com/p/DFiPb_aoAXi/',
    'https://www.instagram.com/p/DFiPb_aoAXi/extra',
  ]) assert.equal(isInstagramPostLink(suspicious), false, suspicious);
  const page = read('src/app/recipe/import/page.tsx');
  assert.match(page, /isInstagramPostLink\(url\)/);
  assert.match(page, /await requestVideoPreview\(url\)/);
  assert.match(page, /Mevcut tarifi bul/);
  assert.match(page, /Instagram gönderi bağlantıları/);
});

test('separate transfers page handles stalled jobs and automatic publication without charging again', () => {
  const tracker = read('src/app/recipe/aktarimlarim/page.tsx');
  const importPage = read('src/app/recipe/import/page.tsx');
  const notice = read('src/components/layout/VideoRecipeReadyNotice.tsx');
  assert.match(tracker, /Tarif Aktarımlarım/);
  assert.match(tracker, /Date\.now\(\) - date > 10 \* 60 \* 1000/);
  assert.match(tracker, /bu kaydı henüz tamamlamadı/);
  assert.match(tracker, /setInterval\(\(\) => \{ void load\(\); \}, 20000\)/);
  assert.match(tracker, /item\.status === "published"/);
  assert.match(importPage, /router\.push\(\`\/recipe\/aktarimlarim\?job=/);
  assert.match(notice, /ready\.status === "published"/);
  assert.match(notice, /encodeURIComponent\(ready\.recipe_slug\)/);
});

test('Instagram post aliases resolve existing public Reels but never start unknown videos', () => {
  const page = read('src/app/recipe/import/page.tsx');
  const resolve = read('src/app/api/recipe-social/video/resolve/route.ts');
  assert.match(resolve, /isInstagramPostLink\(body\.source_url\)/);
  assert.match(page, /found\.status === "unsupported_post"/);
  assert.match(page, /found\.can_start === true && isVideoRecipeLink\(url\)/);
  assert.match(page, /Mevcut tarifi bul/);
});

test('social card shows only measured and timestamped counts, never synthetic values', () => {
  const card = read('src/components/recipe/SocialRecipeSourceCard.tsx');
  const types = read('src/types/index.ts');
  assert.match(card, /source\.metrics_origin === "public_instagram_extractor"/);
  assert.match(card, /source\.view_count/);
  assert.match(card, /source\.like_count/);
  assert.match(card, /source\.follower_count/);
  assert.match(card, /Number\.isSafeInteger/);
  assert.match(card, /güncel veya resmî hesap istatistiği değildir/);
  assert.match(types, /metrics_captured_at\?: string/);
});
