'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const read = p => fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const lib = read('src/lib/recipe-measurements.ts');
const compiled = ts.transpileModule(lib,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};
new Function('module','exports',compiled)(mod,mod.exports);
const {validateRecipeAmount,validateRecipeUnit,canTypeRecipeAmount}=mod.exports;
test('existing 1877-like recipe ingredients remain editable without rewriting saved quantities',()=>{
 const rows=[
  {name:'soğan',amount:'1',unit:'orta boy'},
  {name:'domates',amount:'bir',unit:'adet'},
  {name:'tuz',amount:'2',unit:'kaşık'},
  {name:'karabiber',amount:'',unit:'çay kaşığı'},
  {name:'kırmızı toz biber',amount:'',unit:'çay kaşığı'},
  {name:'limon suyu',amount:'yarım',unit:'adet'},
  {name:'şeker',amount:'bir',unit:'çay kaşığı'},
  {name:'zeytinyağı',amount:'Yarım',unit:'su bardağı'},
  {name:'fasulye',amount:'1',unit:'kilo'}
 ];
 for(const row of rows){
   assert.equal(validateRecipeAmount(row.amount),null,row.name+' '+row.amount);
   assert.equal(validateRecipeUnit(row.unit),null,row.name+' '+row.unit);
 }
 assert.equal(validateRecipeAmount(''),null,'quantity is optional');
 assert.equal(validateRecipeUnit(''),null,'unit is optional, e.g. half a lemon');
});
test('progressively typed semantic amounts are accepted, arbitrary text rejected',()=>{
 for(const value of ['b','bi','bir','Y','Ya','Yar','Yarım','çeyrek','1','1,','1,5','1/2','2-3'])
  assert.equal(canTypeRecipeAmount(value),true,value);
 for(const value of ['domatas','xyz','orta boy','1abc','limon'])
  assert.equal(canTypeRecipeAmount(value),false,value);
 for(const value of ['abc','10001','0','0/2','5-2','1..2'])
  assert.ok(validateRecipeAmount(value),value);
});
test('nonowners cannot see or submit the Web edit form, even though recipe search is public',()=>{
 const page=read('src/app/recipe/edit/[id]/page.tsx');
 assert.match(page,/await getRecipeEditReviewStatus\(token, recipeId\)/);
 assert.match(page,/setAuthorizedToken\(token\)/);
 assert.match(page,/setPermissionError\(/);
 assert.match(page,/permissionError \|\| !authorizedToken \|\| authorizedToken !== user\?\.token/);
 assert.match(page,/!authorizedToken \|\| authorizedToken !== user\?\.token/);
 assert.ok(page.indexOf('await getRecipeEditReviewStatus(token, recipeId)') < page.indexOf('await getRecipeById(recipeId)'));
 assert.match(page,/permissionError \|\| !authorizedToken/);
 assert.match(page,/Yalnızca kendi tariflerini düzenleyebilirsin/);
 const row=read('src/components/recipes/RecipeIngredientRow.tsx');
 for(const name of ['Malzeme','Miktar','Birim \/ boyut'])
   assert.ok(row.includes(name),name);
 assert.match(row,/sm:items-end/);
 assert.match(read('src/app/recipe/create/page.tsx'),/RecipeIngredientRow/);
 assert.match(page,/RecipeIngredientRow/);
});
