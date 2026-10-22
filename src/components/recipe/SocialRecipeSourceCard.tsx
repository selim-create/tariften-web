"use client";

import { useState } from "react";
import type { SVGProps } from "react";
import { ArrowUpRight, Eye, Heart, Instagram, MessageCircle, Play, UsersRound, X, Youtube } from "lucide-react";
import type { RecipeSocialSource } from "@/types";
import { socialCapturedDate, socialEmbedUrl, socialProfileUrl } from "@/lib/social-source";

/** TikTok glyph (lucide has no TikTok icon). Path: Simple Icons, CC0. */
function TikTokIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

const platforms = {
  instagram: { name: "Instagram Reels", from: "Instagram Reels'ten", open: "Instagram'da aç", icon: Instagram },
  tiktok: { name: "TikTok", from: "TikTok'tan", open: "TikTok'ta aç", icon: TikTokIcon },
  youtube: { name: "YouTube", from: "YouTube'dan", open: "YouTube'da aç", icon: Youtube },
} as const;

/**
 * Editorial attribution with an import-time snapshot, not a live social
 * metrics widget. Counts, profile photos and creator identities must not be
 * invented or scraped from AI output; unknown values stay hidden.
 * The video is loaded only after the visitor requests playback.
 */
export default function SocialRecipeSourceCard({ source, recipeId }: { source: RecipeSocialSource; recipeId: number }) {
  const [watching, setWatching] = useState(false);
  const youtube = source.platform === "youtube";
  const platform = platforms[source.platform] ?? platforms.instagram;
  const embed = socialEmbedUrl(source.platform, source.video_id);
  const trusted = source.creator_handle && /^[A-Za-z0-9._-]{1,40}$/.test(source.creator_handle)
    ? source.creator_handle : null;
  const name = typeof source.creator_name === "string" && source.creator_name.trim()
    ? source.creator_name.trim().slice(0, 80) : null;
  const profile = socialProfileUrl(source.platform, source.creator_profile_url, trusted);
  // Each platform has exactly one trusted snapshot origin.
  const publicMetrics =
    (source.platform === "instagram" && source.metrics_origin === "public_instagram_extractor") ||
    (source.platform === "tiktok" && source.metrics_origin === "public_tiktok_extractor") ||
    (source.platform === "youtube" && source.metrics_origin === "public_youtube_data_api");
  const counts = publicMetrics ? [
    { label: "Takipçi", value: source.follower_count, icon: UsersRound },
    { label: "İzlenme", value: source.view_count, icon: Eye },
    { label: "Beğeni", value: source.like_count, icon: Heart },
    { label: "Yorum", value: source.comment_count, icon: MessageCircle },
  ].filter((metric): metric is { label: string; value: number; icon: typeof Eye } =>
    typeof metric.value === "number" && Number.isSafeInteger(metric.value) && metric.value >= 0) : [];
  const countText = (value: number) => new Intl.NumberFormat("tr-TR", {
    notation: "compact", maximumFractionDigits: 1,
  }).format(value);
  const captured = publicMetrics ? socialCapturedDate(source.metrics_captured_at) : null;
  const PlatformIcon = platform.icon;
  const primary = name ?? (trusted ? `@${trusted}` : `${platform.name} videosu`);

  return (
    <section aria-label="Tarifin orijinal kaynağı" className="mb-12 rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-white">
            <PlatformIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Orijinal kaynak · {platform.name}</p>
            <p className="truncate text-[15px] font-semibold text-slate-900">
              {profile && (name || trusted)
                ? <a href={profile} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-brand">{primary}</a>
                : primary}
            </p>
            {name && trusted && (
              <p className="truncate text-[13px] text-gray-500">@{trusted}</p>
            )}
            <p className="mt-0.5 text-[13px] text-gray-500">
              Tarif bu videodan aktarıldı; malzemeler ve adımlar Tariften&apos;de düzenlendi.
            </p>
          </div>
        </div>

        {counts.length > 0 && (
          <div className="md:max-w-[280px]">
            <dl className="flex flex-wrap gap-x-5 gap-y-2">
              {counts.map(metric => (
                <div key={metric.label} className="min-w-0">
                  <dt className="flex items-center gap-1 text-[11px] text-gray-500">
                    <metric.icon className="h-3 w-3 text-gray-400" aria-hidden />
                    {metric.label}
                  </dt>
                  <dd className="text-[15px] font-semibold leading-5 text-slate-800 tabular-nums">{countText(metric.value)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-1.5 text-[11px] leading-4 text-gray-400">
              {captured ? `${captured} tarihinde, ` : ""}Tariften&apos;e aktarıldığı anda alınan değerlerdir; güncel veya resmî hesap istatistiği değildir.
            </p>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {embed && (
            <button type="button" onClick={() => setWatching(v => !v)} aria-expanded={watching}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">
              {watching
                ? <><X className="h-4 w-4" aria-hidden /> Videoyu kapat</>
                : <><Play className="h-3.5 w-3.5 fill-current" aria-hidden /> Videoyu izle</>}
            </button>
          )}
          <a href={`/content-report?recipe=${recipeId}`}
            className="inline-flex h-10 items-center rounded-xl border border-gray-200 px-3 text-xs font-medium text-slate-600 transition hover:border-gray-300 hover:text-brand">
            İçeriğe itiraz et
          </a>
          <a href={source.url} target="_blank" rel="noopener noreferrer nofollow"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 text-sm font-semibold text-slate-700 transition hover:border-gray-300 hover:text-brand">
            {platform.open} <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>

      {watching && embed && (
        <div className="border-t border-gray-100 p-4 sm:p-5">
          <div className={`mx-auto overflow-hidden rounded-xl bg-white ${youtube ? "aspect-video max-w-2xl" : "w-full max-w-[390px]"}`}>
            <iframe
              src={embed}
              title={`${platform.name} orijinal video`}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className={youtube ? "h-full w-full border-0" : "block h-[740px] w-full border-0 sm:h-[800px]"}
            />
          </div>
          <p className="mt-3 text-center text-xs text-gray-500">
            Video açılmıyorsa{" "}
            <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-brand hover:underline">
              {platform.from} izle
            </a>.
          </p>
        </div>
      )}
    </section>
  );
}
