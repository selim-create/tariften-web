'use strict';
/** Social source card: Instagram / TikTok / YouTube creator identity and import-time snapshot. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const js = ts.transpileModule(read('src/lib/social-source.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
Function('module', 'exports', 'require', js)(mod, mod.exports, () => { throw Error('unexpected_import'); });
const { socialProfileUrl, socialCapturedDate, socialEmbedUrl } = mod.exports;

test('profile links stay on the platform host; YouTube is never derived from a handle', () => {
  assert.equal(socialProfileUrl('instagram', null, 'mob.kitchen'), 'https://www.instagram.com/mob.kitchen/');
  assert.equal(socialProfileUrl('tiktok', 'https://www.tiktok.com/@cook.art', 'cook.art'), 'https://www.tiktok.com/@cook.art');
  assert.equal(socialProfileUrl('tiktok', null, 'cook.art'), 'https://www.tiktok.com/@cook.art');
  assert.equal(socialProfileUrl('youtube', 'https://www.youtube.com/@Mutfak-Kanali', 'Mutfak-Kanali'), 'https://www.youtube.com/@Mutfak-Kanali');
  assert.equal(socialProfileUrl('youtube', 'https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv', null),
    'https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv');
  assert.equal(socialProfileUrl('youtube', null, 'mutfak'), null);
  for (const [platform, url] of [
    ['instagram', 'https://www.instagram.com.evil.test/mob/'], ['instagram', 'http://www.instagram.com/mob/'],
    ['instagram', 'javascript:alert(1)'], ['tiktok', 'https://www.instagram.com/mob/'],
    ['tiktok', 'https://www.tiktok.com/@mob?x=1'], ['youtube', 'https://www.youtube.com/c/legacy'],
    ['youtube', 'https://youtube.com.evil.test/@mob'],
  ]) assert.equal(socialProfileUrl(platform, url, null), null, `${platform} ${url}`);
  assert.equal(socialProfileUrl('instagram', 'https://evil.test/x', 'mob'), 'https://www.instagram.com/mob/',
    'an invalid stored URL falls back to the handle-derived profile');
  assert.equal(socialProfileUrl('instagram', null, 'bad-handle'), null);
});

test('capture date is formatted in Turkish and hidden when invalid', () => {
  assert.equal(socialCapturedDate('2026-10-21T09:00:00Z'), '21 Ekim 2026');
  assert.equal(socialCapturedDate('2026-10-20T22:30:00.000Z'), '21 Ekim 2026', 'Europe/Istanbul calendar day');
  for (const bad of [null, undefined, '', 'yesterday', '2026-13-45T99:99:99Z']) assert.equal(socialCapturedDate(bad), null);
});

test('embeds are built only from validated ids (TikTok numeric, YouTube 11 chars)', () => {
  assert.equal(socialEmbedUrl('tiktok', '7359876543210987654'), 'https://www.tiktok.com/embed/v2/7359876543210987654');
  assert.equal(socialEmbedUrl('tiktok', 'abc'), null);
  assert.equal(socialEmbedUrl('youtube', 'abcdefghijk'), 'https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0');
  assert.equal(socialEmbedUrl('youtube', 'abc/../x'), null);
  assert.equal(socialEmbedUrl('instagram', 'C5ToOyqIZvb'), 'https://www.instagram.com/reel/C5ToOyqIZvb/embed/');
});

test('card shows followers, views, likes, comments only from the platform\'s own origin', () => {
  const card = read('src/components/recipe/SocialRecipeSourceCard.tsx');
  const types = read('src/types/index.ts');
  assert.match(types, /platform: "instagram" \| "tiktok" \| "youtube"/);
  assert.match(types, /creator_name\?: string \| null/);
  assert.match(types, /creator_profile_url\?: string \| null/);
  assert.match(types, /comment_count\?: number \| null/);
  for (const origin of ['public_instagram_extractor', 'public_tiktok_extractor', 'public_youtube_data_api']) {
    assert.match(types, new RegExp(`"${origin}"`));
  }
  assert.match(card, /source\.platform === "tiktok" && source\.metrics_origin === "public_tiktok_extractor"/);
  assert.match(card, /source\.platform === "youtube" && source\.metrics_origin === "public_youtube_data_api"/);
  for (const label of ['Takipçi', 'İzlenme', 'Beğeni', 'Yorum']) assert.match(card, new RegExp(`label: "${label}"`));
  assert.match(card, /source\.comment_count/);
  assert.match(card, /tarihinde, ` : ""\}Tariften&apos;e aktarıldığı anda alınan değerlerdir/);
  assert.match(card, /open: "TikTok'ta aç"/);
  assert.match(card, /socialProfileUrl\(source\.platform, source\.creator_profile_url, trusted\)/);
  assert.match(card, /href=\{profile\} target="_blank" rel="noopener noreferrer nofollow"/);
  assert.doesNotMatch(card, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(card, /viewCount|likeCount|2\.8M|35K/, 'social counts are never fabricated');
});

test('all main recipe image slots expose the social source badge', () => {
  for (const file of [
    'src/components/recipes/RecipeCard.tsx',
    'src/components/account/MyKitchenLibrary.tsx',
    'src/components/recipe/RecipeDetailClient.tsx',
    'src/app/recipe/[slug]/page.tsx',
    'src/app/page.tsx',
  ]) {
    assert.match(read(file), /<SocialPlatformBadge source=/, file);
  }
  const badge = read('src/components/recipe/SocialPlatformBadge.tsx');
  assert.match(badge, /pointer-events-none/);
  assert.match(badge, /bottom-3 right-3/);
});

test('social-source objection opens a real in-site form, not a mailto action', () => {
  const card = read('src/components/recipe/SocialRecipeSourceCard.tsx');
  assert.match(card, /content-report\?recipe=/);
  assert.doesNotMatch(card, /mailto:/);
  const form = read('src/components/recipe/ContentReportForm.tsx');
  assert.match(form, /content-reports/);
  assert.match(form, /Başvuru numaran:/);
});
