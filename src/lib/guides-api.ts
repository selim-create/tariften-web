import { cache } from "react";
import {
  guideApiUrl,
  guideListApiUrl,
  GUIDE_API_BASE,
  GUIDE_PER_PAGE,
  isGuideSlug,
  normalizeGuide,
  normalizeGuideList,
  normalizeGuideSitemap,
  normalizeGuideTopics,
  type Guide,
  type GuideList,
  type GuideListParams,
  type GuideSitemapEntry,
  type GuideTopics,
} from "@/lib/guides";

/**
 * Server-side reads of the public Mutfak Rehberi endpoints. The responses are
 * the same for everyone (Core sends public, s-maxage=600), so they are cached
 * by Next with time-based revalidation like the other public reads in api.ts.
 */
const REVALIDATE = 600;

async function getJson(url: string, revalidate = REVALIDATE): Promise<{ status: number; body: unknown } | null> {
  try {
    const res = await fetch(url, { next: { revalidate, tags: ["guides"] }, headers: { Accept: "application/json" } });
    const body = res.ok || res.status === 404 ? await res.json().catch(() => null) : null;
    return { status: res.status, body };
  } catch (error) {
    console.error("[guides] fetch failed:", url, error);
    return null;
  }
}

/** Guide list for the filters; null when Core cannot be reached. */
export async function getGuides(params: Partial<GuideListParams>, perPage = GUIDE_PER_PAGE): Promise<GuideList | null> {
  const res = await getJson(guideListApiUrl(params, perPage));
  if (!res || res.status !== 200) return null;
  return normalizeGuideList(res.body, params.page || 1, perPage);
}

/**
 * One guide. `null` only for a real 404 (`guide_not_found`), so the page can
 * call notFound(); any other failure throws, so an outage never gets cached
 * as a missing page.
 */
export const getGuide = cache(async (slug: string): Promise<Guide | null> => {
  if (!isGuideSlug(slug)) return null;
  const res = await getJson(guideApiUrl(slug));
  if (res?.status === 404) return null;
  if (!res || res.status !== 200) throw new Error(`guide_unavailable:${slug}`);
  return normalizeGuide(res.body);
});

/** Topic tree and levels; empty when Core cannot be reached. */
export const getGuideTopics = cache(async (): Promise<GuideTopics> => {
  const res = await getJson(`${GUIDE_API_BASE}/guides/topics`, 1800);
  return normalizeGuideTopics(res?.status === 200 ? res.body : null);
});

/** Every visible guide for sitemap.xml; empty (never throws) on errors. */
export async function getGuideSitemap(): Promise<GuideSitemapEntry[]> {
  const res = await getJson(`${GUIDE_API_BASE}/guides/sitemap`, 3600);
  return res?.status === 200 ? normalizeGuideSitemap(res.body) : [];
}
