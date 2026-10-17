const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '..', 'src/lib/lokma-emoji.ts'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const shim = {exports:{}};
Function('module','exports',compiled)(shim,shim.exports);
const {lokmaIngredient, LOKMA_RATINGS, LOKMA_REACTIONS} = shim.exports;

test('key Turkish ingredients receive recognizable food icons rather than false guesses', () => {
 const cases = [
  ['100 gr kuru domates','🍅'],['havuç','🥕'],['Parmesan peyniri','🧀'],
  ['1 diş sarımsak','🧄'],['4 yemek kaşığı zeytinyağı','🫒'],
  ['500 gr gnocchi','🍝'],['1 tutam karabiber','🧂'],
  ['taze fesleğen','🌿'],['soğan','🧅'],['kuru fasulye','🫘'],
  ['çilek','🍓'],['yumurta','🥚'],['kabak','🥒'],
 ];
 cases.forEach(([ingredient,emoji])=>assert.equal(lokmaIngredient(ingredient).emoji,emoji,ingredient));
 assert.equal(lokmaIngredient('bilinmeyen gurme malzeme').emoji,'🍽️');
 assert.equal(lokmaIngredient('turp').emoji,'🍽️');
});

test('rating emojis preserve numeric 1-5 API contracts', () => {
 assert.deepEqual(LOKMA_RATINGS.map(x=>x.rating),[1,2,3,4,5]);
 assert.equal(new Set(LOKMA_RATINGS.map(x=>x.emoji)).size,5);
 assert.ok(LOKMA_REACTIONS.length >= 6);
 assert.equal(new Set(LOKMA_REACTIONS.map(x=>x.id)).size,LOKMA_REACTIONS.length);
});

test('food visual identity is integrated without removing the recipe ingredient text or existing rating/comment endpoints', () => {
 const detail=fs.readFileSync(path.join(__dirname,'..','src/components/recipe/RecipeDetailClient.tsx'),'utf8');
 const importPage=fs.readFileSync(path.join(__dirname,'..','src/app/recipe/import/page.tsx'),'utf8');
 assert.match(detail,/LokmaIngredientIcon name=\{item\.name\}/);
 assert.match(detail,/LOKMA_RATINGS\.map/);
 assert.match(detail,/handleRating\(rating\)/);
 assert.match(detail,/LOKMA_REACTIONS\.map/);
 assert.match(detail,/setCommentText\(current =>/);
 assert.match(importPage,/LokmaIngredientIcon name=\{ingredient\.name\}/);
 assert.match(importPage,/Tarif defterin, yeniden/);
 assert.match(importPage,/Tarifimi güzelleştir/);
 assert.match(importPage,/createRecipe\(token, buildApprovedRecipe\(editor\)\)/);
 assert.match(importPage,/!accepted/);
});
