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

/** Turkish case endings and labels per platform ("TikTok'tan", "YouTube'da"). Same copy as the mobile app. */
export const SOCIAL_PLATFORM_COPY: Record<RecipeSocialSource["platform"], { name: string; label: string; from: string; at: string }> = {
  instagram: { name: "Instagram Reels", label: "Instagram", from: "Instagram'dan", at: "Instagram'da" },
  tiktok: { name: "TikTok", label: "TikTok", from: "TikTok'tan", at: "TikTok'ta" },
  youtube: { name: "YouTube", label: "YouTube", from: "YouTube'dan", at: "YouTube'da" },
};

/** Display name for the creator: their own name, else the @handle; the handle line only when both exist. */
export function socialCreatorLabel(source: RecipeSocialSource): { primary: string | null; handle: string | null; trustedHandle: string | null } {
  const trustedHandle = source.creator_handle && /^[A-Za-z0-9._-]{1,40}$/.test(source.creator_handle) ? source.creator_handle : null;
  const name = typeof source.creator_name === "string" && source.creator_name.trim() ? source.creator_name.trim().slice(0, 80) : null;
  return { primary: name ?? (trustedHandle ? `@${trustedHandle}` : null), handle: name && trustedHandle ? `@${trustedHandle}` : null, trustedHandle };
}

const METRICS_ORIGIN: Record<RecipeSocialSource["platform"], string> = {
  instagram: "public_instagram_extractor",
  tiktok: "public_tiktok_extractor",
  youtube: "public_youtube_data_api",
};

export type SocialMetricKey = "followers" | "views" | "likes" | "comments";

/** Import-time counts, shown only when their origin belongs to the same platform. Nothing is estimated. */
export function socialTrustedMetrics(source: RecipeSocialSource): { key: SocialMetricKey; label: string; value: number }[] {
  if (source.metrics_origin !== METRICS_ORIGIN[source.platform]) return [];
  const all: { key: SocialMetricKey; label: string; value: unknown }[] = [
    { key: "followers", label: source.platform === "youtube" ? "Abone" : "Takipçi", value: source.follower_count },
    { key: "views", label: "İzlenme", value: source.view_count },
    { key: "likes", label: "Beğeni", value: source.like_count },
    { key: "comments", label: "Yorum", value: source.comment_count },
  ];
  return all.filter((m): m is { key: SocialMetricKey; label: string; value: number } =>
    typeof m.value === "number" && Number.isSafeInteger(m.value) && m.value >= 0);
}

/** 2 800 000 → "2,8 Mn", 35 400 → "35,4 B" (Turkish short scale, same output as the app). */
export function socialCompactCount(value: number): string {
  return new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** YouTube's own still for the video; Instagram and TikTok publish none we can use. */
export function socialVideoPoster(source: Pick<RecipeSocialSource, "platform" | "video_id">): string | null {
  return source.platform === "youtube" && /^[A-Za-z0-9_-]{11}$/.test(source.video_id)
    ? `https://i.ytimg.com/vi/${source.video_id}/hqdefault.jpg` : null;
}

/** Reels, TikTok and Shorts are portrait; regular YouTube videos are landscape. */
export function socialIsPortrait(source: Pick<RecipeSocialSource, "platform" | "url">): boolean {
  if (source.platform !== "youtube") return true;
  return /^https:\/\/(?:www\.|m\.)?youtube\.com\/shorts\//.test(source.url || "");
}

/**
 * Player address used when the reader asks to watch. TikTok gets its bare
 * embed player (video only, no feed chrome); YouTube starts playing because
 * the reader just pressed play. Null when the id is not safe.
 */
export function socialPlayerUrl(platform: RecipeSocialSource["platform"], videoId: string): string | null {
  if (platform === "youtube") {
    return /^[A-Za-z0-9_-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=1&playsinline=1&modestbranding=1` : null;
  }
  if (platform === "tiktok") {
    return /^[0-9]{15,24}$/.test(videoId)
      ? `https://www.tiktok.com/player/v1/${videoId}?autoplay=1&rel=0&music_info=0&description=0&native_context_menu=0` : null;
  }
  return socialEmbedUrl(platform, videoId);
}

/** The original post, only on the platform's own https host. */
export function socialOriginalUrl(platform: RecipeSocialSource["platform"], url: unknown): string | null {
  if (typeof url !== "string") return null;
  const hosts: Record<RecipeSocialSource["platform"], RegExp> = {
    instagram: /^https:\/\/(?:www\.)?instagram\.com\//,
    tiktok: /^https:\/\/(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\//,
    youtube: /^https:\/\/(?:(?:www\.|m\.)?youtube\.com|youtu\.be)\//,
  };
  return hosts[platform]?.test(url) && url.length < 600 ? url : null;
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
