"use client";

import { useState } from "react";
import { ArrowUpRight, CheckCircle2, ExternalLink, Instagram, Play, Video, Youtube } from "lucide-react";
import type { RecipeSocialSource } from "@/types";

const labels = { instagram: "Instagram Reels", youtube: "YouTube" } as const;

/**
 * Editorial attribution, not a social metrics widget. Counts, profile photos
 * and creator identities must not be invented or scraped from AI output.
 * The video is loaded only after the visitor requests playback.
 */
export default function SocialRecipeSourceCard({ source }: { source: RecipeSocialSource }) {
  const [watching, setWatching] = useState(false);
  const youtube = source.platform === "youtube";
  const platform = labels[source.platform];
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

  return (
    <section aria-label="Tarifin sosyal medya kaynağı"
      className="relative mb-10 overflow-hidden rounded-[30px] border border-[#eaded7] bg-[#fff9f5] shadow-[0_18px_52px_rgba(64,42,30,0.065)]">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-36 h-80 w-80 rounded-full bg-[#fbe7dc] opacity-75 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-36 left-16 h-64 w-64 rounded-full bg-[#f0e7da] opacity-45 blur-3xl" />
      <div className="relative grid gap-0 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="flex flex-col justify-center px-6 py-8 sm:px-9 lg:py-10">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f1d7c9] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#bb5344]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e45442]" />
              Tarifin orijinal kaynağı
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#e9e0d6] px-3 py-1.5 text-[10px] font-semibold text-[#726b65]">
              <CheckCircle2 className="h-3 w-3" /> Kaynak bağlantısı
            </span>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[#202b29] text-white shadow-[0_6px_16px_rgba(17,39,34,0.15)]">
              {youtube ? <Youtube className="h-6 w-6" /> : <Instagram className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.02em] text-[#82756c]">{platform} üzerinden aktarıldı</p>
              {trusted ? (
                profile
                  ? <a href={profile} target="_blank" rel="noopener noreferrer nofollow"
                      className="font-heading text-lg font-extrabold text-[#23372c] hover:text-[#d75142]">@{trusted}</a>
                  : <p className="font-heading text-lg font-extrabold text-[#23372c]">{trusted}</p>
              ) : (
                <p className="font-heading text-lg font-extrabold text-[#23372c]">Orijinal paylaşım</p>
              )}
            </div>
          </div>

          <h2 className="max-w-xl font-heading text-[25px] font-extrabold leading-[1.25] tracking-[-0.035em] text-[#202e27] sm:text-[30px]">
            Bu tarifin hikâyesi bir videoyla başladı.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-[#736e69]">
            İlham veren orijinal videoyu izleyebilir, ardından Tariften&apos;de
            düzenlenmiş malzeme listesini ve adım adım hazırlanışını takip edebilirsin.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href={source.url} target="_blank" rel="noopener noreferrer nofollow"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#e35143] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(220,79,62,0.18)] transition hover:bg-[#c94237] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e35143]">
              Orijinal videoyu aç <ArrowUpRight className="h-4 w-4" />
            </a>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#79746e]">
              <ExternalLink className="h-3.5 w-3.5" /> Kaynak platformda açılır
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:pl-0">
          <div className="relative mx-auto flex h-full min-h-[245px] w-full max-w-[310px] overflow-hidden rounded-[24px] border border-white/15 bg-[#172522] shadow-[0_14px_34px_rgba(20,33,28,0.2)]">
            {watching && embed ? (
              <iframe
                src={embed}
                title={`${platform} orijinal video`}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <button type="button" onClick={() => setWatching(true)} disabled={!embed}
                aria-label={`${platform} videosunu oynat`}
                className="group relative flex h-full min-h-[245px] w-full flex-col items-center justify-center overflow-hidden px-6 text-center text-white focus-visible:outline-2 focus-visible:outline-offset-[-5px] focus-visible:outline-white">
                <div aria-hidden className="pointer-events-none absolute -left-24 -top-16 h-64 w-64 rounded-full bg-[#8e564a]/70 blur-[65px]" />
                <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-[#46735c]/50 blur-[75px]" />
                <div className="relative mb-4 grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-white/15 backdrop-blur-xl transition group-hover:scale-110">
                  <Play className="h-6 w-6 translate-x-0.5 fill-white" />
                </div>
                <div className="relative text-[10px] font-bold uppercase tracking-[0.22em] text-[#e9ccbb]">Kaynağı izle</div>
                <p className="relative mt-2 max-w-[200px] font-heading text-lg font-bold leading-snug">
                  {platform} videosu
                </p>
                <div className="relative mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] text-white/80">
                  <Video className="h-3.5 w-3.5" /> Oynatmak için dokun
                </div>
              </button>
            )}
          </div>
          {watching && (
            <a href={source.url} target="_blank" rel="noopener noreferrer nofollow"
              className="mt-3 flex justify-center gap-1 text-xs font-semibold text-[#bb5344] hover:underline">
              Video açılmıyorsa {platform} üzerinden izle <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
