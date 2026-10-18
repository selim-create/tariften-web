'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('global + prioritizes quick AI and cupboard options without legal or quota copy',()=>{
 const menu=read('src/components/navigation/GlobalCreateMenu.tsx');
 assert.match(menu,/href: "\/recipes\?quick=1"/);
 assert.match(menu,/href: "\/pantry"/);
 assert.ok(menu.indexOf('Hızlı tarif oluştur') < menu.indexOf('Tarifini kendin yaz'));
 assert.doesNotMatch(menu,/Yeni tarifin sen yayınladığında|mevcut tarif düzenlemeleri yönetici onayına sunulur/);
});
test('AI recipe search keeps name-ingredient prompt, reads usage quotas only at action and shows short notice',()=>{
 const screen=read('src/app/recipes/page.tsx');
 assert.match(screen,/searchParams\.get\("quick"\) === "1"/);
 assert.match(screen,/setShowPromptModal\(true\)/);
 assert.match(screen,/Bir tarif adı yaz veya elindeki malzemeleri listele/);
 assert.match(screen,/fetchAccountQuotas\(user\.token\)/);
 assert.match(screen,/setUsageNotice\(/);
 assert.doesNotMatch(screen,/<QuotaPanel/);
});
test('profile retains account rights, creation pages avoid persistent rights panels',()=>{
 const profile=read('src/app/profile/page.tsx');
 assert.match(profile,/<QuotaPanel/);
 for(const p of ['src/app/recipe/create/page.tsx','src/app/menu/create/page.tsx','src/app/recipe/import/page.tsx']){
  assert.doesNotMatch(read(p),/<QuotaPanel|<CompactQuota/);
 }
 const lib=read('src/lib/recipe-text-import.ts');
 assert.match(lib,/calories_per_serving/);
 assert.match(lib,/meal_type: \[editor\.mealType\.trim\(\)\]/);
 const imp=read('src/app/recipe/import/page.tsx');
 for(const label of ['Kişi başına tahmini kalori','Tarifin mutfağı','Tarifin öğün tipi'])assert.ok(imp.includes(label));
 assert.match(imp,/setUsageNotice/);
});