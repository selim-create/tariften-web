import Link from "next/link";
import Image from "next/image";
import { Clock3 } from "lucide-react";
import type { GuideSummary } from "@/lib/guides";
import { FOCUS, LevelBadge, TopicIcon } from "./GuideBits";

/**
 * One guide in the list: photo or a calm cream tile with the topic's icon,
 * then topic, title, a two-line excerpt and the level / reading time.
 */
export default function GuideCard({ guide, topicSlug }: { guide: GuideSummary; topicSlug?: string | null }) {
  // While a topic filter is on, name that topic on the card when the guide has it.
  const topic = guide.topics.find(t => t.slug === topicSlug) || guide.topics[0] || null;

  return (
    <Link href={`/rehber/${guide.slug}`}
      className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white transition hover:border-gray-300 hover:shadow-[0_18px_40px_rgba(100,60,45,0.08)] ${FOCUS}`}>
      <div className="relative aspect-[16/10] overflow-hidden">
        {guide.image ? (
          <Image src={guide.image} alt="" fill unoptimized sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-[1.03]" />
        ) : (
          <div className="gd-cream absolute inset-0 grid place-items-center bg-[#f6efe8]">
            <span className="gd-icon grid h-16 w-16 place-items-center rounded-[22px] bg-white text-brand ring-1 ring-[#eadfd7]">
              <TopicIcon topics={topic ? [topic, ...guide.topics] : guide.topics} className="h-7 w-7" />
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {topic && <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{topic.name}</p>}
        <h3 className="font-heading text-[19px] font-semibold leading-snug tracking-[-0.01em] text-slate-900 transition group-hover:text-brand">
          {guide.title}
        </h3>
        {guide.excerpt && <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-slate-500">{guide.excerpt}</p>}
        {(guide.level || guide.readingMinutes) && (
          <p className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-5 text-xs font-medium text-gray-500 tabular-nums">
            {guide.level && <LevelBadge level={guide.level} />}
            {guide.readingMinutes && (
              <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden /> {guide.readingMinutes} dk okuma</span>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
