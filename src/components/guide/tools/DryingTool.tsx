"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import {
  DRYING_FOODS, DRYING_METHODS, DRYING_NO_MEAT_NOTE, dryingPlan, formatRange, SUN_MIN_AIR_C, type DryingMethod,
} from "@/lib/guide-tools";
import { ChoiceGroup, InfoBlock, SafetyNote, Stat } from "./ToolBits";

export default function DryingTool() {
  const [foodId, setFoodId] = useState(DRYING_FOODS[0].id);
  const [method, setMethod] = useState<DryingMethod>("oven");
  const result = dryingPlan(foodId, method);
  const food = DRYING_FOODS.find(f => f.id === foodId) || DRYING_FOODS[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-5">
        <ChoiceGroup legend="Ne kurutacaksın?" value={foodId} onChange={setFoodId}
          options={DRYING_FOODS.map(f => ({ id: f.id, label: f.label }))} />
        <ChoiceGroup legend="Yöntem" value={method} onChange={setMethod} columns={3}
          options={DRYING_METHODS.map(m => ({ id: m.id, label: m.label, hint: food.methods[m.id] ? undefined : "Önerilmez" }))} />
      </div>

      <div className="gd-tool-panel p-3.5 sm:p-5" aria-live="polite">
        {result.ok ? (
          <>
            <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
              <Stat label={result.plan.temperature ? "Sıcaklık" : "Hava"}
                value={result.plan.temperature ? formatRange(result.plan.temperature, "°C") : food.kind === "herb" ? "Gölge, havadar" : `En az ${SUN_MIN_AIR_C} °C`}
                sub={result.plan.temperature ? (method === "oven" ? "Fırın termometresiyle ölç" : "Makinenin ayarı") : food.kind === "herb" ? "Doğrudan güneş değil" : "Sıcak, kuru ve rüzgârlı günler"} />
              <Stat label="Süre" value={formatRange(result.plan.time, result.plan.time.unit)}
                sub="Parça kalınlığına ve neme göre değişir" />
            </div>
            <div className="mt-5 grid gap-4">
              <InfoBlock title="Hazırlık"><p>{result.food.prep}</p></InfoBlock>
              <InfoBlock title={method === "sun" ? "Nasıl kurutulur" : "Kuruturken"}>
                {result.methodNotes.map(note => <p key={note}>{note}</p>)}
                {result.plan.note && <p className="mt-1">{result.plan.note}</p>}
              </InfoBlock>
              {result.finish && <InfoBlock title="Son işlem"><p>{result.finish}</p></InfoBlock>}
              <InfoBlock title="Hazır mı?"><p>{result.food.ready}</p></InfoBlock>
              <InfoBlock title="Saklama"><p>{result.food.storage}</p></InfoBlock>
            </div>
          </>
        ) : result.error === "unsupported" ? (
          <div className="space-y-3">
            <SafetyNote title={`${result.food.label} için ${DRYING_METHODS.find(m => m.id === result.method)?.label.toLocaleLowerCase("tr-TR")} önerilmez.`}>
              {result.reason}
            </SafetyNote>
            <div className="flex flex-wrap gap-2">
              {result.alternatives.map(alt => (
                <button key={alt} type="button" onClick={() => setMethod(alt)} className="gd-tool-btn">
                  {DRYING_METHODS.find(m => m.id === alt)?.label} ile devam et
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <p className="gd-tool-muted flex items-start gap-2 text-[13px] leading-relaxed">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>Hazır olup olmadığını süreye değil teste göre anla. Değerler ev için güvenli ve temkinli aralıklardır; küf, koku ya da yapışkanlık görürsen tüketme.</span>
      </p>

      <details className="gd-tool-tile group">
        <summary className="gd-tool-strong flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 text-[14.5px] font-semibold [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          Et ve balık neden yok?
          <ChevronDown className="gd-tool-muted h-5 w-5 shrink-0 transition group-open:rotate-180" aria-hidden />
        </summary>
        <p className="px-4 pb-4 text-[14.5px] leading-relaxed">{DRYING_NO_MEAT_NOTE}</p>
      </details>
    </div>
  );
}
