'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('quick AI generation no longer uses opaque RSC server actions or blinking automatic modal', () => {
  const screen = read('src/app/recipes/page.tsx');
  const client = read('src/lib/recipe-write-client.ts');
  const route = read('src/app/api/recipes/write/route.ts');
  assert.match(screen,/await generateRecipeClient\(token, searchTerm(?:, household)?\)/);
  assert.match(screen,/await createRecipeClient\(token, payload\)/);
  assert.doesNotMatch(screen,/setShowAIModal|showAIModal|<AICard/);
  assert.match(screen,/function RecipeAICard\(/);
  assert.doesNotMatch(screen,/newRecipes\.length === 0 && query\.trim\(\) !==/);
  assert.match(screen,/setShowPromptModal\(true\)/);
  assert.match(client,/fetch\("\/api\/recipes\/write"/);
  assert.match(route,/generate:\s*"\/ai\/generate"/);
  assert.match(route,/create:\s*"\/recipes\/create"/);
  assert.match(route,/update:\s*"\/recipes\/update"/);
  assert.match(route,/AbortSignal\.timeout\(kind === "generate" \? 110000 : 30000\)/);
  assert.match(route,/cache: "no-store"/);
  assert.doesNotMatch(screen,/backdrop-blur-md|animate-fade-in/);
});

test('edit submit routes to published recipe for both pending approval and direct update', () => {
  const edit = read('src/app/recipe/edit/[id]/page.tsx');
  assert.match(edit,/await updateRecipeClient\(user\.token, dataToSend\)/);
  assert.match(edit,/router\.replace\(target \+ \(result\.pending_review/);
  assert.match(edit,/edit_review=submitted/);
  assert.match(edit,/edit_review=updated/);
  assert.doesNotMatch(edit,/showSuccess\(/);
  assert.match(edit,/setNotice\(msg\)/);
  const banner = read('src/components/recipe/RecipeReviewNotice.tsx');
  assert.ok(banner.includes('window.setTimeout(() => setToast(""), 4500)'));
  assert.match(banner,/window\.history\.replaceState/);
  assert.match(banner,/review\?\.status === "rejected"/);
  assert.match(banner,/Yönetici notu:/);
  assert.match(banner,/review\?\.status === "pending"/);
  assert.match(banner,/getRecipeReviewStatusClient\(token, recipeId\)/);
  assert.match(read('src/components/recipe/RecipeDetailView.tsx'),/<RecipeReviewNotice/);
});

test('only owners see edit CTA and Core review note proxy requires valid JWT', () => {
  const editBtn = read('src/components/recipe/EditButton.tsx');
  assert.match(editBtn,/Number\(user\.id\) !== Number\(authorId\)/);
  const route = read('src/app/api/recipes/review-status/[id]/route.ts');
  assert.match(route,/Bearer/);
  assert.match(route,/\/recipes\/edit-review\/\$\{id\}/);
  assert.match(route,/Cache-Control/);
  assert.match(route,/cache: "no-store"/);
  assert.match(route,/if \(!upstream\.ok\)/);
});
