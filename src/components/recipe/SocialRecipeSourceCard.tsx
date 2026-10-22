"use client";

import { useCallback, useState } from "react";
import { ArrowUpRight, BadgeCheck, Eye, Heart, MessageCircle, Play, UsersRound } from "lucide-react";
import type { RecipeSocialSource } from "@/types";
import {
  SOCIAL_PLATFORM_COPY, socialCapturedDate, socialCompactCount, socialCreatorLabel, socialOriginalUrl,
  socialPlayerUrl, socialProfileUrl, socialTrustedMetrics, socialVideoPoster, type SocialMetricKey,
} from "@/lib/social-source";
import SocialPlatformIcon from "@/components/recipe/SocialPlatformIcon";
import SocialVideoDialog from "@/components/recipe/SocialVideoDialog";

const METRIC_ICON: Record<SocialMetricKey, typeof Eye> = {
  followers: UsersRound, views: Eye, likes: Heart, comments: MessageCircle,
};

/**
 * Credits the creator of an imported recipe — the same card as the mobile
 * app: who made it, where, a way to watch the original, and the audience
 * numbers as they were at import time. Unknown values stay hidden; nothing is
 * estimated and no profile photo is invented (the monogram comes from the
 * name). Built from div/span on purpose: the global dark-mode rules repaint
 * every <section> and <p>, and this card is already dark.
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
  const poster = socialVideoPoster(source);
  const title = primary ?? `${copy.name} videosu`;
  const monogram = title.replace(/^@/, "").charAt(0).toLocaleUpperCase("tr-TR");
  const watch = () => (canPlay ? setWatching(true) : original && window.open(original, "_blank", "noopener,noreferrer"));

  const creatorInner = (
    <>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand font-heading text-xl font-bold text-white" aria-hidden>
        {monogram}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-heading text-lg font-bold leading-6 text-white sm:text-xl">{title}</span>
          {source.creator_verified === true && (
            <BadgeCheck className="h-4.5 w-4.5 shrink-0 text-[#7cc4ff]" aria-label="Doğrulanmış hesap" />
          )}
        </span>
        {handle && <span className="block truncate text-[13px] text-[rgb(255_255_255/0.6)]">{handle}</span>}
      </span>
      {profile && (
        <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-[rgb(255_255_255/0.25)] px-3 text-xs font-semibold text-white transition group-hover:border-[rgb(255_255_255/0.6)]">
          Profil <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}
    </>
  );

  return (
    <aside aria-label="Tarifin orijinal kaynağı"
      className={`mb-12 overflow-hidden rounded-[28px] bg-[#1f1a17] text-white shadow-[0_24px_60px_-30px_rgba(31,26,23,0.55)] ${poster ? "md:grid md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]" : ""}`}>
      {poster && (
        <button type="button" onClick={watch} aria-label={`Orijinal videoyu ${copy.at} izle`}
          className="group relative block h-52 w-full overflow-hidden bg-[#2b2420] md:h-full md:min-h-[260px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
          <span className="absolute inset-0 bg-gradient-to-b from-[rgba(31,26,23,0.05)] to-[rgba(31,26,23,0.75)]" aria-hidden />
          <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[rgb(255_255_255/0.94)] text-[#1f1a17] shadow-xl transition group-hover:scale-105" aria-hidden>
            <Play className="ml-1 h-6 w-6 fill-current" />
          </span>
        </button>
      )}

      <div className="flex flex-col gap-4 p-5 sm:p-6 md:p-7">
        <span className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#f3b8ad]">
          <SocialPlatformIcon platform={source.platform} className="h-3.5 w-3.5" />
          Orijinal kaynak · {copy.name}
        </span>

        {profile ? (
          <a href={profile} target="_blank" rel="noopener noreferrer nofollow"
            aria-label={`${title} profilini ${copy.at} aç`}
            className="group flex items-center gap-3.5 rounded-2xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-white">
            {creatorInner}
          </a>
        ) : (
          <div className="flex items-center gap-3.5">{creatorInner}</div>
        )}

        <span className="block text-sm leading-relaxed text-[rgb(255_255_255/0.7)]">
          Bu tarif {copy.from} aktarıldı; malzemeler ve adımlar Tariften&apos;de düzenlendi.
        </span>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          {metrics.length > 0 && (
            <dl className="flex flex-1 overflow-hidden rounded-[20px] border border-[rgb(255_255_255/0.12)] bg-[rgb(255_255_255/0.07)]">
              {metrics.map((m, i) => {
                const Icon = METRIC_ICON[m.key];
                return (
                  <div key={m.key} className={`flex min-w-0 flex-1 flex-col-reverse items-center justify-center px-1 py-3 ${i > 0 ? "border-l border-[rgb(255_255_255/0.14)]" : ""}`}>
                    <dt className="mt-0.5 flex items-center gap-1 text-[11px] text-[rgb(255_255_255/0.6)]">
                      <Icon className="h-3 w-3" aria-hidden /> {m.label}
                    </dt>
                    <dd className="font-heading text-[17px] font-bold tabular-nums text-white">{socialCompactCount(m.value)}</dd>
                  </div>
                );
              })}
            </dl>
          )}

          <div className={`flex gap-2.5 ${metrics.length ? "lg:w-[340px] lg:shrink-0" : "sm:max-w-[400px]"}`}>
            {(canPlay || original) && (
              <button type="button" onClick={watch} aria-haspopup="dialog"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#fff] px-4 text-sm font-semibold text-[#1f1a17] transition hover:bg-[#f6efe8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff]">
                <Play className="h-4 w-4 fill-current" aria-hidden /> Videoyu izle
              </button>
            )}
            {original && (
              <a href={original} target="_blank" rel="noopener noreferrer nofollow"
                className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[rgb(255_255_255/0.25)] px-4 text-sm font-semibold text-white transition hover:border-[rgb(255_255_255/0.6)]">
                {copy.at} aç <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            )}
          </div>
        </div>

        <span className="flex flex-col gap-1.5 text-[11px] leading-4 text-[rgb(255_255_255/0.45)] sm:flex-row sm:items-center sm:justify-between">
          <span>
            {metrics.length > 0
              ? `${captured ? `${captured} tarihinde, ` : ""}Tariften'e aktarıldığı anki değerler. Canlı istatistik değildir.`
              : null}
          </span>
          <a href={`/content-report?recipe=${recipeId}`}
            className="shrink-0 font-medium text-[rgb(255_255_255/0.6)] underline-offset-2 transition hover:text-white hover:underline">
            İçeriğe itiraz et
          </a>
        </span>
      </div>

      {canPlay && <SocialVideoDialog source={source} open={watching} onClose={close} />}
    </aside>
  );
}
