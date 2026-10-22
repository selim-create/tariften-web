import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import type { RecipeSocialSource } from "@/types";
import { SOCIAL_PLATFORM_COPY, socialIsPortrait, socialOriginalUrl, socialPlayerUrl } from "@/lib/social-source";
import SocialPlatformIcon from "@/components/recipe/SocialPlatformIcon";

export const metadata: Metadata = {
  title: "Orijinal video",
  robots: { index: false, follow: false },
};

type Params = { platform: string; id: string };

/**
 * Player page the mobile app opens in its in-app browser sheet: a dark,
 * full-screen frame around the platform's own player instead of the raw
 * embed page. Only validated ids reach an iframe; `u` (the original post) is
 * shown as a fallback link only when it is on the platform's own host.
 */
export default async function SocialVideoPage({ params, searchParams }: {
  params: Promise<Params>; searchParams: Promise<{ u?: string; n?: string }>;
}) {
  const { platform, id } = await params;
  const { u, n } = await searchParams;
  if (!(platform in SOCIAL_PLATFORM_COPY)) notFound();
  const key = platform as RecipeSocialSource["platform"];
  const player = socialPlayerUrl(key, id);
  if (!player) notFound();

  const copy = SOCIAL_PLATFORM_COPY[key];
  const original = socialOriginalUrl(key, u);
  const portrait = socialIsPortrait({ platform: key, url: original ?? "" });
  const creator = typeof n === "string" && n.trim() ? n.trim().slice(0, 80) : null;
  const frame = key === "instagram"
    ? "h-[min(82dvh,820px)] w-[min(94vw,420px)]"
    : portrait ? "aspect-[9/16] h-[min(80dvh,760px)] max-w-[94vw]" : "aspect-video w-[min(94vw,960px)]";

  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-4 bg-[#120f0d] px-3 py-5 text-white">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[rgb(255_255_255/0.1)]">
          <SocialPlatformIcon platform={key} className="h-4 w-4" />
        </span>
        <span className="leading-tight">
          <span className="block max-w-[70vw] truncate text-sm font-semibold">{creator ?? `${copy.name} videosu`}</span>
          <span className="block text-[11px] text-[rgb(255_255_255/0.55)]">Orijinal video · {copy.name}</span>
        </span>
      </div>

      <div className={`relative overflow-hidden rounded-2xl bg-[#000] ring-1 ring-[rgb(255_255_255/0.08)] ${frame}`}>
        <span className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-[rgb(255_255_255/0.2)] border-t-[#fff]" aria-hidden />
        <iframe
          src={player}
          title={`${copy.name} orijinal video`}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="relative h-full w-full border-0"
        />
      </div>

      {original && (
        <a href={original} target="_blank" rel="noopener noreferrer nofollow"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[rgb(255_255_255/0.25)] px-4 text-xs font-semibold">
          {copy.at} aç <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </a>
      )}
    </div>
  );
}
