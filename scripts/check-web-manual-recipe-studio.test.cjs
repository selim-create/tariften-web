'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const helpers = read('src/lib/manual-recipe-validation.ts');
const js = ts.transpileModule(helpers, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const local = { exports: {} };
const measureSource = read('src/lib/recipe-measurements.ts');
const measureJs = ts.transpileModule(measureSource,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const measures = {exports:{}};
new Function('module','exports',measureJs)(measures,measures.exports);
new Function('module','exports','require',js)(local,local.exports,id => {
 assert.equal(id,'./recipe-measurements');
 return measures.exports;
});
const { validateManualRecipeStage } = local.exports;
const good = () => ({ title:'Çıtır sebze yemeği', servings:'4', prep_time:'15', cook_time:'30', calories:'250', ingredients:[{name:'Domates', amount:'2', unit:'adet'}],steps:['Domatesleri iyice yıka.'] });

test('manual editor accepts complete drafts, without calling AI or inventing amounts', () => {
  const draft = good();
  assert.equal(validateManualRecipeStage(draft),null);
  assert.equal(validateManualRecipeStage({...draft, ingredients:[{name:'Domates',amount:'',unit:''}]}),null);
  assert.equal(validateManualRecipeStage({...draft, prep_time:'',cook_time:'',calories:''}),null);
  assert.doesNotMatch(helpers, /fetch\(|generateAIRecipe|openai|llm/i);
});

test('first step requires title and a real servings value, matching mobile', () => {
  const base = good();
  for(const bad of ['', '0','37','1.5','-2','1e2','abc']) {
    const result = validateManualRecipeStage({...base, servings:bad});
    assert.equal(result?.stage,1,`Invalid servings: ${bad}`);
  }
  assert.equal(validateManualRecipeStage({...base,title:'  '})?.stage,1);
  assert.equal(validateManualRecipeStage({...base,title:'x'.repeat(181)})?.stage,1);
  for(const key of ['prep_time','cook_time','calories']){
    for(const value of ['-1','2.5','99999']){ assert.equal(validateManualRecipeStage({...base,[key]:value})?.stage,1); }
  }
  assert.equal(validateManualRecipeStage({...base,servings:'36'},1),null);
});

test('ingredient and preparation stages cannot be skipped with empty rows', () => {
  const base = good();
  assert.equal(validateManualRecipeStage({...base, ingredients:[]},2)?.stage,2);
  assert.equal(validateManualRecipeStage({...base, ingredients:[{name:' ',amount:'2',unit:'adet'}]},2)?.stage,2);
  assert.equal(validateManualRecipeStage({...base, ingredients:new Array(41).fill(base.ingredients[0])},2)?.stage,2);
  assert.equal(validateManualRecipeStage({...base, steps:['']},2),null);
  assert.equal(validateManualRecipeStage({...base, steps:['']},3)?.stage,3);
  assert.equal(validateManualRecipeStage({...base, steps:new Array(41).fill('Karıştır.')},3)?.stage,3);
});

test('manual web UI is premium, accessible, quota fail-closed and single-flight', () => {
  const page = read('src/app/recipe/create/page.tsx');
  assert.match(page,/TARİFTEN · MUTFAK STÜDYOSU/);
  assert.match(page,/\/recipes\?quick=1/);
  assert.match(page,/\/recipe\/import/);
  assert.match(page,/aria-label="Tarif oluşturma adımları"/);
  assert.match(page,/RecipeIngredientRow/);
  assert.match(read('src/components/recipes/RecipeIngredientRow.tsx'),/aria-label=\{\`\$\{index \+ 1\}\. malzemenin adı\`\}/);
  assert.match(page,/role="alert"/);
  assert.match(page,/const goNext = \(\) => \{/);
  assert.match(page,/validateManualRecipeStage\(formData, step as ManualRecipeStage\)/);
  assert.match(page,/validateManualRecipeStage\(formData\)/);
  assert.match(page,/if \(saveInFlightRef\.current \|\| loading \|\| mediaUploading\) return/);
  assert.match(page,/saveInFlightRef\.current = true/);
  assert.match(page,/saveInFlightRef\.current = false/);
  assert.match(page,/try \{\s*fresh = await fetchAccountQuotas\(user\.token\);\s*\} catch \{\s*setFormError/);
  assert.ok(page.indexOf('await fetchAccountQuotas(user.token)') < page.indexOf('await createRecipe(user.token, formData)'));
  assert.match(page,/Tarifin yayımlanmış olabilir/);
  assert.match(page,/image\/jpeg,image\/png,image\/webp/);
  assert.doesNotMatch(page,/<QuotaPanel|<CompactQuota|fetchAccountQuotas\(user\.token\)\.catch\(\(\) => null\)/);
  assert.doesNotMatch(page,/generateAIRecipe\(/);
});
