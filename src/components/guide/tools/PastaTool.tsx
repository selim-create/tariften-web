"use client";

import { useId, useState } from "react";
import {
  formatDecimal, formatMinutes, formatQuarters, PASTA_GRAMS_MAX, PASTA_GRAMS_MIN, PASTA_GRAMS_STEP, PASTA_PACKAGE_MAX,
  PASTA_PACKAGE_MIN, PASTA_TYPES, pastaCookTime, pastaWaterSalt, type PastaTexture,
} from "@/lib/guide-tools";
import KitchenTimer from "./KitchenTimer";
import { ChoiceGroup, ErrorNote, Stat, Stepper } from "./ToolBits";

const TYPE_OPTIONS = [...PASTA_TYPES.map(p => ({ id: p.id, label: p.label })), { id: "paket", label: "Paketteki süre" }];

export default function PastaTool() {
  const [type, setType] = useState("spagetti");
  const [packageMinutes, setPackageMinutes] = useState("");
  const [texture, setTexture] = useState<PastaTexture>("aldente");
  const [grams, setGrams] = useState(200);
  const inputId = useId();
  const errorId = useId();

  const time = pastaCookTime({ type, packageMinutes, texture });
  const water = pastaWaterSalt(grams);
  const precook = time.ok && time.precook;
  const showPackageError = type === "paket" && !time.ok && packageMinutes.trim() !== "";
  const selected = PASTA_TYPES.find(p => p.id === type);

  const doneText = precook
    ? "Yaprakları süzüp soğuk suya al ve birbirine yapışmasın diye tek tek ser."
    : texture === "aldente" ? "Bir tane tadına bak: dişe hafif direnç veriyorsa hemen süz." : "Bir tane tadına bak; yumuşadıysa süz.";

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
          {precook ? (
            <div>
              <span className="gd-tool-strong mb-2 block text-sm font-semibold">Kıvam</span>
              <span className="gd-tool-muted block text-[13.5px] leading-relaxed">
                Lazanya yaprağı yalnızca ön haşlanır, fırında pişmeye devam eder. Ön haşlama gerektirmeyen yapraklarda bu adımı atla.
              </span>
            </div>
          ) : (
            <ChoiceGroup legend="Kıvam" value={texture} onChange={setTexture} columns={2}
              options={[
                { id: "aldente", label: "Al dente", hint: "Dişe hafif direnç" },
                { id: "yumusak", label: "Yumuşak", hint: "Tamamen yumuşak" },
              ]} />
          )}
          <Stepper label="Porsiyon (kuru makarna)" value={water.grams} display={`${water.grams} g`}
            min={PASTA_GRAMS_MIN} max={PASTA_GRAMS_MAX} step={PASTA_GRAMS_STEP} onChange={setGrams}
            decreaseLabel="Makarna miktarını 50 g azalt" increaseLabel="Makarna miktarını 50 g artır" />
        </div>
      </div>

      <div className="gd-tool-panel p-3.5 sm:p-5">
        {showPackageError && (
          <div id={errorId} className="mb-4">
            <ErrorNote>Paketteki süreyi {PASTA_PACKAGE_MIN}–{PASTA_PACKAGE_MAX} dakika arasında bir sayı olarak yaz (örn. 9 ya da 8,5).</ErrorNote>
          </div>
        )}
        <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-3">
          <Stat label={precook ? "Ön haşlama" : "Pişirme"}
            value={time.ok ? formatMinutes(time.seconds) : "—"}
            sub={time.ok ? (precook ? "Kaynar suda" : `Paket süresi ${formatDecimal(time.packageMinutes)} dk`) : "Paketteki süreyi yaz"} />
          <Stat label="Su" value={`${formatDecimal(water.waterLiters)} L`} sub="Her 100 g için 1 litre" />
          <Stat label="Tuz" value={`${formatDecimal(water.saltGrams)} g`}
            sub={`≈ ${formatQuarters(water.saltSpoon.amount)} ${water.saltSpoon.unit} · litre başına 10 g`} />
        </div>
        <p className="gd-tool-muted mt-3 text-[13px] leading-snug">
          {water.grams} g ≈ {formatDecimal(water.servings)} kişilik ana yemek (kişi başı 100 g).
          {selected && !precook && selected.id === "eriste" ? " Ev yapımı taze erişte çok daha kısa sürede (2–4 dk) pişer." : ""}
        </p>

        <ol className="mt-5 space-y-2 text-[15px] leading-relaxed">
          {[
            "Geniş bir tencerede suyu kaynat; kaynayınca tuzu ekle.",
            "Makarnayı at, ilk dakika birkaç kez karıştır ve zamanlayıcıyı başlat.",
            precook ? "Süre dolunca yaprakları süz, soğuk suya al." : "Süzmeden önce bir kepçe makarna suyu ayır; sosu bağlar.",
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
    </div>
  );
}
