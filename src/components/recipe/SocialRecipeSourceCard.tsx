"use client";

import { useState } from "react";
import { ArrowUpRight, Eye, Heart, Instagram, Play, UsersRound, X, Youtube } from "lucide-react";
import type { RecipeSocialSource } from "@/types";

const platforms = {
  instagram: { name: "Instagram Reels", from: "Instagram Reels'ten", open: "Instagram'da aç" },
  youtube: { name: "YouTube", from: "YouTube'dan", open: "YouTube'da aç" },
} as const;

/**
 * Editorial attribution, not a social metrics widget. Counts, profile photos
 * and creator identities must not be invented or scraped from AI output.
 * The video is loaded only after the visitor requests playback.
 */
export default function SocialRecipeSourceCard({ source }: { source: RecipeSocialSource }) {
  const [watching, setWatching] = useState(false);
  const youtube = source.platform === "youtube";
  const platform = platforms[source.platform] ?? platforms.instagram;
  const videoId = /^[A-Za-z0-9_-]{5,64}$/.test(source.video_id) ? source.video_id : "";
  const embed = videoId
    ? (youtube
      ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
      : `https://www.instagram.com/reel/${videoId}/embed/`)
    : null;
  const trusted = source.creator_handle && /^[A-Za-z0-9._-]{1,40}$/.test(source.creator_handle)
    ? source.creator_handle : null;
  const profile = trusted
    ? (youtube ? null : `https://www.instagram.com/${trusted}/`)
    : null;
  const publicMetrics = source.metrics_origin === "public_instagram_extractor";
  const counts = publicMetrics ? [
    { label: "izlenme", value: source.view_count, icon: Eye },
    { label: "beğeni", value: source.like_count, icon: Heart },
    { label: "takipçi", value: source.follower_count, icon: UsersRound },
  ].filter((metric): metric is { label: string; value: number; icon: typeof Eye } =>
    typeof metric.value === "number" && Number.isSafeInteger(metric.value) && metric.value >= 0) : [];
  const countText = (value: number) => new Intl.NumberFormat("tr-TR", {
    notation: "compact", maximumFractionDigits: 1,
  }).format(value);
  const PlatformIcon = youtube ? Youtube : Instagram;

  return (
    <section aria-label="Tarifin orijinal kaynağı" className="mb-12 rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-white">
            <PlatformIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Orijinal kaynak</p>
            <p className="truncate text-[15px] font-semibold text-slate-900">
              {trusted ? (
                profile
                  ? <a href={profile} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-brand">@{trusted}</a>
                  : trusted
              ) : `${platform.name} videosu`}
            </p>
            <p className="mt-0.5 text-[13px] text-gray-500">
              Tarif bu videodan aktarıldı; malzemeler ve adımlar Tariften&apos;de düzenlendi.
            </p>
          </div>
        </div>

        {counts.length > 0 && (
          <div className="md:max-w-[240px]">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-gray-500">
              {counts.map(metric => (
                <li key={metric.label} className="flex items-center gap-1.5">
                  <metric.icon className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                  <span className="font-semibold text-slate-800 tabular-nums">{countText(metric.value)}</span> {metric.label}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-[11px] leading-4 text-gray-400">
              Aktarım sırasında alınmış değerlerdir; güncel veya resmî hesap istatistiği değildir.
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
          <a href={source.url} target="_blank" rel="noopener noreferrer nofollow"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 text-sm font-semibold text-slate-700 transition hover:border-gray-300 hover:text-brand">
            {platform.open} <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>

      {watching && embed && (
        <div className="border-t border-gray-100 p-4 sm:p-5">
          <div className={`mx-auto overflow-hidden rounded-xl bg-slate-900 ${youtube ? "aspect-video max-w-2xl" : "aspect-[9/16] max-w-[340px]"}`}>
            <iframe
              src={embed}
              title={`${platform.name} orijinal video`}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="h-full w-full border-0"
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
