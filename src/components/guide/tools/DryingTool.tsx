"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DRYING_FOODS, DRYING_GENERAL_NOTES, DRYING_METHODS, DRYING_NO_MEAT_NOTE, dryingPlan, type DryingFoodId, type DryingMethod,
} from "@/lib/guide-tools";
import { ChoiceGroup, InfoBlock, SafetyNote, Stat } from "./ToolBits";

const methodLabel = (id: DryingMethod) => DRYING_METHODS.find(m => m.id === id)?.label || id;

export default function DryingTool() {
  const [foodId, setFoodId] = useState<DryingFoodId>(DRYING_FOODS[0].id);
  const [method, setMethod] = useState<DryingMethod>("firin");
  const result = dryingPlan(foodId, method);
  const food = DRYING_FOODS.find(f => f.id === foodId) || DRYING_FOODS[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-5">
        <ChoiceGroup legend="Ne kurutacaksın?" value={foodId} onChange={setFoodId}
          options={DRYING_FOODS.map(f => ({ id: f.id, label: f.label }))} />
        <ChoiceGroup legend="Yöntem" value={method} onChange={setMethod} columns={3}
          options={DRYING_METHODS.map(m => ({ id: m.id, label: m.label, hint: "notRecommended" in food.methods[m.id] ? "Önerilmez" : undefined }))} />
      </div>

      <div className="gd-tool-panel p-3.5 sm:p-5" aria-live="polite">
        {result.ok ? (
          <>
            <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
              <Stat label={result.tempC ? "Sıcaklık" : "Hava"} value={result.tempLabel}
                sub={result.tempC ? (method === "firin" ? "Fırın termometresiyle ölç" : "Makinenin ayarı") : result.food.group === "ot" ? "Doğrudan güneş değil" : "Sıcak, kuru ve rüzgârlı günler"} />
              <Stat label="Süre" value={result.timeLabel}
                sub="Dilim kalınlığına, neme ve cihaza göre değişir; ilk kontrolü en kısa sürede yap" />
            </div>
            <div className="mt-5 grid gap-4">
              <InfoBlock title="Hazırlık"><p>{result.prep}</p></InfoBlock>
              <InfoBlock title={method === "firin" ? "Fırında" : method === "makine" ? "Makinede" : result.food.group === "ot" ? "Gölgede" : "Güneşte"}>
                <p>{result.conditions}</p>
              </InfoBlock>
              {result.finish && <InfoBlock title="Son işlem"><p>{result.finish}</p></InfoBlock>}
              <InfoBlock title="Hazır mı?"><p>{result.ready}</p></InfoBlock>
              <InfoBlock title="Saklama"><p>{result.storage}</p></InfoBlock>
              {result.notes.filter(note => note !== result.finish).map(note => <SafetyNote key={note}>{note}</SafetyNote>)}
            </div>
          </>
        ) : result.error === "not_recommended" ? (
          <div className="space-y-3">
            <SafetyNote title={`${result.food.label}: ${methodLabel(result.method).toLocaleLowerCase("tr-TR")} önerilmiyor.`}>
              {result.reason}
            </SafetyNote>
            <div className="flex flex-wrap gap-2">
              {result.alternatives.map(alt => (
                <button key={alt} type="button" onClick={() => setMethod(alt)} className="gd-tool-btn">
                  {methodLabel(alt)} ile kurut
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <ul className="gd-tool-muted space-y-1.5 text-[13px] leading-relaxed">
        <li>Hazır olup olmadığını süreye değil teste göre anla; küf, koku ya da yapışkanlık görürsen tüketme.</li>
        {DRYING_GENERAL_NOTES.map(note => <li key={note}>{note}</li>)}
      </ul>

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
