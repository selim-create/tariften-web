"use client";

import { useCallback, useState } from "react";
import { Play } from "lucide-react";
import type { RecipeSocialSource } from "@/types";
import { SOCIAL_PLATFORM_COPY, socialCreatorLabel, socialPlayerUrl } from "@/lib/social-source";
import SocialPlatformIcon from "@/components/recipe/SocialPlatformIcon";
import SocialVideoDialog from "@/components/recipe/SocialVideoDialog";

/**
 * Creator pill over the recipe photo, as in the app: play disc, platform
 * glyph and the creator's name. Opens the original video in place.
 */
export default function SocialHeroSourceButton({ source }: { source: RecipeSocialSource }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const copy = SOCIAL_PLATFORM_COPY[source.platform];
  if (!copy || !socialPlayerUrl(source.platform, source.video_id)) return null;
  const label = socialCreatorLabel(source).primary ?? `${copy.from} aktarıldı`;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
        aria-label={`Orijinal videoyu ${copy.at} izle`}
        className="absolute bottom-4 left-4 z-10 inline-flex h-10 max-w-[calc(100%-2rem)] items-center gap-2 rounded-full bg-[rgba(31,26,23,0.78)] py-1 pl-1 pr-4 text-white shadow-lg backdrop-blur-md transition hover:bg-[rgba(31,26,23,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fff] text-[#1f1a17]" aria-hidden>
          <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
        </span>
        <SocialPlatformIcon platform={source.platform} className="h-4 w-4 shrink-0" />
        <span className="truncate text-[13px] font-semibold">{label}</span>
      </button>
      <SocialVideoDialog source={source} open={open} onClose={close} />
    </>
  );
}
