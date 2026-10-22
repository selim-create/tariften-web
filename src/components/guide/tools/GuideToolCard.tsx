import Link from "next/link";
import { ArrowRight, CookingPot, Egg, Scale, Sun } from "lucide-react";
import type { GuideToolKey } from "@/lib/guides";
import { GUIDE_TOOLS, GUIDE_TOOLS_PATH } from "@/lib/guide-tools";
import DryingTool from "./DryingTool";
import EggTool from "./EggTool";
import MeasureTool from "./MeasureTool";
import PastaTool from "./PastaTool";

export function GuideToolIcon({ tool, className, strokeWidth = 1.6 }: { tool: GuideToolKey; className?: string; strokeWidth?: number }) {
  const props = { className, strokeWidth, "aria-hidden": true as const };
  switch (tool) {
    case "egg_doneness": return <Egg {...props} />;
    case "pasta_timer": return <CookingPot {...props} />;
    case "drying_guide": return <Sun {...props} />;
    case "measure_converter": return <Scale {...props} />;
  }
}

function ToolBody({ tool }: { tool: GuideToolKey }) {
  switch (tool) {
    case "egg_doneness": return <EggTool />;
    case "pasta_timer": return <PastaTool />;
    case "drying_guide": return <DryingTool />;
    case "measure_converter": return <MeasureTool />;
  }
}

/**
 * A calm card around one interactive tool: icon, "Mutfak aracı" kicker, the
 * tool's name and a one-line description, the tool itself, then a link to
 * every tool (left out on /rehber/araclar itself).
 */
export default function GuideToolCard({ tool, showAllLink = true, id }: { tool: GuideToolKey; showAllLink?: boolean; id?: string }) {
  const meta = GUIDE_TOOLS[tool];
  const headingId = `${id || meta.anchor}-baslik`;
  return (
    <div id={id} aria-labelledby={headingId} role="region" className="gd-tool scroll-mt-24 p-4 sm:p-7">
      <div className="mb-6 flex items-start gap-3.5 sm:gap-4">
        <span className="gd-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f6efe8] text-brand sm:h-12 sm:w-12 sm:rounded-2xl">
          <GuideToolIcon tool={tool} className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <div className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">Mutfak aracı</span>
          <h2 id={headingId} className="gd-tool-strong mt-1 font-heading text-[22px] font-semibold leading-tight tracking-[-0.015em] sm:text-2xl">{meta.title}</h2>
          <span className="gd-tool-muted mt-1.5 block text-[15px] leading-relaxed">{meta.description}</span>
        </div>
      </div>

      <ToolBody tool={tool} />

      {showAllLink && (
        <div className="mt-6 border-t border-[#efe6df] pt-4 dark:border-slate-700">
          <Link href={GUIDE_TOOLS_PATH} className="gd-tool-link inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold transition">
            Tüm mutfak araçları <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}
