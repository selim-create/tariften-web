"use client";

import { useId, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import {
  convertMeasure, MEASURE_ERRORS, MEASURE_INGREDIENTS, MEASURE_UNITS, parseAmount, type MeasureUnitId,
} from "@/lib/guide-tools";
import { ErrorNote } from "./ToolBits";

const LABEL = "gd-tool-strong mb-2 block text-sm font-semibold";

export default function MeasureTool() {
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState<MeasureUnitId>("su_bardagi");
  const [to, setTo] = useState<MeasureUnitId>("g");
  const [ingredient, setIngredient] = useState("un");
  const ids = { amount: useId(), from: useId(), to: useId(), ingredient: useId(), error: useId() };

  const needsIngredient = from === "g" || to === "g";
  const result = convertMeasure({ amount, from, to, ingredient: ingredient || undefined });
  const fromUnit = MEASURE_UNITS.find(u => u.id === from)!;
  const ing = MEASURE_INGREDIENTS.find(i => i.id === ingredient);
  const parsed = parseAmount(amount);
  const amountError = !result.ok && result.error === "invalid_amount" && amount.trim() !== "";

  function swap() {
    setFrom(to);
    setTo(from);
    if (result.ok) {
      // Carry the answer over so a swap reads naturally ("110 g" → "1 su bardağı").
      const value = result.result.rounded;
      if (value > 0 && !result.result.tooSmall) setAmount(String(value).replace(".", ","));
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
          <div>
            <label htmlFor={ids.amount} className={LABEL}>Miktar</label>
            <input id={ids.amount} type="text" inputMode="decimal" autoComplete="off" value={amount}
              onChange={event => setAmount(event.target.value.slice(0, 12))} placeholder="örn. 1,5"
              aria-invalid={amountError} aria-describedby={!result.ok ? ids.error : undefined}
              className="gd-tool-field tabular-nums" />
          </div>
          <div className="min-w-0">
            <label htmlFor={ids.from} className={LABEL}>Bu ölçüden</label>
            <select id={ids.from} value={from} onChange={event => setFrom(event.target.value as MeasureUnitId)} className="gd-tool-field">
              {MEASURE_UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
          <button type="button" onClick={swap} aria-label="Ölçüleri yer değiştir" title="Yer değiştir"
            className="gd-tool-btn h-11 w-11 justify-self-start !px-0 sm:justify-self-auto">
            <ArrowLeftRight className="h-4 w-4 max-sm:rotate-90" aria-hidden />
          </button>
          <div className="min-w-0">
            <label htmlFor={ids.to} className={LABEL}>Bu ölçüye</label>
            <select id={ids.to} value={to} onChange={event => setTo(event.target.value as MeasureUnitId)} className="gd-tool-field">
              {MEASURE_UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        </div>
        <div className="sm:max-w-sm">
          <label htmlFor={ids.ingredient} className={LABEL}>
            Malzeme {needsIngredient ? <span className="font-normal text-brand">(gram için gerekli)</span> : <span className="gd-tool-muted font-normal">(isteğe bağlı)</span>}
          </label>
          <select id={ids.ingredient} value={ingredient} onChange={event => setIngredient(event.target.value)} className="gd-tool-field"
            aria-invalid={!result.ok && result.error === "unknown_ingredient"}>
            <option value="">Malzeme seç</option>
            {MEASURE_INGREDIENTS.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
        </div>
      </div>

      <div className="gd-tool-panel p-3.5 sm:p-5" aria-live="polite">
        {result.ok ? (
          <>
            <span className="gd-tool-muted block text-sm">
              {parsed !== null ? `${String(amount).trim()} ${fromUnit.short}` : ""}{ing && needsIngredient ? ` ${ing.label.replace(/ \(.*\)$/, "").toLocaleLowerCase("tr-TR")}` : ""}
            </span>
            <span className="gd-tool-strong mt-0.5 block font-heading text-[32px] font-semibold leading-tight tabular-nums sm:text-[38px]">
              ≈ {result.result.text}
            </span>
            {result.result.tooSmall && (
              <span className="gd-tool-muted mt-1 block text-[13.5px]">Bu kadar küçük bir miktar için daha küçük bir ölçü seç.</span>
            )}
            {result.others.length > 0 && (
              <div className="mt-5">
                <h3 className="gd-tool-strong text-[13px] font-semibold uppercase tracking-[0.12em]">Diğer ölçülerde</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {result.others.map(o => (
                    <li key={o.unit} className="gd-tool-tile px-3 py-1.5 text-[14px] tabular-nums">{o.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div id={ids.error}><ErrorNote>{MEASURE_ERRORS[result.error]}</ErrorNote></div>
        )}
      </div>

      <p className="gd-tool-muted text-[13px] leading-relaxed">
        Bardak ve kaşıklar silme ölçüdür: su bardağı 200 ml, çay bardağı 100 ml, yemek kaşığı 15 ml, tatlı kaşığı 10 ml, çay kaşığı 5 ml.
        Gram değerleri yaklaşıktır; un ve şeker bastırılarak doldurulursa daha ağır gelir. Hassas tariflerde (hamur işi, mayalama) mutfak terazisi kullan.
      </p>
    </div>
  );
}
