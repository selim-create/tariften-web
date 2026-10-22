"use client";

import { useCallback, useState } from "react";
import { ArrowUpRight, BadgeCheck, Eye, Heart, MessageCircle, Play, UsersRound } from "lucide-react";
import type { RecipeSocialSource } from "@/types";
import {
  SOCIAL_PLATFORM_COPY, socialCapturedDate, socialCompactCount, socialCreatorLabel, socialOriginalUrl,
  socialPlayerUrl, socialProfileUrl, socialTrustedMetrics, type SocialMetricKey,
} from "@/lib/social-source";
import SocialPlatformIcon from "@/components/recipe/SocialPlatformIcon";
import SocialVideoDialog from "@/components/recipe/SocialVideoDialog";

const METRIC_ICON: Record<SocialMetricKey, typeof Eye> = {
  followers: UsersRound, views: Eye, likes: Heart, comments: MessageCircle,
};

/**
 * Editorial attribution with an import-time snapshot, not a live social
 * metrics widget: a calm, light row that suits the web page. Counts, profile
 * photos and creator identities must not be invented; unknown values stay
 * hidden. The video loads only in the player dialog, after the visitor asks.
 */
export default function SocialRecipeSourceCard({ source, recipeId }: { source: RecipeSocialSource; recipeId: number }) {
  const [watching, setWatching] = useState(false);
  const close = useCallback(() => setWatching(false), []);
  const copy = SOCIAL_PLATFORM_COPY[source.platform];
  if (!copy) return null;

  const { primary, handle, trustedHandle } = socialCreatorLabel(source);
  const profile = socialProfileUrl(source.platform, source.creator_profile_url, trustedHandle);
  const original = socialOriginalUrl(source.platform, source.url);
  const canPlay = Boolean(socialPlayerUrl(source.platform, source.video_id));
  const metrics = socialTrustedMetrics(source);
  const captured = metrics.length ? socialCapturedDate(source.metrics_captured_at) : null;
  const title = primary ?? `${copy.name} videosu`;

  return (
    <section aria-label="Tarifin orijinal kaynağı" className="mb-12 rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-white">
            <SocialPlatformIcon platform={source.platform} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Orijinal kaynak · {copy.name}</p>
            <p className="flex items-center gap-1 text-[15px] font-semibold text-slate-900">
              <span className="truncate">
                {profile && primary
                  ? <a href={profile} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-brand">{title}</a>
                  : title}
              </span>
              {source.creator_verified === true && (
                <BadgeCheck className="h-4 w-4 shrink-0 text-sky-500" aria-label="Doğrulanmış hesap" />
              )}
            </p>
            {handle && <p className="truncate text-[13px] text-gray-500">{handle}</p>}
            <p className="mt-0.5 text-[13px] text-gray-500">
              Tarif bu videodan aktarıldı; malzemeler ve adımlar Tariften&apos;de düzenlendi.
            </p>
          </div>
        </div>

        {metrics.length > 0 && (
          <div className="md:max-w-[280px]">
            <dl className="flex flex-wrap gap-x-5 gap-y-2">
              {metrics.map(m => {
                const Icon = METRIC_ICON[m.key];
                return (
                  <div key={m.key} className="min-w-0">
                    <dt className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Icon className="h-3 w-3 text-gray-400" aria-hidden />
                      {m.label}
                    </dt>
                    <dd className="text-[15px] font-semibold leading-5 text-slate-800 tabular-nums">{socialCompactCount(m.value)}</dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-1.5 text-[11px] leading-4 text-gray-400">
              {captured ? `${captured} tarihinde, ` : ""}Tariften&apos;e aktarıldığı anda alınan değerlerdir; güncel veya resmî hesap istatistiği değildir.
            </p>
          </div>
        )}

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canPlay && (
            <button type="button" onClick={() => setWatching(true)} aria-haspopup="dialog"
              className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden /> Videoyu izle
            </button>
          )}
          <a href={`/content-report?recipe=${recipeId}`}
            className="inline-flex h-10 items-center whitespace-nowrap rounded-xl border border-gray-200 px-3 text-xs font-medium text-slate-600 transition hover:border-gray-300 hover:text-brand">
            İçeriğe itiraz et
          </a>
          {original && (
            <a href={original} target="_blank" rel="noopener noreferrer nofollow"
              className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-200 px-3.5 text-sm font-semibold text-slate-700 transition hover:border-gray-300 hover:text-brand">
              {copy.at} aç <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          )}
        </div>
      </div>

      {canPlay && <SocialVideoDialog source={source} open={watching} onClose={close} />}
    </section>
  );
}
