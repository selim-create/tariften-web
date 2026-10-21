import type { BlogPost } from "@/types";

/**
 * Presentation helpers for WordPress posts. Everything shown is derived from
 * the post itself (title, content, embedded terms/author/media); reading time
 * is computed from the real word count.
 */

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", hellip: "…",
  ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»",
};

export function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

export function plainText(html: unknown): string {
  if (typeof html !== "string") return "";
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s*\[…\]\s*$/, "…")
    .replace(/\s+/g, " ")
    .trim();
}

export function postTitle(post: BlogPost): string {
  return plainText(post.title?.rendered);
}

export function postExcerpt(post: BlogPost): string {
  return plainText(post.excerpt?.rendered);
}

/** Minutes at ~200 words per minute, from the article's own text. */
export function readingMinutes(html: unknown): number | null {
  const words = plainText(html).split(" ").filter(Boolean).length;
  return words >= 80 ? Math.max(1, Math.round(words / 200)) : null;
}

export function postImage(post: BlogPost): { url: string; alt: string } | null {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media?.source_url) return null;
  return { url: media.source_url, alt: media.alt_text || postTitle(post) };
}

export function postCategory(post: BlogPost): { name: string; slug: string } | null {
  const groups = post._embedded?.["wp:term"] || [];
  for (const group of groups) {
    for (const term of group || []) {
      if (term?.taxonomy === "category" && term.name && !/^(genel|uncategorized|kategorisiz)$/i.test(term.slug || term.name)) {
        return { name: decodeEntities(term.name), slug: term.slug };
      }
    }
  }
  return null;
}

/** Author name when WordPress exposes a real one; never "admin". */
export function postAuthor(post: BlogPost): string | null {
  const name = post._embedded?.author?.[0]?.name?.trim();
  if (!name || /^(admin|administrator|wordpress)$/i.test(name)) return null;
  return decodeEntities(name);
}

export function postDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
