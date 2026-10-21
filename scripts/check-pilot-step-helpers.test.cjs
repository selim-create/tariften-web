const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '..', 'src/lib/pilot-step-helpers.ts'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod = {exports:{}};
Function('module','exports',compiled)(mod,mod.exports);
const {ingredientsInStep, durationsInStep} = mod.exports;

const gnocchi = [
  'Kuru domates (yağda veya yumuşatılmış)', 'Çiğ badem', 'Kırmızı acı biber (chili)',
  'Parmesan peyniri (veya Grana Padano / Pecorino)', 'Tuz', 'Taze çekilmiş karabiber',
  'Zeytinyağı', 'Patates gnocchi', 'Tereyağı', 'Gnocchi haşlama suyu', 'Taze feslegen yaprakları',
];
const steps = [
  'Blender haznesine kuru domatesleri, küçük kırmızı acı biberi, çiğ bademleri, parça parmesan peynirini, tuzu, taze çekilmiş karabiberi ve zeytinyağını ekleyin.',
  'Tüm malzemeleri homojen, hafif pütürlü ve koyu kıvamlı bir kırmızı pesto haline gelene kadar pürüzsüzce çekin.',
  'Tavada tereyağını eritin ve haşlanmış gnocchileri tavaya alarak hafif altın sarısı renk alana kadar soteleyin.',
  'Gnocchilerin üzerine hazırladığınız kırmızı pestodan ekleyin ve gnocchinin haşlama suyundan azar azar tavaya dökün.',
  'Tavayı karıştırarak ve hafifçe sallayarak pestonun nişastalı suyla emülsiyon oluşturup gnocchilerin her tarafını kaplayan kremsi bir sos halini almasını sağlayın.',
  'Gnocchileri servis tabağına aktarın; üzerine taze parmesan rendeleyin ve taze fesleğen yapraklarını ekleyerek servis edin.',
];
const names = idx => idx.map(i => gnocchi[i]);

test('each step lists exactly the ingredients it names', () => {
  assert.deepEqual(names(ingredientsInStep(gnocchi, steps[0])), [
    'Kuru domates (yağda veya yumuşatılmış)', 'Çiğ badem', 'Kırmızı acı biber (chili)',
    'Parmesan peyniri (veya Grana Padano / Pecorino)', 'Tuz', 'Taze çekilmiş karabiber', 'Zeytinyağı',
  ]);
  assert.deepEqual(names(ingredientsInStep(gnocchi, steps[1])), []);
  assert.deepEqual(names(ingredientsInStep(gnocchi, steps[2])), ['Patates gnocchi', 'Tereyağı']);
  assert.deepEqual(names(ingredientsInStep(gnocchi, steps[3])), ['Patates gnocchi', 'Gnocchi haşlama suyu']);
  assert.deepEqual(names(ingredientsInStep(gnocchi, steps[5])), [
    'Parmesan peyniri (veya Grana Padano / Pecorino)', 'Patates gnocchi', 'Taze feslegen yaprakları',
  ]);
});

test('identity-changing heads and lookalike words never match', () => {
  assert.deepEqual(ingredientsInStep(['Gnocchi haşlama suyu'], 'Gnocchileri tavaya alın.'), []);
  assert.deepEqual(ingredientsInStep(['Tuz'], 'Tuzlu tereyağı kullanmayın.'), []);
  assert.deepEqual(ingredientsInStep(['Kırmızı biber'], 'Karabiberi ekleyin.'), []);
  assert.deepEqual(ingredientsInStep(['Un'], 'Unutmadan fırını ısıtın.'), []);
});

test('durations are read from the step text only', () => {
  assert.deepEqual(durationsInStep('Fırında 20 dakika pişirin.'), [20]);
  assert.deepEqual(durationsInStep('8-10 dakika kadar haşlayın.'), [10]);
  assert.deepEqual(durationsInStep('Hamuru 1 saat dinlendirin, sonra 15 dk pişirin.'), [60, 15]);
  assert.deepEqual(durationsInStep('Beş dakika kavurun.'), [5]);
  assert.deepEqual(durationsInStep('On beş dakika demlendirin.'), [15]);
  assert.deepEqual(durationsInStep('Yarım saat bekletin.'), [30]);
  assert.deepEqual(durationsInStep('180 derecede altın rengi olana kadar pişirin.'), []);
  assert.deepEqual(durationsInStep('Tavada tereyağını eritin.'), []);
});
