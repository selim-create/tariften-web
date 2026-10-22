"use client";

import { useId, useState } from "react";
import {
  formatMinutes, formatNumberTr, PASTA_PACKAGE_RANGE, PASTA_PORTION_RANGE, PASTA_SHAPES, PASTA_TEXTURES,
  pastaCookTime, pastaWaterSalt, type PastaTexture,
} from "@/lib/guide-tools";
import KitchenTimer from "./KitchenTimer";
import { ChoiceGroup, ErrorNote, SafetyNote, Stat, Stepper } from "./ToolBits";

const TYPE_OPTIONS = [...PASTA_SHAPES.map(p => ({ id: p.id as string, label: p.label })), { id: "paket", label: "Paketteki süre" }];

export default function PastaTool() {
  const [type, setType] = useState("spagetti");
  const [packageMinutes, setPackageMinutes] = useState("");
  const [texture, setTexture] = useState<PastaTexture>("al_dente");
  const [portions, setPortions] = useState(2);
  const inputId = useId();
  const errorId = useId();

  const time = pastaCookTime({ type, packageMinutes, texture });
  const water = pastaWaterSalt(portions);
  const showPackageError = type === "paket" && !time.ok && packageMinutes.trim() !== "";
  const note = (time.ok ? time.note : null) ?? water?.note ?? null;

  const doneText = texture === "al_dente"
    ? "Bir tane tadına bak: dişe hafif direnç veriyorsa hemen süz."
    : "Bir tane tadına bak; yumuşadıysa süz.";

  return (
    <div className="space-y-6">
      <div className="grid gap-5">
        <ChoiceGroup legend="Makarna" value={type} onChange={setType} options={TYPE_OPTIONS}
          note={type === "paket" ? undefined : "Süreler tipik paket süreleridir; markalar farklı olabilir. Elindeki paketin süresini kullanmak için “Paketteki süre”yi seç."} />

        {type === "paket" && (
          <div className="max-w-xs">
            <label htmlFor={inputId} className="gd-tool-strong mb-2 block text-sm font-semibold">Paketteki pişirme süresi (dakika)</label>
            <input id={inputId} type="text" inputMode="decimal" autoComplete="off" placeholder="örn. 9" value={packageMinutes}
              onChange={event => setPackageMinutes(event.target.value.slice(0, 5))}
              aria-invalid={showPackageError} aria-describedby={showPackageError ? errorId : undefined}
              className="gd-tool-field tabular-nums" />
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <ChoiceGroup legend="Kıvam" value={texture} onChange={setTexture} columns={2}
            options={PASTA_TEXTURES.map(t => ({ id: t.id, label: t.label, hint: t.description }))} />
          <Stepper label="Porsiyon (kişi başı 100 g)" value={portions} display={`${portions} kişilik`}
            min={PASTA_PORTION_RANGE[0]} max={PASTA_PORTION_RANGE[1]} step={1} onChange={setPortions}
            decreaseLabel="Bir porsiyon azalt" increaseLabel="Bir porsiyon artır" />
        </div>
      </div>

      <div className="gd-tool-panel p-3.5 sm:p-5">
        {showPackageError && (
          <div id={errorId} className="mb-4">
            <ErrorNote>Paketteki süreyi {PASTA_PACKAGE_RANGE[0]}–{PASTA_PACKAGE_RANGE[1]} dakika arasında bir sayı olarak yaz (örn. 9 ya da 8,5).</ErrorNote>
          </div>
        )}
        <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-3">
          <Stat label="Pişirme"
            value={time.ok ? formatMinutes(time.seconds) : "—"}
            sub={time.ok ? `Paket süresi ${formatNumberTr(time.packageMinutes)} dk` : "Paketteki süreyi yaz"} />
          <Stat label="Su" value={water ? `${formatNumberTr(water.waterLiters)} L` : "—"} sub="Her 100 g için 1 litre" />
          <Stat label="Tuz" value={water ? `${formatNumberTr(water.saltGrams, 0)} g` : "—"}
            sub={water ? `${water.saltHint.replace("yaklaşık ", "≈ ")} · litre başına 10 g` : undefined} />
        </div>
        {water && (
          <p className="gd-tool-muted mt-3 text-[13px] leading-snug">
            {water.portions} kişilik ana yemek için {water.grams} g kuru makarna (kişi başı 100 g).
          </p>
        )}

        <ol className="mt-5 space-y-2 text-[15px] leading-relaxed">
          {[
            "Geniş bir tencerede suyu kaynat; kaynayınca tuzu ekle.",
            "Makarnayı at, ilk dakika birkaç kez karıştır ve zamanlayıcıyı başlat.",
            "Süzmeden önce bir kepçe makarna suyu ayır; sosu bağlar.",
          ].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="gd-tool-strong grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-semibold tabular-nums">{i + 1}</span>
              <span className="min-w-0">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-5">
          <KitchenTimer seconds={time.ok ? time.seconds : 0} disabled={!time.ok} label="Makarna zamanlayıcısı" doneText={doneText} />
        </div>
      </div>

      {note && <SafetyNote>{note}</SafetyNote>}
    </div>
  );
}
