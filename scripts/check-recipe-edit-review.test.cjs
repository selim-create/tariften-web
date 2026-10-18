'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('recipe edit review uses JWT-only owner status endpoint', () => {
  const api = read('src/lib/api.ts');
  assert.match(api, /export async function getRecipeEditReviewStatus/);
  assert.match(api, /tariften\/v1\/recipes\/edit-review\/\$\{id\}/);
  assert.match(api, /Authorization: `Bearer \$\{token\}`/);
  assert.match(api, /cache: 'no-store'/);
  assert.match(api, /\['none', 'pending', 'approved', 'rejected'\]/);
});
test('editor explains pending approvals and never claims that the unchanged published page was updated', () => {
  const page = read('src/app/recipe/edit/[id]/page.tsx');
  assert.match(page, /result\.pending_review \|\| result\.status === "pending_review"/);
  assert.match(page, /Değişikliklerin yönetici onayına gönderildi/);
  assert.match(page, /Yayındaki tarifin eski hâli korunuyor/);
  assert.match(page, /reviewStatus\?\.status === 'rejected'/);
  assert.match(page, /reviewStatus\.note/);
  assert.match(page, /reviewStatus\?\.status === 'approved'/);
  assert.match(page, /disabled=\{saving \|\| reviewStatus\?\.status === 'pending'\}/);
  assert.match(page, /Yönetici onayına gönder/);
  assert.doesNotMatch(page, /Tarif başarıyla güncellendi! 🎉/);
});
test('Web recipe update stays on authenticated Core route; no fake moderation client flag', () => {
  const api = read('src/lib/api.ts');
  const page = read('src/app/recipe/edit/[id]/page.tsx');
  assert.match(api, /tariften\/v1\/recipes\/update/);
  assert.match(page, /updateRecipe\(user\.token, dataToSend\)/);
  assert.doesNotMatch(page, /auto_approve|is_ai\s*:/);
});
