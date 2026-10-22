/**
 * Mutfak Rehberi (kitchen guide): pure helpers shared by the /rehber pages.
 *
 * No runtime imports on purpose: scripts/check-kitchen-guide-web.test.cjs
 * loads this file directly. Everything here maps the public Core contract
 * (`tariften/v1/guides*`) defensively and prepares the Gutenberg article HTML
 * (sanitise, heading anchors, table of contents, FAQ, callouts) for display.
 */

export const GUIDE_API_BASE = "https://api.tariften.com/wp-json/tariften/v1";
export const GUIDE_SITE_URL = "https://tariften.com";
export const GUIDE_PER_PAGE = 12;

/* ------------------------------------------------------------------ types */

export interface GuideTerm { slug: string; name: string }

export interface GuideSummary {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  image: string | null;
  topics: GuideTerm[];
  level: GuideTerm | null;
  readingMinutes: number | null;
  tool: string | null;
  updatedAt: string | null;
}

export interface GuideRelatedRecipe {
  id: number;
  slug: string;
  title: string;
  image: string | null;
  totalTime: number | null;
}

export interface GuideSource { title: string; url: string; host: string }

export interface GuideSeo {
  title: string;
  description: string;
  canonical: string;
  ogImage: { url: string; width: number | null; height: number | null } | null;
}

export interface Guide extends GuideSummary {
  contentHtml: string;
  relatedRecipes: GuideRelatedRecipe[];
  sources: GuideSource[];
  /** Only set when the food-safety review is approved. */
  foodSafety: { reviewedAt: string | null } | null;
  authorName: string | null;
  publishedAt: string | null;
  seo: GuideSeo;
}

export interface GuideList {
  data: GuideSummary[];
  count: number;
  pages: number;
  page: number;
  perPage: number;
}

export interface GuideTopic {
  id: number;
  slug: string;
  name: string;
  description: string;
  count: number;
  totalCount: number;
  children: GuideTopic[];
}

export interface GuideLevel { slug: string; name: string; count: number }

export interface GuideTopics { topics: GuideTopic[]; levels: GuideLevel[] }

export interface GuideSitemapEntry { slug: string; updatedAt: string | null }

export interface GuideListParams { topic: string | null; level: string | null; page: number }

export interface GuideTocItem { id: string; text: string }

export interface GuideFaqItem { question: string; answer: string }

export interface PreparedGuideHtml { html: string; toc: GuideTocItem[]; faq: GuideFaqItem[] }

/* --------------------------------------------------------- small helpers */

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", hellip: "…",
  ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»",
};

export function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => safeCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => safeCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

function safeCodePoint(code: number): string {
  return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
}

const BLOCK_TAG = /<\/?(?:p|br|hr|li|ul|ol|dl|dt|dd|h[1-6]|div|figure|figcaption|table|thead|tbody|tfoot|tr|td|th|caption|blockquote|pre|iframe|img)\b[^>]*>/gi;

/** Visible text of an HTML fragment: block tags become spaces, inline tags vanish. */
export function htmlToText(html: string): string {
  return decodeEntities(String(html).replace(BLOCK_TAG, " ").replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function positiveInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function nonNegativeInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** https URL as given by Core, or null (Core never sends placeholders). */
export function httpsUrl(value: unknown): string | null {
  const url = text(value);
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function isoDate(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  return Number.isNaN(new Date(raw).getTime()) ? null : raw;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isGuideSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 200 && SLUG.test(value);
}

function term(value: unknown): GuideTerm | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const slug = text(raw.slug);
  const name = text(raw.name);
  return isGuideSlug(slug) && name ? { slug, name } : null;
}

/* ------------------------------------------------------------ API mapping */

export function normalizeGuideSummary(value: unknown): GuideSummary | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const slug = text(raw.slug);
  const title = text(raw.title);
  if (!isGuideSlug(slug) || !title) return null;
  const topics = Array.isArray(raw.topics) ? raw.topics.map(term).filter((t): t is GuideTerm => t !== null) : [];
  return {
    id: positiveInt(raw.id) ?? 0,
    slug,
    title,
    excerpt: text(raw.excerpt),
    image: httpsUrl(raw.image),
    topics,
    level: term(raw.level),
    readingMinutes: positiveInt(raw.reading_minutes),
    tool: text(raw.tool) || null,
    updatedAt: isoDate(raw.updated_at),
  };
}

export function normalizeGuideList(value: unknown, fallbackPage = 1, fallbackPerPage = GUIDE_PER_PAGE): GuideList {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const data = Array.isArray(raw.data)
    ? raw.data.map(normalizeGuideSummary).filter((g): g is GuideSummary => g !== null)
    : [];
  const count = Math.max(nonNegativeInt(raw.count), data.length);
  const perPage = positiveInt(raw.per_page) ?? fallbackPerPage;
  const pages = Math.max(nonNegativeInt(raw.pages), count > 0 ? 1 : 0);
  return { data, count, pages, page: positiveInt(raw.page) ?? fallbackPage, perPage };
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function normalizeGuide(value: unknown): Guide | null {
  const summary = normalizeGuideSummary(value);
  if (!summary) return null;
  const raw = value as Record<string, unknown>;

  const relatedRecipes: GuideRelatedRecipe[] = [];
  if (Array.isArray(raw.related_recipes)) {
    for (const item of raw.related_recipes) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      const slug = text(r.slug);
      const title = text(r.title);
      if (!slug || !title || /[\s/?#]/.test(slug) || relatedRecipes.some(x => x.slug === slug)) continue;
      relatedRecipes.push({ id: positiveInt(r.id) ?? 0, slug, title, image: httpsUrl(r.image), totalTime: positiveInt(r.total_time) });
    }
  }

  const sources: GuideSource[] = [];
  if (Array.isArray(raw.sources)) {
    for (const item of raw.sources) {
      if (!item || typeof item !== "object") continue;
      const s = item as Record<string, unknown>;
      const url = httpsUrl(s.url);
      if (!url || sources.some(x => x.url === url)) continue;
      const host = hostOf(url);
      sources.push({ url, host, title: text(s.title) || host });
    }
  }

  const safety = raw.food_safety && typeof raw.food_safety === "object" ? raw.food_safety as Record<string, unknown> : null;
  const foodSafety = safety && safety.status === "approved" ? { reviewedAt: isoDate(safety.reviewed_at) } : null;

  const author = raw.author && typeof raw.author === "object" ? text((raw.author as Record<string, unknown>).name) : "";
  const seoRaw = raw.seo && typeof raw.seo === "object" ? raw.seo as Record<string, unknown> : {};
  const og = seoRaw.og_image && typeof seoRaw.og_image === "object" ? seoRaw.og_image as Record<string, unknown> : null;
  const ogUrl = og ? httpsUrl(og.url) : null;
  const ownCanonical = `${GUIDE_SITE_URL}/rehber/${summary.slug}`;
  const canonical = httpsUrl(seoRaw.canonical);

  return {
    ...summary,
    contentHtml: typeof raw.content_html === "string" ? raw.content_html : "",
    relatedRecipes: relatedRecipes.slice(0, 12),
    sources: sources.slice(0, 10),
    foodSafety,
    authorName: author || null,
    publishedAt: isoDate(raw.published_at),
    seo: {
      title: text(seoRaw.title) || `${summary.title} | Tariften Mutfak Rehberi`,
      description: text(seoRaw.description) || summary.excerpt.slice(0, 160),
      // Only our own host may be canonical; anything else falls back to the guide URL.
      canonical: canonical && canonical.startsWith(`${GUIDE_SITE_URL}/rehber/`) ? canonical : ownCanonical,
      ogImage: ogUrl ? { url: ogUrl, width: positiveInt(og?.width), height: positiveInt(og?.height) } : null,
    },
  };
}

function normalizeTopic(value: unknown, depth = 0): GuideTopic | null {
  if (!value || typeof value !== "object" || depth > 4) return null;
  const raw = value as Record<string, unknown>;
  const base = term(raw);
  if (!base) return null;
  const children = Array.isArray(raw.children)
    ? raw.children.map(child => normalizeTopic(child, depth + 1)).filter((t): t is GuideTopic => t !== null)
    : [];
  const count = nonNegativeInt(raw.count);
  return {
    id: positiveInt(raw.id) ?? 0,
    ...base,
    description: text(raw.description),
    count,
    totalCount: Math.max(nonNegativeInt(raw.total_count), count),
    children,
  };
}

export function normalizeGuideTopics(value: unknown): GuideTopics {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const topics = Array.isArray(raw.data) ? raw.data.map(t => normalizeTopic(t)).filter((t): t is GuideTopic => t !== null) : [];
  const levels: GuideLevel[] = [];
  if (Array.isArray(raw.levels)) {
    for (const item of raw.levels) {
      const base = term(item);
      if (base && !levels.some(l => l.slug === base.slug)) levels.push({ ...base, count: nonNegativeInt((item as Record<string, unknown>).count) });
    }
  }
  return { topics, levels };
}

export function normalizeGuideSitemap(value: unknown): GuideSitemapEntry[] {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  if (!Array.isArray(raw.data)) return [];
  const seen = new Set<string>();
  const out: GuideSitemapEntry[] = [];
  for (const item of raw.data) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const slug = text(entry.slug);
    if (!isGuideSlug(slug) || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ slug, updatedAt: isoDate(entry.updated_at) });
  }
  return out;
}

/* ------------------------------------------------- list params and links */

function firstParam(value: unknown): string {
  return Array.isArray(value) ? text(value[0]) : text(value);
}

/** `?konu=&seviye=&sayfa=` from the page URL; anything malformed is ignored. */
export function parseGuideListParams(search: Record<string, unknown> | null | undefined): GuideListParams {
  const topic = firstParam(search?.konu);
  const level = firstParam(search?.seviye);
  const pageRaw = firstParam(search?.sayfa);
  const page = /^\d{1,3}$/.test(pageRaw) ? Math.min(Math.max(Number(pageRaw), 1), 500) : 1;
  return { topic: isGuideSlug(topic) ? topic : null, level: isGuideSlug(level) ? level : null, page };
}

/** Site link for the list page; page 1 and empty filters are left out. */
export function guideListHref(params: Partial<GuideListParams>): string {
  const query = new URLSearchParams();
  if (params.topic) query.set("konu", params.topic);
  if (params.level) query.set("seviye", params.level);
  if (params.page && params.page > 1) query.set("sayfa", String(params.page));
  const qs = query.toString();
  return qs ? `/rehber?${qs}` : "/rehber";
}

/** Core list endpoint for the given filters. */
export function guideListApiUrl(params: Partial<GuideListParams>, perPage = GUIDE_PER_PAGE): string {
  const query = new URLSearchParams();
  if (params.topic) query.set("topic", params.topic);
  if (params.level) query.set("level", params.level);
  query.set("page", String(params.page && params.page > 1 ? params.page : 1));
  query.set("per_page", String(perPage));
  return `${GUIDE_API_BASE}/guides?${query.toString()}`;
}

export function guideApiUrl(slug: string): string {
  return `${GUIDE_API_BASE}/guides/${encodeURIComponent(slug)}`;
}

/** The topic and its parent (if it is a child topic) from the tree. */
export function findGuideTopic(topics: GuideTopic[], slug: string | null): { topic: GuideTopic; parent: GuideTopic | null } | null {
  if (!slug) return null;
  for (const topic of topics) {
    if (topic.slug === slug) return { topic, parent: null };
    for (const child of topic.children) {
      if (child.slug === slug) return { topic: child, parent: topic };
      const deeper = findGuideTopic(child.children, slug);
      if (deeper) return deeper;
    }
  }
  return null;
}

/**
 * Pages to show in the pager: first, last, current ±1, with `null` for a gap.
 * 1 … 4 5 6 … 12
 */
export function guidePageWindow(current: number, total: number): (number | null)[] {
  if (total <= 1) return [];
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  for (const page of sorted) {
    const last = out[out.length - 1];
    if (typeof last === "number" && page - last === 2) out.push(last + 1);
    else if (typeof last === "number" && page - last > 2) out.push(null);
    out.push(page);
  }
  return out;
}

/* ------------------------------------------------------------- sanitiser */

const VOID_TAGS = new Set(["br", "hr", "img", "col"]);
const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "del", "ins", "mark",
  "small", "sub", "sup", "code", "pre", "kbd", "abbr", "time", "blockquote", "cite", "q", "a", "span", "div",
  "ul", "ol", "li", "dl", "dt", "dd", "figure", "figcaption", "img", "iframe",
  "table", "caption", "colgroup", "col", "thead", "tbody", "tfoot", "tr", "th", "td",
]);
/** Elements removed together with everything inside them. */
const DROP_WITH_CONTENT = ["script", "style", "noscript", "template", "textarea", "select", "object", "embed", "svg", "math", "head", "title", "frameset", "applet"];
const GLOBAL_ATTRS = new Set(["class", "title", "lang", "dir"]);
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "rel", "target"]),
  img: new Set(["src", "alt", "width", "height", "loading"]),
  iframe: new Set(["src", "width", "height", "allow", "allowfullscreen", "loading", "referrerpolicy", "frameborder"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  td: new Set(["colspan", "rowspan"]),
  ol: new Set(["start", "reversed", "type"]),
  col: new Set(["span"]),
  colgroup: new Set(["span"]),
  time: new Set(["datetime"]),
  abbr: new Set(["title"]),
};
const IFRAME_HOSTS = new Set(["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"]);

function cleanUrl(value: string): string {
  // Entities and control/space characters are how "java&#x09;script:" sneaks through.
  return decodeEntities(value).replace(/[\u0000-\u0020\u007f-\u009f]+/g, "");
}

function safeHref(value: string): string | null {
  const url = cleanUrl(value);
  if (!url) return null;
  if (url.startsWith("#") || (url.startsWith("/") && !url.startsWith("//"))) return url;
  if (/^(https?:|mailto:)/i.test(url)) return url;
  return null;
}

function safeImageSrc(value: string): string | null {
  const url = cleanUrl(value);
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return httpsUrl(url);
}

/** Only https YouTube / Vimeo embeds, matching Core's allowlist. */
export function isAllowedIframeSrc(value: string): boolean {
  const url = httpsUrl(cleanUrl(value));
  if (!url) return false;
  const parsed = new URL(url);
  if (!IFRAME_HOSTS.has(parsed.hostname)) return false;
  return parsed.hostname === "player.vimeo.com" ? parsed.pathname.startsWith("/video/") : parsed.pathname.startsWith("/embed/");
}

const ATTR_RE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function rebuildAttributes(tag: string, rawAttrs: string): string | null {
  const allowed = TAG_ATTRS[tag];
  const out: string[] = [];
  let external = false;
  let blank = false;
  let hasSrc = false;
  for (const match of rawAttrs.matchAll(ATTR_RE)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (name.startsWith("on") || name === "style" || name === "id") continue;
    if (!GLOBAL_ATTRS.has(name) && !allowed?.has(name)) continue;
    if (out.some(attr => attr.startsWith(`${name}=`) || attr === name)) continue;

    let finalValue = decodeEntities(value);
    if (name === "href") {
      const href = safeHref(value);
      if (!href) continue;
      external = /^https?:/i.test(href) && !/^https:\/\/(www\.)?tariften\.com(\/|$)/i.test(href);
      finalValue = href;
    } else if (name === "src") {
      const src = tag === "iframe" ? (isAllowedIframeSrc(value) ? cleanUrl(value) : null) : safeImageSrc(value);
      if (!src) return null;
      hasSrc = true;
      finalValue = src;
    } else if (name === "target") {
      if (finalValue !== "_blank") continue;
      blank = true;
    } else if (name === "rel") {
      continue; // rebuilt below
    } else if (name === "allowfullscreen") {
      out.push("allowfullscreen");
      continue;
    } else if (["width", "height", "colspan", "rowspan", "span", "start"].includes(name)) {
      if (!/^\d{1,4}%?$/.test(finalValue)) continue;
    } else if (name === "class") {
      finalValue = finalValue.replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
      if (!finalValue) continue;
    }
    out.push(`${name}="${escapeHtml(finalValue)}"`);
  }
  if ((tag === "iframe" || tag === "img") && !hasSrc) return null;
  // Cited sites keep their link value; new tabs never get window.opener.
  if (tag === "a" && (external || blank)) out.push('rel="noopener noreferrer"');
  if (tag === "iframe" && !out.some(a => a.startsWith("loading="))) out.push("loading=\"lazy\"");
  if (tag === "img" && !out.some(a => a.startsWith("loading="))) out.push("loading=\"lazy\"");
  return out.length ? ` ${out.join(" ")}` : "";
}

/**
 * Defensive allowlist sanitiser for guide HTML. Core already runs
 * wp_kses_post; this second pass guarantees no script, style, inline event
 * handler, `javascript:` URL or non-YouTube/Vimeo iframe reaches the page.
 */
export function sanitizeGuideHtml(input: unknown): string {
  if (typeof input !== "string" || !input) return "";
  let html = input.replace(/<!--[\s\S]*?-->/g, "").replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, "").replace(/<![^>]*>|<\?[\s\S]*?\?>/g, "");
  for (const tag of DROP_WITH_CONTENT) {
    html = html.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, "gi"), "");
    html = html.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi"), "");
  }
  // Iframe fallback text is never shown; keep only the tag itself.
  html = html.replace(/<iframe\b([^>]*)>[\s\S]*?<\/iframe\s*>/gi, "<iframe$1>");

  return html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>|<|>/g, (whole, slash: string, rawTag: string, rawAttrs: string) => {
    if (whole === "<") return "&lt;";
    if (whole === ">") return "&gt;";
    let tag = rawTag.toLowerCase();
    if (tag === "h1") tag = "h2"; // the page owns the only h1
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (slash) return tag === "iframe" || VOID_TAGS.has(tag) ? "" : `</${tag}>`;
    const attrs = rebuildAttributes(tag, rawAttrs || "");
    if (attrs === null) return "";
    if (tag === "iframe") return `<iframe${attrs}></iframe>`;
    return `<${tag}${attrs}>`;
  });
}

/* ------------------------------------------- headings, TOC, FAQ, callouts */

const TR_MAP: Record<string, string> = { ç: "c", ğ: "g", ı: "i", "i\u0307": "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

/** URL-safe anchor id from a Turkish heading: "Bıçak nasıl bilenir?" → "bicak-nasil-bilenir". */
export function headingId(value: string): string {
  const id = value
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]|i\u0307/g, ch => TR_MAP[ch] ?? ch)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return id || "bolum";
}

const KEY_POINTS_TITLE = /^bu rehberde:?$/i;
const FAQ_TITLE = /^(sık(ça)? sorulan sorular|sss)$/i;

function normTitle(value: string): string {
  return value.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
}

/**
 * Sanitises the article and prepares it for reading:
 * - h2s get stable, unique ids; the TOC is built from them ("Bu rehberde" is
 *   left out: it is already the summary at the top);
 * - the "Bu rehberde" list becomes a calm key-points card;
 * - tables get a horizontally scrolling wrapper for phones;
 * - tip / warning labels lose the trailing colon (styled as a small label);
 * - the "Sık sorulan sorular" section is wrapped for styling and its h3 + answer
 *   pairs are returned for FAQPage JSON-LD.
 */
export function prepareGuideHtml(input: unknown): PreparedGuideHtml {
  let html = sanitizeGuideHtml(input);
  const toc: GuideTocItem[] = [];
  const used = new Set<string>();

  html = html.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi, (_, attrs: string, inner: string) => {
    const label = htmlToText(inner);
    if (!label) return "";
    const base = headingId(label);
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    if (!KEY_POINTS_TITLE.test(normTitle(label))) toc.push({ id, text: label });
    return `<h2 id="${id}"${attrs}>${inner}</h2>`;
  });

  html = html.replace(/<table\b[\s\S]*?<\/table>/gi, table => `<div class="gd-table-scroll" tabindex="0" role="region" aria-label="Tablo">${table}</div>`);

  html = html.replace(/<p class="(tariften-tip|tariften-warning)"([^>]*)>\s*<strong>([^<]*?)\s*:\s*<\/strong>\s*/gi,
    (_, kind: string, rest: string, label: string) => `<p class="${kind}"${rest}><strong class="gd-callout-label">${label}</strong> `);

  html = html.replace(/(<h2 id="[^"]+"[^>]*>([\s\S]*?)<\/h2>)\s*(<ul\b[^>]*>[\s\S]*?<\/ul>)/gi, (whole, heading: string, inner: string, list: string) =>
    KEY_POINTS_TITLE.test(normTitle(htmlToText(inner))) ? `<div class="gd-keypoints">${heading}${list}</div>` : whole);

  const faq: GuideFaqItem[] = [];
  const faqStart = [...html.matchAll(/<h2 id="[^"]+"[^>]*>([\s\S]*?)<\/h2>/gi)].find(m => FAQ_TITLE.test(normTitle(htmlToText(m[1]))));
  if (faqStart && faqStart.index !== undefined) {
    const start = faqStart.index;
    const afterHeading = start + faqStart[0].length;
    const nextH2 = html.slice(afterHeading).search(/<h2\b/i);
    const end = nextH2 === -1 ? html.length : afterHeading + nextH2;
    const body = html.slice(afterHeading, end);
    const parts = body.split(/(?=<h3\b)/i);
    for (const part of parts) {
      const q = part.match(/^<h3\b[^>]*>([\s\S]*?)<\/h3>([\s\S]*)$/i);
      if (!q) continue;
      const question = htmlToText(q[1]);
      const answer = htmlToText(q[2]);
      if (question && answer) faq.push({ question, answer });
    }
    html = `${html.slice(0, start)}<div class="gd-faq">${html.slice(start, end)}</div>${html.slice(end)}`;
  }

  return { html, toc, faq };
}

/* ------------------------------------------------------ display + JSON-LD */

export function guideDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" }).format(date);
}

/** Article + optional FAQPage + BreadcrumbList structured data for a guide. */
export function guideJsonLd(guide: Guide, faq: GuideFaqItem[]): Record<string, unknown>[] {
  const url = guide.seo.canonical;
  const image = guide.seo.ogImage?.url || guide.image;
  const topic = guide.topics[0] || null;
  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title.length > 110 ? `${guide.title.slice(0, 109)}…` : guide.title,
    description: guide.seo.description || guide.excerpt,
    inLanguage: "tr-TR",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    ...(image ? { image: [image] } : {}),
    ...(guide.publishedAt ? { datePublished: guide.publishedAt } : {}),
    ...(guide.updatedAt || guide.publishedAt ? { dateModified: guide.updatedAt || guide.publishedAt } : {}),
    author: guide.authorName ? { "@type": "Person", name: guide.authorName } : { "@type": "Organization", name: "Tariften", url: GUIDE_SITE_URL },
    publisher: { "@type": "Organization", name: "Tariften", url: GUIDE_SITE_URL, logo: { "@type": "ImageObject", url: `${GUIDE_SITE_URL}/logo.svg` } },
    ...(topic ? { articleSection: topic.name } : {}),
    isPartOf: { "@type": "CollectionPage", name: "Tariften Mutfak Rehberi", url: `${GUIDE_SITE_URL}/rehber` },
  };
  const crumbs = [
    { name: "Anasayfa", item: GUIDE_SITE_URL },
    { name: "Mutfak Rehberi", item: `${GUIDE_SITE_URL}/rehber` },
    ...(topic ? [{ name: topic.name, item: `${GUIDE_SITE_URL}${guideListHref({ topic: topic.slug })}` }] : []),
    { name: guide.title, item: url },
  ];
  const out: Record<string, unknown>[] = [article, {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.item })),
  }];
  if (faq.length > 0) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
    });
  }
  return out;
}

/** JSON for a <script type="application/ld+json">, safe against "</script>". */
export function jsonLdString(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
