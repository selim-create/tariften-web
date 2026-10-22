'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const transpile = file => ts.transpileModule(read(file), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function load(file) {
  const mod = { exports: {} };
  Function('module', 'exports', 'require', transpile(file))(mod, mod.exports, () => { throw Error('unexpected_import'); });
  return mod.exports;
}

const g = load('src/lib/guides.ts');

/* Core contract examples (MUTFAK_REHBERI.md §3), trimmed. */
const LIST = {
  data: [{
    id: 812, slug: 'yumurta-haslama-sureleri', url: 'https://tariften.com/rehber/yumurta-haslama-sureleri',
    title: 'Yumurta haşlama süreleri', excerpt: 'Rafadan, kayısı ve katı kıvam için dakika dakika rehber.',
    image: 'https://api.tariften.com/wp-content/uploads/2026/10/yumurta-1024x683.jpg',
    topics: [{ slug: 'teknikler', name: 'Teknikler' }, { slug: 'pisirme-sureleri-ve-kivamlar', name: 'Pişirme süreleri ve kıvamlar' }],
    level: { slug: 'baslangic', name: 'Başlangıç' }, reading_minutes: 4, tool: 'egg_doneness', updated_at: '2026-10-21T09:30:00Z',
  }],
  count: 1, pages: 1, page: 1, per_page: 12,
};
const DETAIL = {
  ...LIST.data[0],
  content_html: '<h2>Süreler</h2><p>Su kaynayınca <strong>6 dakika</strong>…</p>',
  related_recipes: [
    { id: 431, slug: 'menemen', title: 'Menemen', image: 'https://api.tariften.com/wp-content/uploads/menemen-300x200.jpg', total_time: 25 },
    { id: 77, slug: 'karniyarik', title: 'Karnıyarık', image: null, total_time: null },
  ],
  sources: [{ title: 'USDA FSIS — Egg Safety', url: 'https://www.fsis.usda.gov/food-safety' }],
  food_safety: null,
  author: { name: 'Selim Altınkaynak' },
  published_at: '2026-10-20T08:00:00Z',
  seo: {
    title: 'Yumurta haşlama süreleri | Tariften Mutfak Rehberi',
    description: 'Rafadan, kayısı ve katı kıvam için dakika dakika rehber.',
    canonical: 'https://tariften.com/rehber/yumurta-haslama-sureleri',
    og_image: { url: 'https://api.tariften.com/wp-content/uploads/2026/10/yumurta.jpg', width: 1200, height: 630 },
  },
};

/* ------------------------------------------------------------ API mapping */

test('list: contract shape maps to camelCase; nulls stay null; junk rows are dropped', () => {
  const list = g.normalizeGuideList({ ...LIST, data: [...LIST.data, { slug: 'Bad Slug', title: 'x' }, null, { slug: 'no-title' }] });
  assert.equal(list.data.length, 1);
  assert.deepEqual(list.data[0], {
    id: 812, slug: 'yumurta-haslama-sureleri', title: 'Yumurta haşlama süreleri',
    excerpt: 'Rafadan, kayısı ve katı kıvam için dakika dakika rehber.',
    image: 'https://api.tariften.com/wp-content/uploads/2026/10/yumurta-1024x683.jpg',
    topics: LIST.data[0].topics, level: { slug: 'baslangic', name: 'Başlangıç' },
    readingMinutes: 4, tool: 'egg_doneness', foodSafetyReview: null, updatedAt: '2026-10-21T09:30:00Z',
  });
  assert.deepEqual({ count: list.count, pages: list.pages, page: list.page, perPage: list.perPage }, { count: 1, pages: 1, page: 1, perPage: 12 });

  const sparse = g.normalizeGuideSummary({ slug: 'a-b', title: 'T', image: 'http://insecure.example/x.jpg', level: null, tool: null, reading_minutes: 0 });
  assert.equal(sparse.image, null, 'only https images');
  assert.equal(sparse.level, null);
  assert.equal(sparse.tool, null);
  assert.equal(sparse.readingMinutes, null, '0 minutes is unknown, not "0 dk"');

  assert.deepEqual(g.normalizeGuideList(null), { data: [], count: 0, pages: 0, page: 1, perPage: 12 });
});

test('detail: related recipes, https-only sources, approved-only food safety, SEO fallbacks', () => {
  const guide = g.normalizeGuide(DETAIL);
  assert.equal(guide.contentHtml, DETAIL.content_html);
  assert.deepEqual(guide.relatedRecipes, [
    { id: 431, slug: 'menemen', title: 'Menemen', image: 'https://api.tariften.com/wp-content/uploads/menemen-300x200.jpg', totalTime: 25 },
    { id: 77, slug: 'karniyarik', title: 'Karnıyarık', image: null, totalTime: null },
  ]);
  assert.deepEqual(guide.sources, [{ url: 'https://www.fsis.usda.gov/food-safety', host: 'fsis.usda.gov', title: 'USDA FSIS — Egg Safety' }]);
  assert.equal(guide.foodSafety, null);
  assert.equal(guide.authorName, 'Selim Altınkaynak');
  assert.equal(guide.seo.canonical, 'https://tariften.com/rehber/yumurta-haslama-sureleri');
  assert.deepEqual(guide.seo.ogImage, { url: 'https://api.tariften.com/wp-content/uploads/2026/10/yumurta.jpg', width: 1200, height: 630 });

  const other = g.normalizeGuide({
    ...DETAIL,
    sources: [{ title: '', url: 'https://www.who.int/x' }, { title: 'bad', url: 'javascript:alert(1)' }, { title: 'http', url: 'http://a.com' }, { url: 'https://www.who.int/x' }],
    food_safety: { status: 'approved', reviewed_at: '2026-10-19T12:00:00Z' },
    seo: { canonical: 'https://evil.example/rehber/x', og_image: null },
    related_recipes: [{ slug: 'a', title: 'A' }, { slug: 'a', title: 'dup' }, { slug: 'x/y', title: 'bad' }],
  });
  assert.deepEqual(other.sources, [{ url: 'https://www.who.int/x', host: 'who.int', title: 'who.int' }]);
  assert.deepEqual(other.foodSafety, { reviewedAt: '2026-10-19T12:00:00Z' });
  assert.equal(other.seo.canonical, 'https://tariften.com/rehber/yumurta-haslama-sureleri', 'foreign canonical is ignored');
  assert.equal(other.seo.title, 'Yumurta haşlama süreleri | Tariften Mutfak Rehberi');
  assert.equal(other.seo.ogImage, null);
  assert.deepEqual(other.relatedRecipes.map(r => r.slug), ['a']);
  assert.equal(g.normalizeGuide({ ...DETAIL, food_safety: { status: 'pending' } }).foodSafety, null);
  // 1.0.57: unreviewed food-safety guides are published with a warning.
  const warned = g.normalizeGuide({ ...DETAIL, food_safety: null, food_safety_review: 'unreviewed', food_safety_warning: 'Uzman incelemesi yok.' });
  assert.equal(warned.foodSafety, null);
  assert.equal(warned.foodSafetyReview, 'unreviewed');
  assert.equal(warned.foodSafetyWarning, 'Uzman incelemesi yok.');
  assert.equal(g.normalizeGuide({ ...DETAIL, food_safety_review: 'unreviewed' }).foodSafetyWarning, g.GUIDE_UNREVIEWED_WARNING, 'fallback copy');
  const approved = g.normalizeGuide({ ...DETAIL, food_safety: { status: 'approved', reviewed_at: null }, food_safety_review: 'approved', food_safety_warning: 'x' });
  assert.equal(approved.foodSafetyWarning, null, 'never both badge and warning');
  assert.equal(g.normalizeGuide({ ...DETAIL, food_safety_review: 'weird' }).foodSafetyReview, null);
  assert.equal(g.normalizeGuide({ code: 'guide_not_found' }), null);
});

test('topics and sitemap: tree with counts, levels deduped, sitemap slugs validated', () => {
  const t = g.normalizeGuideTopics({
    data: [
      { id: 101, slug: 'teknikler', name: 'Teknikler', description: '', count: 6, total_count: 6, children: [] },
      { id: 103, slug: 'saklama', name: 'Saklama', description: '', count: 2, total_count: 3,
        children: [{ id: 140, slug: 'dondurucu', name: 'Dondurucu', description: '', count: 1, total_count: 1, children: [] }] },
      { slug: '', name: 'broken' },
    ],
    levels: [{ slug: 'baslangic', name: 'Başlangıç', count: 4 }, { slug: 'orta', name: 'Orta', count: 2 }, { slug: 'orta', name: 'dup', count: 9 }],
  });
  assert.deepEqual(t.topics.map(x => [x.slug, x.count, x.totalCount, x.children.length]), [['teknikler', 6, 6, 0], ['saklama', 2, 3, 1]]);
  assert.deepEqual(t.levels.map(l => l.slug), ['baslangic', 'orta']);
  assert.deepEqual(g.findGuideTopic(t.topics, 'dondurucu').parent.slug, 'saklama');
  assert.equal(g.findGuideTopic(t.topics, 'saklama').parent, null);
  assert.equal(g.findGuideTopic(t.topics, 'yok'), null);
  assert.deepEqual(g.normalizeGuideTopics(undefined), { topics: [], levels: [] });

  assert.deepEqual(g.normalizeGuideSitemap({ data: [
    { slug: 'yumurta-haslama-sureleri', url: 'https://tariften.com/rehber/yumurta-haslama-sureleri', updated_at: '2026-10-21T09:30:00Z' },
    { slug: 'yumurta-haslama-sureleri', updated_at: '2026-10-01T00:00:00Z' },
    { slug: '../etc', updated_at: 'x' },
    { slug: 'tarihsiz', updated_at: 'not a date' },
  ] }), [{ slug: 'yumurta-haslama-sureleri', updatedAt: '2026-10-21T09:30:00Z' }, { slug: 'tarihsiz', updatedAt: null }]);
  assert.deepEqual(g.normalizeGuideSitemap({ code: 'rest_no_route' }), []);
});

test('list params, site links and Core URLs', () => {
  assert.deepEqual(g.parseGuideListParams({ konu: 'saklama', seviye: 'orta', sayfa: '3' }), { topic: 'saklama', level: 'orta', page: 3 });
  assert.deepEqual(g.parseGuideListParams({ konu: ['teknikler', 'x'], sayfa: '0' }), { topic: 'teknikler', level: null, page: 1 });
  assert.deepEqual(g.parseGuideListParams({ konu: '<script>', seviye: 'Orta', sayfa: '99999' }), { topic: null, level: null, page: 1 });
  assert.deepEqual(g.parseGuideListParams({ sayfa: '900' }), { topic: null, level: null, page: 500 });
  assert.deepEqual(g.parseGuideListParams(undefined), { topic: null, level: null, page: 1 });

  assert.equal(g.guideListHref({}), '/rehber');
  assert.equal(g.guideListHref({ topic: 'saklama', page: 1 }), '/rehber?konu=saklama');
  assert.equal(g.guideListHref({ topic: 'saklama', level: 'orta', page: 2 }), '/rehber?konu=saklama&seviye=orta&sayfa=2');

  assert.equal(g.guideListApiUrl({ topic: 'pisirme-sureleri-ve-kivamlar' }),
    'https://api.tariften.com/wp-json/tariften/v1/guides?topic=pisirme-sureleri-ve-kivamlar&page=1&per_page=12');
  assert.equal(g.guideListApiUrl({ level: 'ileri', page: 4 }, 24), 'https://api.tariften.com/wp-json/tariften/v1/guides?level=ileri&page=4&per_page=24');
  assert.equal(g.guideApiUrl('yumurta-haslama-sureleri'), 'https://api.tariften.com/wp-json/tariften/v1/guides/yumurta-haslama-sureleri');

  assert.deepEqual(g.guidePageWindow(1, 1), []);
  assert.deepEqual(g.guidePageWindow(1, 3), [1, 2, 3]);
  assert.deepEqual(g.guidePageWindow(5, 12), [1, null, 4, 5, 6, null, 12]);
  assert.deepEqual(g.guidePageWindow(3, 12), [1, 2, 3, 4, null, 12], 'a single hidden page is shown instead of …');
});

/* ------------------------------------------------------------- sanitiser */

test('sanitiser: no script/style/event handlers/javascript: URLs; Core markup survives', () => {
  const dirty = [
    '<script>alert(1)</script><style>p{}</style><p onclick="x()" style="color:red" id="own">Merhaba <strong>dünya</strong></p>',
    '<a href="javascript:alert(1)">a</a><a href="java&#x09;script:alert(1)">b</a><a href=" JaVaScRiPt:alert(1)">c</a>',
    '<a href="https://www.fsis.usda.gov/x" target="_blank">kaynak</a><a href="/recipe/menemen">menemen</a>',
    '<img src="x" onerror="alert(1)"><img src="https://api.tariften.com/a.jpg" alt="A" width="600"><img src="data:image/png;base64,AAA">',
    '<svg><script>alert(1)</script></svg><iframe src="https://evil.example/embed/x"></iframe>',
    '<scr<script>x</script>ipt>alert(2)</script><form action="/x"><input name="q"></form>',
    '<p class="tariften-tip"><strong>İpucu:</strong> Taşı ıslatın.</p><h1>İkinci başlık</h1>',
    '<table><thead><tr><th scope="col">Açı</th></tr></thead><tbody><tr><td colspan="2" onmouseover="x">15°</td></tr></tbody></table>',
    '<!-- wp:paragraph --><p>yorum</p><!-- /wp:paragraph -->',
  ].join('');
  const clean = g.sanitizeGuideHtml(dirty);
  assert.doesNotMatch(clean, /<script|<style|<svg|<form|<input/i);
  assert.doesNotMatch(clean, /\son[a-z]+=/i, 'no inline event handlers');
  assert.doesNotMatch(clean, /javascript:/i);
  assert.doesNotMatch(clean, /style=|id="own"|data:image|evil\.example|<!--/);
  assert.match(clean, /<p>Merhaba <strong>dünya<\/strong><\/p>/);
  assert.match(clean, /<a href="https:\/\/www\.fsis\.usda\.gov\/x" target="_blank" rel="noopener noreferrer">kaynak<\/a>/);
  assert.match(clean, /<a href="\/recipe\/menemen">menemen<\/a>/);
  assert.match(clean, /<img src="https:\/\/api\.tariften\.com\/a\.jpg" alt="A" width="600" loading="lazy">/);
  assert.equal((clean.match(/<img/g) || []).length, 1, 'images without a safe src are dropped');
  assert.match(clean, /<p class="tariften-tip"><strong>İpucu:<\/strong> Taşı ıslatın\.<\/p><h2>İkinci başlık<\/h2>/, 'h1 becomes h2');
  assert.match(clean, /<th scope="col">Açı<\/th>/);
  assert.match(clean, /<td colspan="2">15°<\/td>/);
  assert.match(clean, /<p>yorum<\/p>/);
  assert.equal(g.sanitizeGuideHtml(null), '');
  assert.equal(g.sanitizeGuideHtml('a < b > c'), 'a &lt; b &gt; c', 'stray brackets cannot open a tag');
  assert.equal(g.sanitizeGuideHtml('<a href="x" title=\'a"b\'>t</a>'), '<a title="a&quot;b">t</a>', 'relative non-path href dropped, quotes re-escaped');
});

test('sanitiser: only https YouTube / Vimeo embeds, fallback text removed', () => {
  const html = g.sanitizeGuideHtml([
    '<figure class="wp-block-embed is-provider-youtube"><div class="wp-block-embed__wrapper">',
    '<iframe title="Bıçak bileme" width="500" height="281" src="https://www.youtube.com/embed/abc123?feature=oembed" frameborder="0" allow="accelerometer; encrypted-media" allowfullscreen>Tarayıcınız desteklemiyor</iframe>',
    '</div></figure>',
    '<iframe src="https://player.vimeo.com/video/123"></iframe>',
    '<iframe src="http://www.youtube.com/embed/x"></iframe>',
    '<iframe src="https://www.youtube.com/watch?v=x"></iframe>',
    '<iframe src="https://youtube.com.evil.example/embed/x"></iframe>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
  ].join(''));
  const frames = html.match(/<iframe[^>]*><\/iframe>/g) || [];
  assert.equal(frames.length, 2);
  assert.match(frames[0], /src="https:\/\/www\.youtube\.com\/embed\/abc123\?feature=oembed"/);
  assert.match(frames[0], /allowfullscreen/);
  assert.match(frames[0], /loading="lazy"/);
  assert.match(frames[1], /player\.vimeo\.com\/video\/123/);
  assert.doesNotMatch(html, /desteklemiyor|srcdoc|evil/);
  assert.equal(g.isAllowedIframeSrc('https://www.youtube-nocookie.com/embed/x'), true);
  assert.equal(g.isAllowedIframeSrc('https://player.vimeo.com/x'), false);
});

/* ------------------------------------------- headings, TOC, FAQ, callouts */

test('heading ids: Turkish letters folded, punctuation dropped, never empty', () => {
  assert.equal(g.headingId('Bıçak nasıl bilenir?'), 'bicak-nasil-bilenir');
  assert.equal(g.headingId('İpucu: Şişte ÇÖĞÜ & Işık'), 'ipucu-siste-cogu-isik');
  assert.equal(g.headingId('Açı (15°–20°) seçimi'), 'aci-15-20-secimi');
  assert.equal(g.headingId('???'), 'bolum');
  assert.ok(g.headingId('a'.repeat(200)).length <= 60);
});

const ARTICLE = [
  '<p>Giriş paragrafı.</p>',
  '<h2 class="wp-block-heading">Bu rehberde</h2><ul class="wp-block-list"><li>Bileme açısı</li><li>Bakım</li></ul>',
  '<h2 class="wp-block-heading">Neden <strong>bilemeli</strong>?</h2><p>Çünkü.</p>',
  '<p class="tariften-tip"><strong>İpucu:</strong> Taşı 10 dakika suda bekletin.</p>',
  '<p class="tariften-warning"><strong>Dikkat:</strong> Parmaklarınızı ağzın önünde tutmayın.</p>',
  '<figure class="wp-block-table"><table><thead><tr><th>Taş</th><th>Kum</th></tr></thead><tbody><tr><td>Kaba</td><td>400</td></tr></tbody></table></figure>',
  '<h2 class="wp-block-heading">Neden bilemeli?</h2><p>Tekrar başlık.</p>',
  '<h2 class="wp-block-heading">Özetle</h2><p>Kısa özet.</p>',
  '<h2 class="wp-block-heading">Sık sorulan sorular</h2>',
  '<h3 class="wp-block-heading">Ne sıklıkla bilemeliyim?</h3><p>Evde <strong>2-3 ayda</strong> bir yeterli.</p>',
  '<h3 class="wp-block-heading">Masat yeterli mi?</h3><p>Hayır; masat ağzı hizalar, bilemez.</p><p>İkinci paragraf.</p>',
  '<h3 class="wp-block-heading">Cevapsız soru</h3>',
].join('\n');

test('prepareGuideHtml: anchored h2s, TOC without "Bu rehberde", key points card, table wrapper, callout labels', () => {
  const { html, toc } = g.prepareGuideHtml(ARTICLE);
  assert.deepEqual(toc, [
    { id: 'neden-bilemeli', text: 'Neden bilemeli?' },
    { id: 'neden-bilemeli-2', text: 'Neden bilemeli?' },
    { id: 'ozetle', text: 'Özetle' },
    { id: 'sik-sorulan-sorular', text: 'Sık sorulan sorular' },
  ]);
  assert.match(html, /<h2 id="neden-bilemeli" class="wp-block-heading">Neden <strong>bilemeli<\/strong>\?<\/h2>/);
  assert.match(html, /<div class="gd-keypoints"><h2 id="bu-rehberde" class="wp-block-heading">Bu rehberde<\/h2>\n?<ul class="wp-block-list">/);
  assert.match(html, /<figure class="wp-block-table"><div class="gd-table-scroll" tabindex="0" role="region" aria-label="Tablo"><table>/);
  assert.match(html, /<p class="tariften-tip"><strong class="gd-callout-label">İpucu<\/strong> Taşı/);
  assert.match(html, /<p class="tariften-warning"><strong class="gd-callout-label">Dikkat<\/strong> Parmak/);
  assert.equal((html.match(/ id="/g) || []).length, 5, 'every h2 has exactly one id');
});

test('prepareGuideHtml: FAQ pairs extracted as plain text and the section wrapped', () => {
  const { html, faq } = g.prepareGuideHtml(ARTICLE);
  assert.deepEqual(faq, [
    { question: 'Ne sıklıkla bilemeliyim?', answer: 'Evde 2-3 ayda bir yeterli.' },
    { question: 'Masat yeterli mi?', answer: 'Hayır; masat ağzı hizalar, bilemez. İkinci paragraf.' },
  ]);
  assert.match(html, /<div class="gd-faq"><h2 id="sik-sorulan-sorular"/);
  assert.match(html, /Cevapsız soru<\/h3><\/div>$/);

  // FAQ followed by another h2: only the FAQ part is wrapped.
  const mid = g.prepareGuideHtml('<h2>SSS</h2><h3>Soru?</h3><p>Cevap.</p><h2>Son söz</h2><p>Bitti.</p>');
  assert.deepEqual(mid.faq, [{ question: 'Soru?', answer: 'Cevap.' }]);
  assert.match(mid.html, /<\/p><\/div><h2 id="son-soz">/);

  const none = g.prepareGuideHtml('<h2>Tek bölüm</h2><h3>Soru gibi?</h3><p>Değil.</p>');
  assert.deepEqual(none.faq, []);
  assert.doesNotMatch(none.html, /gd-faq/);
  assert.deepEqual(g.prepareGuideHtml('').toc, []);
});

test('JSON-LD: Article + BreadcrumbList always, FAQPage only with questions; script-safe JSON', () => {
  const guide = g.normalizeGuide({ ...DETAIL, title: 'Başlık </script><script>alert(1)</script>' });
  const [article, crumbs, faqPage] = g.guideJsonLd(guide, [{ question: 'S?', answer: 'C.' }]);
  assert.equal(article['@type'], 'Article');
  assert.equal(article.mainEntityOfPage['@id'], 'https://tariften.com/rehber/yumurta-haslama-sureleri');
  assert.deepEqual(article.image, ['https://api.tariften.com/wp-content/uploads/2026/10/yumurta.jpg']);
  assert.equal(article.datePublished, '2026-10-20T08:00:00Z');
  assert.equal(article.dateModified, '2026-10-21T09:30:00Z');
  assert.deepEqual(article.author, { '@type': 'Person', name: 'Selim Altınkaynak' });
  assert.equal(article.articleSection, 'Teknikler');
  assert.equal(crumbs['@type'], 'BreadcrumbList');
  assert.deepEqual(crumbs.itemListElement.map(i => i.item), [
    'https://tariften.com', 'https://tariften.com/rehber', 'https://tariften.com/rehber?konu=teknikler', 'https://tariften.com/rehber/yumurta-haslama-sureleri',
  ]);
  assert.deepEqual(faqPage.mainEntity, [{ '@type': 'Question', name: 'S?', acceptedAnswer: { '@type': 'Answer', text: 'C.' } }]);
  assert.equal(g.guideJsonLd(guide, []).length, 2);
  const json = g.jsonLdString(article);
  assert.doesNotMatch(json, /<\/script/i);
  assert.equal(JSON.parse(json).headline, guide.title);
});

test('dates are shown in Turkish, in Istanbul time', () => {
  assert.equal(g.guideDate('2026-10-21T09:30:00Z'), '21 Ekim 2026');
  assert.equal(g.guideDate('2026-10-21T22:30:00Z'), '22 Ekim 2026', 'UTC late evening is the next day in Istanbul');
  assert.equal(g.guideDate('nope'), '');
  assert.equal(g.guideDate(null), '');
});

/* ---------------------------------------------------- wiring (static) */

test('wiring: routes, sitemap, navigation and dark-mode styles are in place', () => {
  const detail = read('src/app/rehber/[slug]/page.tsx');
  assert.match(detail, /notFound\(\)/);
  assert.match(detail, /prepareGuideHtml\(guide\.contentHtml\)/, 'article HTML always goes through the sanitiser');
  assert.match(detail, /application\/ld\+json/);
  assert.match(detail, /generateMetadata/);
  assert.match(detail, /Gıda güvenliği uzmanı tarafından incelendi/);
  assert.match(detail, /\/recipe\/\$\{encodeURIComponent\(recipe\.slug\)\}/);

  const api = read('src/lib/guides-api.ts');
  assert.match(api, /revalidate/);
  assert.match(api, /status === 404\) return null/, 'only a real 404 becomes notFound');

  const sitemap = read('src/app/sitemap.ts');
  assert.match(sitemap, /getGuideSitemap\(\)/);
  assert.match(sitemap, /\/rehber\/\$\{guide\.slug\}/);

  assert.match(read('src/components/layout/Header.tsx'), /href: "\/rehber", label: "Mutfak Rehberi"/);
  assert.match(read('src/components/layout/Footer.tsx'), /href="\/rehber"/);

  const css = read('src/app/globals.css');
  for (const selector of ['.gd-body', '.gd-table-scroll', '.tariften-tip', '.tariften-warning', '.gd-keypoints', '.gd-faq', '.dark .gd-body']) {
    assert.ok(css.includes(selector), `${selector} styled`);
  }
});
