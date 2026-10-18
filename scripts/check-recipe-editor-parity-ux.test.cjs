'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const read = p => fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const source = read('src/lib/recipe-measurements.ts');
const code = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};
new Function('module','exports',code)(mod,mod.exports);
const {validateRecipeAmount, validateRecipeUnit, RECIPE_UNITS}=mod.exports;
test('reasonable Turkish amounts allow decimals, simple ranges and fractions without invented quantities',()=>{
 for(const value of ['', '2', '1,5', '0.5', '1/2', '2-3', 'yarım','çeyrek'])
   assert.equal(validateRecipeAmount(value),null,value);
 for(const value of ['domatas','xyz','abc123','1 litre','-2','0','10001','3/0','5-2','1..2','a5'])
   assert.ok(validateRecipeAmount(value),'should reject '+value);
});
test('selectable units include legacy Turkish measurement labels and block garbage',()=>{
 for(const value of ['', 'kg', 'kilo','su bardağı','yemek kaşığı','adet'])
   assert.equal(validateRecipeUnit(value),null,value);
 for(const value of ['abc','unuttum', '123','kilokiloo'])
   assert.ok(validateRecipeUnit(value),'should reject '+value);
 assert.ok(RECIPE_UNITS.length>15);
});
test('manual create and edit are visually and behaviorally aligned',()=>{
 const create=read('src/app/recipe/create/page.tsx');
 const edit=read('src/app/recipe/edit/[id]/page.tsx');
 const picker=read('src/components/recipes/RecipeSelect.tsx');
 assert.match(picker,/RecipePicker|RecipeSelect/);
 const row=read('src/components/recipes/RecipeIngredientRow.tsx');
 assert.match(create,/RecipeIngredientRow/);
 assert.match(edit,/RecipeIngredientRow/);
 assert.match(row,/RECIPE_UNITS/);
 assert.match(row,/sm:items-end/);
 assert.match(create,/validateManual/);
 assert.match(edit,/validateManual/);
 
 for(const marker of ['TARİFTEN · MUTFAK STÜDYOSU','<RecipeSelect','scrollIntoView','editorTopRef','goNext','formError']){
   assert.ok(create.includes(marker),'Create missing '+marker);
   assert.ok(edit.includes(marker),'Edit missing '+marker);
 }
 assert.doesNotMatch(create,/<select\b/i);
 assert.doesNotMatch(edit,/<select\b/i);
 assert.match(edit,/Yönetici onayına gönder/);
 assert.match(edit,/reviewStatus\?\.status === 'pending'/);
 
 const preview=read('src/components/recipes/QuickRecipeReview.tsx');
 assert.match(preview,/RECIPE_UNITS/);
 assert.match(preview,/RecipePicker|RecipeSelect/);
});
