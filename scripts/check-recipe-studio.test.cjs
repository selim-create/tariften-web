const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const load = file => {
  const compiled = ts.transpileModule(read(file), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod = {exports:{}};
  Function('module','exports',compiled)(mod,mod.exports);
  return mod.exports;
};

test('transfer rows name the real platform and date, never an internal id', () => {
  const { transferPlatform, transferWhen, parseTransferDate } = load('src/lib/video-transfer-display.ts');
  assert.equal(transferPlatform('https://www.instagram.com/reel/abc/'), 'Instagram');
  assert.equal(transferPlatform('https://vm.tiktok.com/x'), 'TikTok');
  assert.equal(transferPlatform('https://youtu.be/abc'), 'YouTube');
  assert.equal(transferPlatform('https://pin.it/abc'), 'Pinterest');
  assert.equal(transferPlatform('not a url'), 'Bağlantı');
  assert.equal(parseTransferDate('2026-10-21 10:00:00'), Date.parse('2026-10-21T10:00:00Z'), 'naive API time is UTC');
  assert.equal(parseTransferDate('2026-10-21T10:00:00+03:00'), Date.parse('2026-10-21T07:00:00Z'));
  const now = new Date('2026-10-21T15:00:00Z');
  assert.match(transferWhen('2026-10-21 09:00:00', now), /^Bugün /);
  assert.match(transferWhen('2026-10-20 09:00:00', now), /^Dün /);
  assert.equal(transferWhen(undefined, now), '');
  for (const page of ['src/app/recipe/aktarimlarim/page.tsx', 'src/app/recipe/import/page.tsx']) {
    assert.doesNotMatch(read(page), /Tarif aktarımı #\$\{/, page + ' must not title a transfer by its database id');
  }
});

test('studio copy promises nothing the server does not do', () => {
  const create = read('src/app/recipe/create/page.tsx');
  const edit = read('src/app/recipe/edit/[id]/page.tsx');
  for (const page of [create, edit]) {
    // Core keeps an empty chef tip empty (no generated filler tip).
    assert.doesNotMatch(page, /otomatik oluşturulur/);
    assert.match(page, /<StudioPreview data=\{formData\}/);
    assert.match(page, /moveStep/);
    assert.doesNotMatch(page, /Yeni \$\{category\} ekle/, 'option dialog uses a readable Turkish label');
  }
  assert.doesNotMatch(create, /\|\| \["Türk Mutfağı"\]/, 'no invented taxonomy options');
});

test('link fields commit explicitly so a half-typed address never becomes the photo', () => {
  const parts = read('src/components/recipe-studio/StudioParts.tsx');
  assert.match(parts, /const commit = \(\) =>/);
  assert.match(parts, /youtubeThumbnail\(value\)/);
  const { youtubeThumbnail } = { youtubeThumbnail: (() => {
    const src = parts.slice(parts.indexOf('export function youtubeThumbnail'));
    const fn = ts.transpileModule(src, {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
    const mod = {exports:{}}; Function('module','exports',fn)(mod,mod.exports); return mod.exports.youtubeThumbnail;
  })() };
  assert.equal(youtubeThumbnail('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1'), 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  assert.equal(youtubeThumbnail('https://youtu.be/dQw4w9WgXcQ'), 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  assert.equal(youtubeThumbnail('https://www.youtube.com/shorts/abcdEFGH12'), 'https://img.youtube.com/vi/abcdEFGH12/hqdefault.jpg');
  assert.equal(youtubeThumbnail('https://ornek.com/foto.jpg'), '');
});

test('ready notice stays off transfer pages, Pilot and studio action bars', () => {
  const notice = read('src/components/layout/VideoRecipeReadyNotice.tsx');
  assert.match(notice, /pathname\.startsWith\("\/pilot\/"\)/);
  assert.match(notice, /bottom-24 sm:bottom-5/);
});
