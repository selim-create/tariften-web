'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('global + prioritizes AI, merges two import methods and leaves pantry in its own tab',()=>{
 const menu=read('src/components/navigation/GlobalCreateMenu.tsx');
 assert.match(menu,/href: "\/recipes\?quick=1"/);
 assert.doesNotMatch(menu,/href: "\/pantry"/);
 assert.match(menu,/href: "\/recipe\/aktar"/);
 assert.ok(menu.indexOf('AI ile Tarif Oluştur') < menu.indexOf('Tarifimi Kendim Yazacağım'));
 assert.deepEqual([...menu.matchAll(/href: "([^"]+)"/g)].map(m=>m[1]), ['/recipes?quick=1','/recipe/aktar','/recipe/create','/menu/create']);
 assert.doesNotMatch(menu,/Yeni tarifin sen yayınladığında|mevcut tarif düzenlemeleri yönetici onayına sunulur/);
});
test('AI recipe search keeps name-ingredient prompt, reads usage quotas only at action and shows short notice',()=>{
 const screen=read('src/app/recipes/page.tsx');
 assert.match(screen,/searchParams\.get\("quick"\) === "1"/);
 assert.match(screen,/setShowPromptModal\(true\)/);
 assert.match(screen,/Bir tarif adı yaz veya elindeki malzemeleri listele/);
 assert.match(screen,/fetchAccountQuotas\(token\)/);
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
test('web quick AI validates rights before billing and ignores repeated taps',()=>{
 const screen=read('src/app/recipes/page.tsx');
 const start=screen.indexOf('const handleGenerateRecipe = async () =>');
 const end=screen.indexOf('const renderFilterGroup =',start);
 assert.ok(start>=0 && end>start);
 const flow=screen.slice(start,end);
 assert.match(flow,/if \(quickCreateInFlightRef\.current \|\| quickPublishInFlightRef\.current/);
 assert.match(flow,/quickCreateInFlightRef\.current = true/);
 assert.match(flow,/await fetchAccountQuotas\(token\)/);
 assert.match(flow,/catch \{\s*showModalMessage\("error", "Kullanım hakların şu anda kontrol edilemiyor/);
 assert.ok(flow.indexOf('await fetchAccountQuotas(token)') < flow.indexOf('await generateRecipeClient(token, searchTerm'));
 assert.match(flow,/finally \{\s*quickCreateInFlightRef\.current = false/);
 assert.doesNotMatch(flow,/fetchAccountQuotas\(token\)\.catch\(\(\) => null\)/);
 assert.doesNotMatch(flow,/setQuery\(aiPromptInput\)/);
 assert.match(flow,/setAiPromptInput\(""\);/);
});
