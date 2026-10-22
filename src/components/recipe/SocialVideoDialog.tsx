"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, X } from "lucide-react";
import type { RecipeSocialSource } from "@/types";
import {
  SOCIAL_PLATFORM_COPY, socialCreatorLabel, socialIsPortrait, socialOriginalUrl, socialPlayerUrl,
} from "@/lib/social-source";
import SocialPlatformIcon from "@/components/recipe/SocialPlatformIcon";

/**
 * Full-screen player for an imported recipe's original video. The platform's
 * player loads only after the reader presses play; Esc, the close button or a
 * click on the backdrop closes it and returns focus. Portrait sources (Reels,
 * TikTok, Shorts) get a phone-shaped frame sized to the viewport instead of a
 * fixed 800px block, so the whole video is visible without scrolling.
 */
export default function SocialVideoDialog({ source, open, onClose }: {
  source: RecipeSocialSource; open: boolean; onClose: () => void;
}) {
  if (!open || typeof document === "undefined") return null;
  // Mounted only while open, so the loading state starts fresh every time.
  return <DialogBody source={source} onClose={onClose} />;
}

function DialogBody({ source, onClose }: { source: RecipeSocialSource; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const copy = SOCIAL_PLATFORM_COPY[source.platform];
  const player = socialPlayerUrl(source.platform, source.video_id);
  const original = socialOriginalUrl(source.platform, source.url);
  const portrait = socialIsPortrait(source);
  const { primary } = socialCreatorLabel(source);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [onClose]);

  if (!copy) return null;

  // Instagram's embed page carries its own header and footer around the video.
  const frame = source.platform === "instagram"
    ? "h-[min(84dvh,820px)] w-[min(92vw,420px)]"
    : portrait
      ? "aspect-[9/16] h-[min(80dvh,760px)] max-w-[92vw]"
      : "aspect-video w-[min(92vw,960px)]";

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`${copy.name} orijinal video`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#120f0d]/90 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-full flex-col items-center gap-3">
        <div className="flex w-full items-center justify-between gap-3 text-[#fff]">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[rgb(255_255_255/0.1)]">
              <SocialPlatformIcon platform={source.platform} className="h-4 w-4" />
            </span>
            <div className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold">{primary ?? `${copy.name} videosu`}</span>
              <span className="block text-[11px] text-[rgb(255_255_255/0.55)]">Orijinal video · {copy.name}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {original && (
              <a href={original} target="_blank" rel="noopener noreferrer nofollow"
                className="hidden h-9 items-center gap-1 rounded-full border border-[rgb(255_255_255/0.22)] px-3.5 text-xs font-semibold transition hover:border-[rgb(255_255_255/0.5)] sm:inline-flex">
                {copy.at} aç <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Videoyu kapat"
              className="grid h-9 w-9 place-items-center rounded-full bg-[#fff] text-[#1f1a17] transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff]">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl bg-[#000] shadow-2xl ring-1 ring-[rgb(255_255_255/0.08)] ${frame}`}>
          {player ? (
            <>
              {!loaded && (
                <div className="absolute inset-0 grid place-items-center" aria-hidden>
                  <span className="h-9 w-9 animate-spin rounded-full border-2 border-[rgb(255_255_255/0.2)] border-t-[#fff]" />
                </div>
              )}
              <iframe
                src={player}
                title={`${copy.name} orijinal video`}
                onLoad={() => setLoaded(true)}
                referrerPolicy="strict-origin-when-cross-origin"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className={`relative h-full w-full border-0 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
              />
            </>
          ) : (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-[rgb(255_255_255/0.7)]">
              Bu video burada oynatılamıyor.
            </div>
          )}
        </div>

        {original && (
          <span className="text-center text-xs text-[rgb(255_255_255/0.55)]">
            Video açılmıyorsa{" "}
            <a href={original} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-[#fff] underline-offset-2 hover:underline">
              {copy.from} izle
            </a>
          </span>
        )}
      </div>
    </div>,
    document.body,
  );
}
