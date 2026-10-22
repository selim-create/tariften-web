import type { RecipeSocialSource } from "@/types";
import { SOCIAL_PLATFORM_COPY } from "@/lib/social-source";
import SocialPlatformIcon from "@/components/recipe/SocialPlatformIcon";

/** Decorative overlay only: source URLs and creator attribution stay in the source card. */
export default function SocialPlatformBadge({ source }: { source?: RecipeSocialSource | null }) {
  if (!source) return null;
  const copy = SOCIAL_PLATFORM_COPY[source.platform];
  if (!copy) return null;
  return (
    <span title={copy.label} aria-label={copy.label}
      className="pointer-events-none absolute bottom-3 right-3 z-10 inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-white/20 bg-slate-950/85 px-2 text-white shadow-lg backdrop-blur-sm">
      <SocialPlatformIcon platform={source.platform} className={source.platform === "youtube" ? "h-5 w-5" : "h-4 w-4"} />
      <span className="sr-only">Bu tarif {copy.label} videosundan aktarıldı</span>
    </span>
  );
}
