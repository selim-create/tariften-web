const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const load = file => {
  const out = ts.transpileModule(read(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  Function('module', 'exports', 'require', out)(mod, mod.exports, () => { throw Error('unexpected_import'); });
  return mod.exports;
};
const links = load('src/lib/app-links.ts');
const FP = Array.from({ length: 32 }, (_, i) => (i + 16).toString(16).toUpperCase()).join(':');

test('AASA claims only /rehber for com.tariften.app and needs a valid Team ID', () => {
  assert.equal(links.appleAppSiteAssociation(undefined), null);
  assert.equal(links.appleAppSiteAssociation('bad'), null);
  const aasa = links.appleAppSiteAssociation(' abcde12345 ');
  const detail = aasa.applinks.details[0];
  assert.deepEqual(detail.appIDs, ['ABCDE12345.com.tariften.app']);
  assert.deepEqual(detail.components.map(c => c['/']), ['/rehber', '/rehber/*']);
});

test('assetlinks lists valid fingerprints only', () => {
  assert.equal(links.androidAssetLinks(''), null);
  assert.equal(links.androidAssetLinks('nope'), null);
  const al = links.androidAssetLinks(`${FP.toLowerCase()}, junk`);
  assert.equal(al[0].target.package_name, 'com.tariften.app');
  assert.deepEqual(al[0].target.sha256_cert_fingerprints, [FP]);
  assert.deepEqual(al[0].relation, ['delegate_permission/common.handle_all_urls']);
});

test('routes are served under /.well-known with JSON and 404 when unset', () => {
  for (const file of [
    'src/app/.well-known/apple-app-site-association/route.ts',
    'src/app/.well-known/assetlinks.json/route.ts',
  ]) {
    const src = read(file);
    assert.match(src, /export function GET/);
    assert.match(src, /status: 404/);
    assert.match(src, /application\/json/);
  }
});

test('middleware does not redirect /.well-known', () => {
  const mw = read('src/middleware.ts');
  const matcher = mw.match(/matcher:\s*\[([\s\S]*?)\]/);
  assert.ok(matcher, 'matcher present');
  // Protected routes only touch account areas; .well-known is never one of them.
  assert.doesNotMatch(mw, /well-known/);
});
