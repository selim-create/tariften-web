'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function text(p) { return fs.readFileSync(path.join(root, p), 'utf8'); }
function tsModule(p, deps = {}) {
  const result = ts.transpileModule(text(p), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  const sandboxRequire = id => {
    if (id in deps) return deps[id];
    throw new Error('Unexpected imported dependency: ' + id);
  };
  new Function('module', 'exports', 'require', result)(mod, mod.exports, sandboxRequire);
  return mod.exports;
}

const media = tsModule('src/lib/recipe-media.ts');
const route = tsModule('src/app/api/recipes/image/upload/route.ts', {
  'next/server': { NextResponse: { json: (payload, props) => ({ payload, status: props.status, headers: props.headers }) } },
  '@/lib/recipe-media': media,
});

function request(file, opts = {}) {
  const headers = new Headers({
    authorization: opts.authorization === false ? '' : 'Bearer good.jwt',
    'content-type': 'multipart/form-data; boundary=testing',
    ...(opts.headers || {}),
  });
  return {
    headers,
    async formData() {
      const formData = new FormData();
      if (file) formData.append('file', file);
      return formData;
    },
  };
}
function png(name = 'Çiğ börek, şefin tarifi.png') {
  return new File([new Uint8Array([137, 80, 78, 71])], name, { type: 'image/png' });
}

test('safe recipe filename converts Turkish letters and whitespace without changing extension', () => {
  assert.equal(media.safeRecipeImageFilename('Çiğ börek, şefin tarifi.png', 'image/png'), 'cig-borek-sefin-tarifi.png');
  assert.equal(media.safeRecipeImageFilename('Iğdır’ın mücveri 2026.jpg', 'image/jpeg'), 'igdir-in-mucveri-2026.jpg');
  assert.equal(media.safeRecipeImageFilename('😋💖.webp', 'image/webp'), 'tarif-gorseli.webp');
  const attempt = media.safeRecipeImageFilename('a\\\\b \"x\" \\r\\n.jpg', 'image/jpeg');
  assert.match(attempt, /^[a-z0-9-]+\.jpg$/);
  assert.doesNotMatch(attempt, /[\r\n\x80-\uffff]/);
});

test('rejects unsupported file types and files over 8MB before sending a request', () => {
  assert.match(media.validateRecipeImage({ size: 400, type: 'image/svg+xml' }), /JPG/);
  assert.match(media.validateRecipeImage({ size: 9 * 1024 * 1024, type: 'image/png' }), /8 MB/);
  assert.equal(media.validateRecipeImage({ size: 10000, type: 'image/webp' }), null);
});

test('proxy forwards valid Turkish-named file as multipart with ASCII filename and user JWT', async () => {
  const before = global.fetch;
  let recorded;
  try {
    global.fetch = async (url, opts) => {
      recorded = { url, opts };
      return new Response(JSON.stringify({
        success: true, id: 1877, url: 'https://api.tariften.com/wp-content/uploads/cig-borek.png',
      }), { status: 201, headers: { 'content-type': 'application/json' } });
    };
    const result = await route.POST(request(png()));
    assert.equal(result.status, 201);
    assert.equal(result.payload.id, 1877);
    assert.equal(result.payload.success, true);
    assert.match(recorded.url, /\/tariften\/v1\/recipes\/image\/upload$/);
    assert.equal(recorded.opts.headers.Authorization, 'Bearer good.jwt');
    assert.equal(recorded.opts.headers['Content-Disposition'], undefined, 'no raw Unicode header');
    assert.equal(recorded.opts.headers['Content-Type'], undefined, 'multipart boundary set automatically');
    assert.equal(recorded.opts.body.get('file').name, 'cig-borek-sefin-tarifi.png');
    assert.match(result.headers['Cache-Control'], /no-store/);
  } finally {
    global.fetch = before;
  }
});

test('missing JWT and invalid image cannot trigger Core upload', async () => {
  const before = global.fetch;
  let calls = 0;
  try {
    global.fetch = async () => { calls++; throw Error('Must not call'); };
    const unauthorized = await route.POST(request(png(), { authorization: false }));
    assert.equal(unauthorized.status, 401);
    const invalid = await route.POST(request(new File(['<svg/>'], 'foto.svg', { type: 'image/svg+xml' })));
    assert.equal(invalid.status, 415);
    assert.equal(calls, 0);
  } finally {
    global.fetch = before;
  }
});

test('missing Core deployment and denied upstream privileges are explained instead of generic upload failure', async () => {
  const before = global.fetch;
  try {
    global.fetch = async () => new Response(JSON.stringify({ code: 'rest_no_route' }), { status: 404 });
    const missing = await route.POST(request(png()));
    assert.equal(missing.status, 503);
    assert.match(missing.payload.message, /Core güncellemesi/);
    global.fetch = async () => new Response(JSON.stringify({ code: 'forbidden' }), { status: 403 });
    const denied = await route.POST(request(png()));
    assert.equal(denied.status, 403);
    assert.match(denied.payload.message, /tekrar giriş/);
  } finally {
    global.fetch = before;
  }
});

test('recipe screens never invoke old Unicode Content-Disposition Server Action or lose existing image on error', () => {
  const api = text('src/lib/api.ts');
  const edit = text('src/app/recipe/edit/[id]/page.tsx');
  const create = text('src/app/recipe/create/page.tsx');
  const client = text('src/lib/recipe-media-upload.ts');
  assert.doesNotMatch(api, /Content-Disposition.*file\.name/);
  assert.doesNotMatch(api, /export async function uploadMedia/);
  for (const screen of [edit, create]) {
    assert.match(screen, /uploadRecipeImage\(user\.token, file\)/);
    assert.match(screen, /showError\(result\.message\)/);
    assert.match(screen, /setPreviewUrl\(previousPreview\)/);
    assert.match(screen, /e\.currentTarget\.value = ""/);
  }
  assert.match(client, /fetch\("\/api\/recipes\/image\/upload"/);
  assert.doesNotMatch(client, /console\.error/);
});
