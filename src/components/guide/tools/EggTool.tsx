"use client";

import { useState } from "react";
import {
  EGG_ALTITUDES, EGG_DONENESS, EGG_SAFETY_NOTE, EGG_SIZES, EGG_STARTS, eggBoilTime, formatMinutes,
  type EggAltitude, type EggDoneness, type EggSize, type EggStart,
} from "@/lib/guide-tools";
import KitchenTimer from "./KitchenTimer";
import { ChoiceGroup, SafetyNote } from "./ToolBits";

/** Halved egg: the yolk shows the chosen doneness (runny, jammy, set). */
function YolkVisual({ doneness }: { doneness: EggDoneness }) {
  const title = doneness === "rafadan" ? "Akışkan sarı" : doneness === "kayisi" ? "Koyu kıvamlı, kremamsı sarı" : "Tamamen katı sarı";
  return (
    <svg viewBox="0 0 120 150" className="h-auto w-[72px] shrink-0 sm:w-[112px]" role="img" aria-label={`Yumurtanın içi: ${title}`}>
      <path className="gd-tool-egg-white" strokeWidth="2"
        d="M60 6C33 6 12 48 12 88c0 31 21 55 48 55s48-24 48-55C108 48 87 6 60 6Z" />
      {doneness === "rafadan" && (
        <>
          <path fill="#f59e0b" d="M60 66c-15 0-25 10-25 24 0 9 5 15 10 19 4 3 7 9 9 16 1 4 3 6 6 6s5-2 6-6c2-7 5-13 9-16 5-4 10-10 10-19 0-14-10-24-25-24Z" />
          <ellipse cx="51" cy="80" rx="6" ry="4" fill="#fde68a" opacity="0.7" />
        </>
      )}
      {doneness === "kayisi" && (
        <>
          <circle cx="60" cy="92" r="26" fill="#fbbf24" />
          <circle cx="60" cy="92" r="17" fill="#f59e0b" />
          <ellipse cx="53" cy="85" rx="5" ry="3.5" fill="#fde68a" opacity="0.55" />
        </>
      )}
      {doneness === "kati" && (
        <>
          <circle cx="60" cy="92" r="26" fill="#fcd34d" />
          <circle cx="60" cy="92" r="26" fill="none" stroke="#f5c542" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

const STEPS = [
  "Tencerede suyu kaynat; yumurtaların üstünü 2–3 cm geçsin.",
  "Yumurtaları kaşıkla tek tek, yavaşça kaynayan suya bırak ve zamanlayıcıyı başlat.",
  "Ocağı, su hafifçe kaynamaya devam edecek kadar kıs.",
];

export default function EggTool() {
  const [size, setSize] = useState<EggSize>("M");
  const [start, setStart] = useState<EggStart>("fridge");
  const [doneness, setDoneness] = useState<EggDoneness>("kayisi");
  const [altitude, setAltitude] = useState<EggAltitude>("low");
  const [sensitive, setSensitive] = useState(false);

  const result = eggBoilTime({ size, start, doneness, altitude, sensitive });
  const level = EGG_DONENESS.find(d => d.id === result.doneness)!;

  return (
    <div className="space-y-6">
      <div className="grid gap-5">
        <ChoiceGroup legend="Kıvam" value={result.doneness} onChange={setDoneness} columns={3}
          options={EGG_DONENESS.map(d => ({ id: d.id, label: d.label, hint: d.summary, disabled: sensitive && d.runny }))}
          note={sensitive ? "Hassas biri yiyeceği için yalnızca katı kıvam seçilebilir." : undefined} />

        <label className="gd-tool-tile flex cursor-pointer items-start gap-3 px-4 py-3">
          <input type="checkbox" checked={sensitive} onChange={event => setSensitive(event.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded accent-[#db4c3f]" />
          <span className="text-[14.5px] leading-snug">
            <span className="gd-tool-strong block font-semibold">Çocuk, hamile, yaşlı ya da bağışıklığı zayıf biri yiyecek</span>
            <span className="gd-tool-muted mt-0.5 block text-[13px]">Sarısı tamamen katılaşana kadar pişirilir.</span>
          </span>
        </label>

        <ChoiceGroup legend="Boyut" value={size} onChange={setSize} columns={4}
          options={EGG_SIZES.map(s => ({ id: s.id, label: s.label, hint: s.hint }))} />
        <ChoiceGroup legend="Başlangıç sıcaklığı" value={start} onChange={setStart} columns={2}
          options={EGG_STARTS.map(s => ({ id: s.id, label: s.label, hint: s.hint }))} />
        <ChoiceGroup legend="Rakım (isteğe bağlı)" value={altitude} onChange={setAltitude} columns={3} tight
          options={EGG_ALTITUDES.map(a => ({ id: a.id, label: a.label }))}
          note="Yükseklerde su daha düşük sıcaklıkta kaynar; süre biraz uzar." />
      </div>

      <div className="gd-tool-panel p-3.5 sm:p-5">
        <div className="flex items-center gap-4 sm:gap-6">
          <YolkVisual doneness={result.doneness} />
          <div className="min-w-0">
            <span className="gd-tool-muted block text-xs font-medium">Kaynar suda</span>
            <span className="gd-tool-strong block whitespace-nowrap font-heading text-[28px] font-semibold leading-tight tabular-nums sm:text-[38px]">
              {formatMinutes(result.seconds)}
            </span>
            <span className="mt-1 block text-[15px] leading-snug"><strong className="gd-tool-strong font-semibold">{level.label}:</strong> {level.summary}</span>
          </div>
        </div>

        <ol className="mt-5 space-y-2 text-[15px] leading-relaxed">
          {[...STEPS, level.cooling].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="gd-tool-strong grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-semibold tabular-nums">{i + 1}</span>
              <span className="min-w-0">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-5">
          <KitchenTimer seconds={result.seconds} label="Yumurta zamanlayıcısı" doneText={level.cooling} />
        </div>
      </div>

      {result.forcedFullySet ? (
        <SafetyNote title="Katı kıvama geçtik.">{EGG_SAFETY_NOTE}</SafetyNote>
      ) : level.runny ? (
        <SafetyNote>{EGG_SAFETY_NOTE}</SafetyNote>
      ) : null}
    </div>
  );
}
