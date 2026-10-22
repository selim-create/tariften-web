"use client";

import { useId, useState } from "react";
import { Ban, CircleAlert, Loader2 } from "lucide-react";
import SafetyDialog from "@/components/safety/SafetyDialog";
import { blockConfirmParts } from "@/lib/ugc-safety";

/**
 * Contract confirmation before blocking. Blocking is silent: nothing here
 * suggests the other member will be told. A refusal (e.g. 403
 * block_not_allowed for staff accounts) is shown in place, calmly.
 */
export default function BlockConfirmDialog({ name, onConfirm, onClose }: {
  name: string; onConfirm: () => Promise<void>; onClose: () => void;
}) {
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { title, body } = blockConfirmParts(name);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Üye şu anda engellenemedi. Biraz sonra tekrar dene.");
      setBusy(false);
    }
  };

  return (
    <SafetyDialog titleId={titleId} onClose={onClose} busy={busy}>
      <div className="flex items-start gap-3 pr-10">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gray-100 text-slate-600"><Ban className="h-5 w-5" aria-hidden /></span>
        <h2 id={titleId} className="pt-2 font-heading text-lg font-bold leading-snug text-slate-900">{title}</h2>
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{body}</p>

      <div aria-live="polite" className="min-h-5 pt-3 text-sm">
        {error && <p className="flex items-start gap-2 text-red-700"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}</p>}
      </div>

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onClose} disabled={busy} data-autofocus
          className="h-12 flex-1 rounded-xl border border-gray-200 font-semibold text-slate-700 transition hover:border-gray-300 disabled:opacity-50">
          {error ? "Kapat" : "Vazgeç"}
        </button>
        {!error && (
          <button type="button" onClick={confirm} disabled={busy}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Engelleniyor</> : "Engelle"}
          </button>
        )}
      </div>
    </SafetyDialog>
  );
}
