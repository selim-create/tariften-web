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
  ['domatas','🍅'],['domatez','🍅'],['domatesi','🍅'],['brokoli','🥦'],
  ['zeytin yagı','🫒'],['tereyagi','🧈'],['sogan','🧅'],['sarımsak','🧄'],
 ];
 cases.forEach(([ingredient,emoji])=>assert.equal(lokmaIngredient(ingredient).emoji,emoji,ingredient));
 assert.equal(lokmaIngredient('bilinmeyen gurme malzeme').emoji,'🍽️');
 const newArtCases = [
   ['turp', 'radish'], ['pırasa', 'leek'], ['kereviz', 'celery'], ['pancar', 'beet'],
   ['karnabahar', 'cauliflower'], ['enginar', 'artichoke'], ['bal kabağı', 'pumpkin'],
   ['kuşkonmaz', 'asparagus'], ['bamya', 'okra'], ['kabak', 'zucchini'],
   ['bezelye', 'pea'], ['taze fasulye', 'greenbean'],
   ['yoğurt', 'yogurt'], ['ayçiçek yağı', 'oil'],
   ['un', 'flour'], ['kabartma tozu', 'baking'], ['susam', 'sesame'],
   ['tahin', 'sauce'], ['domates salçası', 'paste'],
 ];
 newArtCases.forEach(([ingredient,art])=>assert.equal(lokmaIngredient(ingredient).art,art,ingredient));
 assert.equal(lokmaIngredient('domates').art,undefined,'standard art stays mapped by emoji');
 assert.equal(lokmaIngredient('bilinmeyen gurme malzeme').art,undefined);
});

test('visual gallery showcases all 68 exact SVG figures with stable names and category filters', () => {
  const items = shim.exports.LOKMA_ICON_SAMPLES;
  assert.equal(items.length, 68);
  assert.equal(new Set(items.map(item => item.figure)).size, 68);
  const icon = fs.readFileSync(path.join(__dirname, '..', 'src/components/lokma/LokmaIngredientIcon.tsx'), 'utf8');
  const gallery = fs.readFileSync(path.join(__dirname, '..', 'src/app/lokma/ikonlar/page.tsx'), 'utf8');
  items.forEach(item => {
    assert.ok(icon.includes(`figure === "${item.figure}"`), `Unknown SVG illustration ${item.figure}`);
    assert.ok(item.name && item.category, 'Catalog entry must have an accessible name and category');
  });
  assert.match(icon, /previewFigure \|\|/);
  assert.match(gallery, /LOKMA_ICON_SAMPLES\.filter/);
  assert.match(gallery, /previewFigure=\{item\.figure\}/);
  assert.match(gallery, /aria-pressed=\{category === item\}/);
  assert.match(gallery, /navigator\.clipboard\.writeText/);
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
 assert.match(importPage,/Tarifin, en güzel hâline geliyor/);
 assert.match(importPage,/Tarifimi güzelleştir/);
 assert.match(importPage,/createRecipe\(token, buildApprovedRecipe\(editor\)\)/);
 assert.match(importPage,/!accepted/);
});

test('ingredient illustrations are compact vector art and never render native food emojis', () => {
  const icon = fs.readFileSync(path.join(__dirname, '..', 'src/components/lokma/LokmaIngredientIcon.tsx'), 'utf8');
  const recipe = fs.readFileSync(path.join(__dirname, '..', 'src/components/recipe/RecipeDetailClient.tsx'), 'utf8');
  assert.match(icon, /<svg viewBox="0 0 40 40"/);
  assert.match(icon, /ingredient\.art \|\| FIGURES\[ingredient\.emoji\]/);
  assert.match(icon, /figure === "tomato"/);
  assert.match(icon, /figure === "carrot"/);
  for (const art of ['broccoli','eggplant','mushroom','cucumber','greens','chicken','meat','shrimp','butter','rice','strawberry','orange','apple','banana','nut','honey','chocolate','sugar']) {
    assert.ok(icon.includes(`figure === "${art}"`), `Missing illustration: ${art}`);
  }
  for (const art of ['cherry','berry','pear','grape','watermelon','peach','kiwi','pineapple','avocado','corn','coffee','tea','liquid','leek','celery','cauliflower','artichoke','radish','beet','pumpkin','asparagus','okra','zucchini','pea','greenbean','yogurt','oil','flour','baking','sesame','sauce','paste']) {
    assert.ok(icon.includes(`figure === "${art}"`), `Missing curated miniature: ${art}`);
  }
  assert.match(icon, /figure === "plate"/);
  assert.match(icon, /h-5 w-5/);
  assert.doesNotMatch(icon, /\{ingredient\.emoji\}/);
  assert.match(recipe, /size="sm"/);
});

test('ingredient display uses Turkish casing and never displays NaN for unspecified amounts', () => {
  const file = fs.readFileSync(path.join(__dirname, '..', 'src/lib/ingredient-display.ts'), 'utf8');
  const compiled = ts.transpileModule(file, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod = {exports:{}};
  Function('module','exports',compiled)(mod,mod.exports);
  const {capitalizeIngredientTr,formatIngredientAmount} = mod.exports;
  assert.equal(capitalizeIngredientTr('domates'), 'Domates');
  assert.equal(capitalizeIngredientTr('ıspanak'), 'Ispanak');
  assert.equal(capitalizeIngredientTr('iç bakla'), 'İç bakla');
  assert.equal(formatIngredientAmount(null, '', 2, 4), '');
  assert.equal(formatIngredientAmount(undefined, 'gr', 2, 4), 'gr');
  assert.equal(formatIngredientAmount('NaN', '', 2, 4), '');
  assert.equal(formatIngredientAmount('100', 'gr', 2, 4), '200 gr');
  assert.equal(formatIngredientAmount('1/2', 'su bardağı', 2, 4), '1/2 su bardağı');
  assert.equal(formatIngredientAmount('2', 'diş', 0, 4), '2 diş');
  assert.equal(formatIngredientAmount('2', 'diş', 2, 4), '4 diş');
});
