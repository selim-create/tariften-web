import {
  BookOpen, Carrot, ChefHat, CookingPot, FlaskConical, Refrigerator, Scale, Sun, Timer,
} from "lucide-react";
import type { GuideTerm } from "@/lib/guides";

/** Small shared pieces for the Mutfak Rehberi pages (topic icons, level badge). */

export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const KNOWN_TOPICS = new Set([
  "teknikler", "pisirme-sureleri-ve-kivamlar", "saklama", "fermentasyon-ve-tursu",
  "kurutma", "olculer-ve-donusumler", "ekipman", "malzeme-rehberi",
]);

/** Icon of the first topic we know; child topics fall back to the book. */
export function TopicIcon({ topics, className, strokeWidth = 1.6 }: { topics: GuideTerm[]; className?: string; strokeWidth?: number }) {
  const slug = topics.map(t => t.slug).find(s => KNOWN_TOPICS.has(s));
  const props = { className, strokeWidth, "aria-hidden": true as const };
  switch (slug) {
    case "teknikler": return <ChefHat {...props} />;
    case "pisirme-sureleri-ve-kivamlar": return <Timer {...props} />;
    case "saklama": return <Refrigerator {...props} />;
    case "fermentasyon-ve-tursu": return <FlaskConical {...props} />;
    case "kurutma": return <Sun {...props} />;
    case "olculer-ve-donusumler": return <Scale {...props} />;
    case "ekipman": return <CookingPot {...props} />;
    case "malzeme-rehberi": return <Carrot {...props} />;
    default: return <BookOpen {...props} />;
  }
}

const LEVEL_STEPS: Record<string, number> = { baslangic: 1, orta: 2, ileri: 3 };

/** Level as a small three-bar meter (filled up to the level) and its name. */
export function LevelBadge({ level, className = "" }: { level: GuideTerm; className?: string }) {
  const steps = LEVEL_STEPS[level.slug] ?? 2;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span aria-hidden className="inline-flex h-3 items-end gap-[2px]">
        {[1, 2, 3].map(step => (
          <span key={step} className={`w-[3px] rounded-full ${step <= steps ? "bg-brand" : "gd-bar-off bg-[#e7ddd5]"}`}
            style={{ height: `${4 + step * 2.67}px` }} />
        ))}
      </span>
      <span><span className="sr-only">Seviye: </span>{level.name}</span>
    </span>
  );
}

/** Renders "*accent*" parts of a heading in the brand's italic. */
export function Accent({ text }: { text: string }) {
  return <>{text.split(/\*([^*]+)\*/).map((part, i) => i % 2 === 1
    ? <span key={i} className="italic text-brand">{part}</span>
    : <span key={i}>{part}</span>)}</>;
}
