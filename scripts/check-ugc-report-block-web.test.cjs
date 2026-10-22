'use strict';
/* Report content and block members (Core 1.0.67, App Store 1.2 UGC).
 * Offline: src/lib/ugc-safety.ts is transpiled and run against a fake fetch;
 * the UI wiring is checked from source. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const transpile = file => ts.transpileModule(read(file), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function load(file) {
  const mod = { exports: {} };
  Function('module', 'exports', 'require', transpile(file))(mod, mod.exports, name => { throw Error(`unexpected_import ${name}`); });
  return mod.exports;
}

/** Replaces global fetch; records every call and answers from a queue. */
function fakeFetch(...answers) {
  const calls = [];
  const original = global.fetch;
  global.fetch = async (url, init = {}) => {
    calls.push({ url, init, body: init.body === undefined ? undefined : JSON.parse(init.body) });
    const next = answers.length > 1 ? answers.shift() : answers[0];
    const { status = 200, body = { success: true } } = next || {};
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
  return { calls, restore: () => { global.fetch = original; } };
}

const ugc = load('src/lib/ugc-safety.ts');

/* ---------------------------------------------------------------- reasons */

test('reasons: contract keys, order and Turkish labels', () => {
  assert.deepEqual(ugc.REPORT_REASONS.map(r => [r.key, r.label]), [
    ['spam', 'Spam veya reklam'],
    ['offensive', 'Hakaret veya taciz'],
    ['hate', 'Nefret söylemi'],
    ['sexual', 'Cinsel içerik'],
    ['violence', 'Şiddet'],
    ['dangerous', 'Tehlikeli veya sağlığa zararlı'],
    ['copyright', 'Telif hakkı ihlali'],
    ['misinformation', 'Yanlış veya yanıltıcı bilgi'],
    ['other', 'Diğer'],
  ]);
  assert.deepEqual([...ugc.REPORT_TARGET_TYPES], ['recipe', 'comment', 'user']);
  assert.equal(ugc.REPORT_DETAILS_MAX, 1000);
  assert.equal(ugc.REPORT_OTHER_MIN, 10);
});

test('details: optional, ≤1000 chars, ≥10 chars (trimmed, Turkish letters count once) for "Diğer"', () => {
  assert.equal(ugc.reportDetailsError('spam', ''), null);
  assert.match(ugc.reportDetailsError('other', ''), /en az 10 karakter/);
  assert.match(ugc.reportDetailsError('other', '   kısa    '), /en az 10 karakter/);
  assert.equal(ugc.reportDetailsError('other', 'ğüşıöçĞÜŞİ'), null, '10 Turkish letters are 10 characters');
  assert.equal(ugc.reportDetailsError('spam', 'a'.repeat(1000)), null);
  assert.match(ugc.reportDetailsError('spam', 'a'.repeat(1001)), /1\.000 karakter/);
  assert.match(ugc.reportDetailsError('nope', ''), /neden/);
});

/* -------------------------------------------------------------- transport */

test('report: POST same-origin no-store route with bearer and the contract body', async () => {
  const msg = 'Bildirimin alındı. Ekibimiz en geç 24 saat içinde inceleyecek.';
  const f = fakeFetch({ status: 201, body: { success: true, reference: 991, already_reported: false, message: msg } });
  try {
    const result = await ugc.submitReport('jwt', { targetType: 'comment', targetId: 42, reason: 'spam', details: '  Reklam linki  ' });
    assert.deepEqual(result, { reference: 991, alreadyReported: false, message: msg });
    assert.equal(f.calls[0].url, '/api/account/reports');
    assert.equal(f.calls[0].init.method, 'POST');
    assert.equal(f.calls[0].init.cache, 'no-store');
    assert.equal(f.calls[0].init.next, undefined, 'never ISR');
    assert.equal(f.calls[0].init.headers.Authorization, 'Bearer jwt');
    assert.equal(f.calls[0].init.headers['Content-Type'], 'application/json');
    assert.deepEqual(f.calls[0].body, { target_type: 'comment', target_id: 42, reason: 'spam', details: 'Reklam linki' });
  } finally { f.restore(); }
});

test('report: no details key when empty; 200 already_reported shows Core message', async () => {
  const f = fakeFetch({ body: { success: true, reference: 5, already_reported: true, message: 'Bu içeriği zaten bildirdin.' } });
  try {
    const result = await ugc.submitReport('jwt', { targetType: 'recipe', targetId: 7, reason: 'hate', details: '   ' });
    assert.equal(result.alreadyReported, true);
    assert.equal(result.message, 'Bu içeriği zaten bildirdin.');
    assert.deepEqual(f.calls[0].body, { target_type: 'recipe', target_id: 7, reason: 'hate' });
  } finally { f.restore(); }
});

test('report: invalid input never reaches the network', async () => {
  const f = fakeFetch({ body: { success: true } });
  try {
    await assert.rejects(ugc.submitReport('jwt', { targetType: 'recipe', targetId: 7, reason: 'other', details: 'kısa' }), /en az 10/);
    await assert.rejects(ugc.submitReport('jwt', { targetType: 'menu', targetId: 7, reason: 'spam' }), e => e.code === 'report_invalid');
    await assert.rejects(ugc.submitReport('jwt', { targetType: 'recipe', targetId: 0, reason: 'spam' }), e => e.code === 'report_invalid');
    await assert.rejects(ugc.submitReport('', { targetType: 'recipe', targetId: 7, reason: 'spam' }), e => e.status === 401);
    assert.equal(f.calls.length, 0);
  } finally { f.restore(); }
});

test('report errors: 404, 422, 429 retry_after and 400 become calm Turkish messages', async () => {
  const cases = [
    [{ status: 404, body: { code: 'report_target_not_found', message: 'x', data: { status: 404 } } }, 404, /artık yayında değil/],
    [{ status: 422, body: { code: 'report_self', message: 'x', data: { status: 422 } } }, 422, /Kendi içeriğini/],
    [{ status: 429, body: { code: 'report_rate_limited', message: 'x', data: { status: 429, retry_after: 3600 } } }, 429, /1 saat sonra tekrar dene/],
    [{ status: 429, body: { code: 'report_rate_limited', retry_after: 90 } }, 429, /2 dakika sonra/],
    [{ status: 400, body: { code: 'report_invalid', message: 'Geçersiz neden.' } }, 400, /Geçersiz neden\./],
    [{ status: 401, body: { code: 'rest_not_logged_in' } }, 401, /yeniden giriş/i],
  ];
  for (const [answer, status, pattern] of cases) {
    const f = fakeFetch(answer);
    try {
      await assert.rejects(ugc.submitReport('jwt', { targetType: 'recipe', targetId: 7, reason: 'spam' }), e => {
        assert.equal(e.status, status);
        assert.match(e.message, pattern);
        return true;
      });
    } finally { f.restore(); }
  }
  const f = fakeFetch({ status: 429, body: { code: 'report_rate_limited', data: { retry_after: 3600 } } });
  try {
    await assert.rejects(ugc.submitReport('jwt', { targetType: 'user', targetId: 9, reason: 'spam' }), e => e.retryAfter === 3600);
  } finally { f.restore(); }
});

test('blocks: GET list, POST { user_id }, DELETE /{id}; all same-origin, bearer, no-store', async () => {
  const f = fakeFetch(
    { body: { success: true, max: 500, blocks: [
      { user_id: 45, name: 'Ayşe', avatar: 'https://cdn.example/a.jpg', blocked_at: '2026-10-22T08:01:40Z' },
      { user_id: '12', name: '', avatar: 'javascript:alert(1)', blocked_at: '' },
      { user_id: 0, name: 'bad' },
    ] } },
    { status: 201, body: { success: true, user_id: 45, blocked: true } },
    { body: { success: true, user_id: 45, blocked: false } },
  );
  try {
    const list = await ugc.listBlocks('jwt');
    assert.deepEqual(list, [
      { userId: 45, name: 'Ayşe', avatar: 'https://cdn.example/a.jpg', blockedAt: '2026-10-22T08:01:40Z' },
      { userId: 12, name: 'Üye', avatar: '', blockedAt: '' },
    ]);
    assert.equal(f.calls[0].url, '/api/account/blocks');
    assert.equal(f.calls[0].init.method, 'GET');
    assert.equal(f.calls[0].body, undefined);

    await ugc.blockMember('jwt', 45);
    assert.equal(f.calls[1].url, '/api/account/blocks');
    assert.equal(f.calls[1].init.method, 'POST');
    assert.deepEqual(f.calls[1].body, { user_id: 45 });

    await ugc.unblockMember('jwt', 45);
    assert.equal(f.calls[2].url, '/api/account/blocks/45');
    assert.equal(f.calls[2].init.method, 'DELETE');
    for (const call of f.calls) {
      assert.equal(call.init.cache, 'no-store');
      assert.equal(call.init.headers.Authorization, 'Bearer jwt');
    }
  } finally { f.restore(); }
});

test('block errors: 403 block_not_allowed, 422 block_self, 409 block_limit, 404', async () => {
  const cases = [
    [{ status: 403, body: { code: 'block_not_allowed', message: 'x' } }, 403, /engellenemez/],
    [{ status: 422, body: { code: 'block_self' } }, 422, /Kendini engelleyemezsin/],
    [{ status: 409, body: { code: 'block_limit' } }, 409, /500/],
    [{ status: 404, body: { code: 'block_user_not_found' } }, 404, /bulunamadı/],
  ];
  for (const [answer, status, pattern] of cases) {
    const f = fakeFetch(answer);
    try {
      await assert.rejects(ugc.blockMember('jwt', 45), e => { assert.equal(e.status, status); assert.match(e.message, pattern); return true; });
    } finally { f.restore(); }
  }
  await assert.rejects(ugc.blockMember('jwt', 0), e => e.code === 'block_invalid');
  assert.throws(() => ugc.blockUrl(-3), e => e.code === 'block_invalid');
});

/* ------------------------------------------------------------- filtering */

test('local filtering: recipe cards by author.id / author_id, comments by author.id and reported ids', () => {
  const blocked = new Set([45, 12]);
  const recipes = [
    { id: 1, author: { id: 45 } },
    { id: 2, author_id: '12', author: null },
    { id: 3, author: { id: 7 }, author_id: '7' },
    { id: 4 },
    { id: 5, author: { id: '45' } },
  ];
  assert.deepEqual(ugc.filterBlockedRecipes(recipes, blocked).map(r => r.id), [3, 4]);
  assert.equal(ugc.recipeAuthorId({ author_id: '17', author: { id: 0 } }), 17);
  assert.equal(ugc.recipeAuthorId({ author_id: 'x' }), 0);
  const comments = [
    { id: 10, author: { id: 45 } },
    { id: 11, author: { id: 0, name: 'Eski üye' } },
    { id: 12, author: { id: 7 } },
    { id: 13, author: { id: 8 } },
  ];
  assert.deepEqual(ugc.filterVisibleComments(comments, blocked).map(c => c.id), [11, 12, 13]);
  assert.deepEqual(ugc.filterVisibleComments(comments, blocked, new Set([13])).map(c => c.id), [11, 12]);
  assert.equal(ugc.isAuthorBlocked(0, new Set([0])), false, 'anonymous authors are never "blocked"');
});

test('placeholder: author_blocked or local list → placeholder until "Yine de göster"', () => {
  const none = new Set();
  assert.equal(ugc.recipeBlockView({ author: { id: 45 }, author_blocked: true }, none, false), 'placeholder');
  assert.equal(ugc.recipeBlockView({ author: { id: 45 }, author_blocked: false }, new Set([45]), false), 'placeholder');
  assert.equal(ugc.recipeBlockView({ author_id: '45' }, new Set([45]), false), 'placeholder');
  assert.equal(ugc.recipeBlockView({ author: { id: 45 }, author_blocked: true }, none, true), 'show');
  assert.equal(ugc.recipeBlockView({ author: { id: 45 }, author_blocked: false }, none, false), 'show');
  assert.equal(ugc.recipeBlockView({ author: { id: 45 }, author_blocked: 'true' }, none, false), 'show', 'only a real boolean counts');
  assert.equal(ugc.BLOCKED_PLACEHOLDER_TITLE, 'Bu üyeyi engelledin.');
});

test('block offered only for other real members, never for self, anonymous or Tariften Topluluğu', () => {
  assert.equal(ugc.canOfferBlock({ id: 45, name: 'Ayşe' }, 7), true);
  assert.equal(ugc.canOfferBlock({ id: 45, name: 'Ayşe' }, '45'), false);
  assert.equal(ugc.canOfferBlock({ id: 0, name: 'Eski üye' }, 7), false);
  assert.equal(ugc.canOfferBlock({ id: 3, name: 'Tariften Topluluğu' }, 7), false);
  assert.equal(ugc.canOfferBlock(null, 7), false);
  assert.equal(ugc.isOwnContent('7', 7), true);
  assert.equal(ugc.isOwnContent(0, 0), false);
});

/* ------------------------------------------------------------------ copy */

test('confirmation copy is the contract text; menu label uses Turkish vowel harmony', () => {
  assert.equal(ugc.blockConfirmText('Ayşe'),
    "Ayşe engellensin mi? Tariflerini ve yorumlarını artık görmeyeceksin. İstediğin zaman Ayarlar'dan kaldırabilirsin.");
  const parts = ugc.blockConfirmParts('Ayşe Kaya');
  assert.equal(parts.title, 'Ayşe Kaya engellensin mi?');
  assert.equal(`${parts.title} ${parts.body}`, ugc.blockConfirmText('Ayşe Kaya'));
  assert.equal(ugc.blockConfirmParts('Kim? Ben').title, 'Kim? Ben engellensin mi?');
  assert.equal(ugc.blockActionLabel('Burak'), "Burak'ı engelle");
  assert.equal(ugc.blockActionLabel('Selim'), "Selim'i engelle");
  assert.equal(ugc.blockActionLabel('Ayşe'), "Ayşe'yi engelle");
  assert.equal(ugc.blockActionLabel('Onur'), "Onur'u engelle");
  assert.equal(ugc.blockActionLabel('Gül'), "Gül'ü engelle");
  assert.equal(ugc.blockActionLabel('Tuğba'), "Tuğba'yı engelle");
  assert.equal(ugc.blockActionLabel('Ali Kaya'), "Ali Kaya'yı engelle");
  assert.equal(ugc.blockActionLabel('chef42'), 'Bu üyeyi engelle');
  assert.equal(ugc.blockActionLabel('  '), 'Bu üyeyi engelle');
});

test('helpers: login return path, retry wording, block date', () => {
  assert.equal(ugc.loginHref('/recipe/menemen'), '/login?callbackUrl=%2Frecipe%2Fmenemen');
  assert.equal(ugc.loginHref('//evil.tld'), '/login?callbackUrl=%2F');
  assert.equal(ugc.formatRetryAfter(45), '45 saniye');
  assert.equal(ugc.formatRetryAfter(5400), '1 saat 30 dakika');
  assert.match(ugc.formatBlockDate('2026-10-22T08:01:40Z'), /2026/);
  assert.equal(ugc.formatBlockDate('nope'), '');
  assert.equal(ugc.BLOCKED_MEMBERS_HREF, '/profile/edit#engellenen-uyeler');
});

/* -------------------------------------------------------- source contracts */

test('same-origin routes forward to Core tariften/v1 with private, no-store', () => {
  const upstream = read('src/app/api/account/safety-upstream.ts');
  assert.match(upstream, /CORE = "https:\/\/api\.tariften\.com\/wp-json\/tariften\/v1"/);
  assert.match(upstream, /"Cache-Control": "private, no-store, max-age=0"/);
  assert.match(upstream, /cache: "no-store"/);
  const reports = read('src/app/api/account/reports/route.ts');
  assert.match(reports, /export async function POST/);
  assert.match(reports, /forward\(`\$\{CORE\}\/reports`, authorization, "POST"/);
  const blocks = read('src/app/api/account/blocks/route.ts');
  assert.match(blocks, /export async function GET/);
  assert.match(blocks, /export async function POST/);
  assert.match(blocks, /`\$\{CORE\}\/me\/blocks`/);
  const one = read('src/app/api/account/blocks/[userId]/route.ts');
  assert.match(one, /export async function DELETE/);
  assert.match(one, /`\$\{CORE\}\/me\/blocks\/\$\{userId\}`/);
});

test('block list lives in memory, keyed by member, provided app-wide', () => {
  const ctx = read('src/context/SafetyContext.tsx');
  assert.match(ctx, /listBlocks\(token\)/);
  assert.match(ctx, /`\$\{user\?\.id \|\| 0\}:\$\{token\}`/, 'sign-out or account switch changes the key');
  assert.doesNotMatch(ctx, /localStorage|sessionStorage/, 'never persisted');
  assert.match(ctx, /void load\(forKey, token\)/, 'refreshed after block/unblock');
  const layout = read('src/app/layout.tsx');
  assert.ok(layout.indexOf('<AuthProvider>') < layout.indexOf('<SafetyProvider>'));
});

test('surfaces: recipe detail ⋯ + gate, comment ⋯, shared cards hide blocked authors, settings panel', () => {
  const view = read('src/components/recipe/RecipeDetailView.tsx');
  assert.match(view, /<ContentSafetyMenu targetType="recipe" targetId=\{recipe\.id\}/);
  assert.match(view, /<BlockedRecipeGate recipeId=\{recipe\.id\} authorId=\{authorId\}[^>]*authorBlocked=\{recipe\.author_blocked === true\}>/);
  assert.ok(view.indexOf('<BlockedRecipeGate') < view.indexOf('<RecipeDetailClient') && view.indexOf('</BlockedRecipeGate>') > view.indexOf('<RecipeDetailClient'));
  const gate = read('src/components/safety/BlockedRecipeGate.tsx');
  assert.match(gate, /Yine de göster/);
  assert.match(gate, /Engeli kaldır/);
  assert.match(gate, /BLOCKED_PLACEHOLDER_TITLE/);
  const detail = read('src/components/recipe/RecipeDetailClient.tsx');
  assert.match(detail, /<ContentSafetyMenu targetType="comment" targetId=\{comment\.id\} author=\{comment\.author\}/);
  assert.match(detail, /filterVisibleComments\(comments, blockedIds, reportedComments\)/);
  assert.match(detail, /visibleComments\.map\(/);
  assert.match(detail, /filterBlockedRecipes\(similarRecipes, blockedIds\)/);
  for (const file of ['src/components/recipes/RecipeCard.tsx', 'src/app/page.tsx', 'src/app/collections/rejimde/page.tsx']) {
    assert.match(read(file), /<HideIfBlocked (key=\{recipe\.id\} )?authorId=\{recipeAuthorId\(recipe\)\}>/, file);
  }
  const menu = read('src/components/safety/ContentSafetyMenu.tsx');
  assert.match(menu, /label: "Bildir"/);
  assert.match(menu, /blockActionLabel\(name\)/);
  assert.match(menu, /router\.push\(loginHref\(/, 'guests go to sign-in and back');
  assert.match(menu, /if \(isOwnContent\(authorId, user\?\.id\)/);
  assert.match(menu, /markCommentReported\(targetId\)/);
  const dialog = read('src/components/safety/ReportDialog.tsx');
  assert.match(dialog, /REPORT_REASONS\.map/);
  assert.match(dialog, /result\.message/, "shows the server's message");
  const confirm = read('src/components/safety/BlockConfirmDialog.tsx');
  assert.match(confirm, /blockConfirmParts\(name\)/);
  const edit = read('src/app/profile/edit/page.tsx');
  assert.match(edit, /<BlockedMembersPanel \/>/);
  const panel = read('src/components/account/BlockedMembersPanel.tsx');
  assert.match(panel, /id="engellenen-uyeler"/);
  assert.match(panel, /Engellenen üyeler/);
  assert.match(panel, /Engeli kaldır/);
  assert.match(panel, /<AccountAvatar url=\{member\.avatar\}/);
  assert.match(panel, /formatBlockDate\(member\.blockedAt\)/);
});

test('account deletion copy: published recipes stay anonymously, drafts deleted, comments anonymised', () => {
  for (const file of ['src/app/profile/edit/page.tsx', 'src/app/delete-account/page.tsx']) {
    const src = read(file);
    assert.match(src, /Tariften Topluluğu/, file);
    assert.match(src, /Eski üye/, file);
    assert.match(src, /[Tt]aslak/, file);
    assert.doesNotMatch(src, /Oluşturduğun tüm tarifler|"Oluşturulan tarifler"/, `${file}: published recipes are not deleted any more`);
  }
  const page = read('src/app/delete-account/page.tsx');
  assert.match(page, /<strong className="font-semibold text-slate-900">Profil<\/strong> sekmesine gidin/);
  assert.match(page, /Hesap İşlemleri/);
  assert.match(page, /&quot;Hesabımı Sil&quot;/);
  assert.doesNotMatch(page, /Profili Düzenle/, 'the app has no "Profili Düzenle" step for deletion');
  assert.match(page, /href="\/profile\/edit"/);
  assert.match(page, /HESABIMI SIL/);
});
