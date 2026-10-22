"use client";

import { useId, useState } from "react";
import { Check, CircleAlert, Info, Loader2 } from "lucide-react";
import SafetyDialog from "@/components/safety/SafetyDialog";
import {
  REPORT_DETAILS_MAX, REPORT_OTHER_MIN, REPORT_REASONS, charCount, reportDetailsError, submitReport,
  type ReportReason, type ReportResult, type ReportTargetType,
} from "@/lib/ugc-safety";

const TITLES: Record<ReportTargetType, string> = {
  recipe: "Tarifi bildir",
  comment: "Yorumu bildir",
  user: "Üyeyi bildir",
};

/**
 * "Bildir": the contract's reasons in order, optional details (required, at
 * least 10 characters, for "Diğer"), then Core's own message. `onDone` runs
 * when a successful report is closed, so a reported comment can disappear.
 */
export default function ReportDialog({ token, targetType, targetId, onClose, onDone }: {
  token: string; targetType: ReportTargetType; targetId: number;
  onClose: () => void; onDone?: (result: ReportResult) => void;
}) {
  const titleId = useId();
  const detailsId = useId();
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportResult | null>(null);

  const isOther = reason === "other";
  const count = charCount(details.trim());
  const invalid = reason ? reportDetailsError(reason, details) : "Bir neden seç.";

  const close = () => {
    if (busy) return;
    if (result) onDone?.(result);
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reason || invalid) { setError(invalid); return; }
    setBusy(true);
    setError(null);
    try {
      setResult(await submitReport(token, { targetType, targetId, reason, details }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bildirim şu anda gönderilemedi. Biraz sonra tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <SafetyDialog titleId={titleId} onClose={close}>
        <div className="pt-4 text-center">
          <div className={`mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full ${result.alreadyReported ? "bg-gray-100 text-slate-600" : "bg-brand/10 text-brand"}`}>
            {result.alreadyReported ? <Info className="h-7 w-7" aria-hidden /> : <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden />}
          </div>
          <h2 id={titleId} className="mb-2 font-heading text-xl font-bold text-slate-900">
            {result.alreadyReported ? "Zaten bildirmişsin" : "Teşekkürler"}
          </h2>
          <p className="mb-7 text-sm leading-relaxed text-gray-500">{result.message}</p>
          <button type="button" onClick={close} data-autofocus
            className="h-12 w-full rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-dark">Tamam</button>
        </div>
      </SafetyDialog>
    );
  }

  return (
    <SafetyDialog titleId={titleId} onClose={close} busy={busy}>
      <form onSubmit={submit} noValidate>
        <h2 id={titleId} className="pr-10 font-heading text-lg font-bold text-slate-900">{TITLES[targetType]}</h2>
        <p className="mt-1 text-sm text-gray-500">Neden bildiriyorsun? Ekibimiz en geç 24 saat içinde inceler.</p>

        <fieldset className="mt-5">
          <legend className="sr-only">Bildirme nedeni</legend>
          <div className="space-y-1.5">
            {REPORT_REASONS.map(({ key, label }) => {
              const checked = reason === key;
              return (
                <label key={key}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[15px] transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/15 ${checked ? "border-brand/50 bg-brand/5 text-slate-900" : "border-gray-200 text-slate-700 hover:border-gray-300"}`}>
                  <input type="radio" name="report-reason" value={key} checked={checked} disabled={busy}
                    onChange={() => { setReason(key); setError(null); }}
                    className="h-4 w-4 shrink-0 accent-brand" />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4">
          <label htmlFor={detailsId} className="mb-1.5 flex items-baseline justify-between gap-3 text-sm font-medium text-slate-700">
            <span>Açıklama {isOther ? <span className="font-normal text-gray-500">(en az {REPORT_OTHER_MIN} karakter)</span> : <span className="font-normal text-gray-500">(isteğe bağlı)</span>}</span>
            <span className={`text-xs font-normal tabular-nums ${count > REPORT_DETAILS_MAX ? "text-red-600" : "text-gray-400"}`}>{count}/{REPORT_DETAILS_MAX}</span>
          </label>
          <textarea id={detailsId} rows={3} value={details} disabled={busy}
            onChange={(e) => { setDetails(e.target.value); setError(null); }}
            placeholder={isOther ? "Kısaca ne olduğunu anlat." : "Eklemek istediğin bir şey var mı?"}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-slate-800 transition focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10" />
        </div>

        <div aria-live="polite" className="min-h-5 pt-2 text-sm">
          {error && <p className="flex items-start gap-2 text-red-700"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}</p>}
        </div>

        <div className="mt-3 flex gap-2">
          <button type="button" onClick={close} disabled={busy}
            className="h-12 flex-1 rounded-xl border border-gray-200 font-semibold text-slate-700 transition hover:border-gray-300 disabled:opacity-50">
            Vazgeç
          </button>
          <button type="submit" disabled={busy || !!invalid}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Gönderiliyor</> : "Bildir"}
          </button>
        </div>
      </form>
    </SafetyDialog>
  );
}
