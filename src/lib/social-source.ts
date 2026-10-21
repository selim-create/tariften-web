import type { RecipeSocialSource } from "@/types";

/** Profile links are shown only on the platform's own host, in canonical form. */
const PROFILE_PATTERN: Record<RecipeSocialSource["platform"], RegExp> = {
  instagram: /^https:\/\/www\.instagram\.com\/[A-Za-z0-9._]{1,30}\/$/,
  tiktok: /^https:\/\/www\.tiktok\.com\/@[A-Za-z0-9._]{1,30}$/,
  youtube: /^https:\/\/www\.youtube\.com\/(?:@[A-Za-z0-9._-]{3,30}|channel\/UC[A-Za-z0-9_-]{22})$/,
};

/**
 * Creator profile link: the stored canonical URL when valid for the platform,
 * otherwise derived from a valid Instagram/TikTok username. YouTube profiles
 * are never derived from a handle.
 */
export function socialProfileUrl(
  platform: RecipeSocialSource["platform"],
  stored: string | null | undefined,
  handle: string | null,
): string | null {
  const pattern = PROFILE_PATTERN[platform];
  if (typeof stored === "string" && pattern && pattern.test(stored)) return stored;
  if (!handle || !/^[A-Za-z0-9._]{1,30}$/.test(handle)) return null;
  if (platform === "instagram") return `https://www.instagram.com/${handle}/`;
  if (platform === "tiktok") return `https://www.tiktok.com/@${handle}`;
  return null;
}

/** "21 Ekim 2026" (Europe/Istanbul) from an ISO capture time; null when invalid. */
export function socialCapturedDate(value: string | null | undefined): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul",
  }).format(date);
}

/** Click-to-load player URL for a validated video id; null when the id is not safe. */
export function socialEmbedUrl(platform: RecipeSocialSource["platform"], videoId: string): string | null {
  if (platform === "youtube") {
    return /^[A-Za-z0-9_-]{11}$/.test(videoId) ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : null;
  }
  if (platform === "tiktok") {
    return /^[0-9]{15,24}$/.test(videoId) ? `https://www.tiktok.com/embed/v2/${videoId}` : null;
  }
  if (platform === "instagram") {
    return /^[A-Za-z0-9_-]{5,64}$/.test(videoId) ? `https://www.instagram.com/reel/${videoId}/embed/` : null;
  }
  return null;
}
