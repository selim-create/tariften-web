"use client";

import { useEffect, useState } from "react";
import { CircleAlert, Loader2, RotateCw } from "lucide-react";
import { useSafety } from "@/context/SafetyContext";
import AccountAvatar from "@/components/account/AccountAvatar";
import { formatBlockDate } from "@/lib/ugc-safety";

/**
 * "Engellenen üyeler" in Hesap ayarları: the member's block list from the
 * shared session cache, newest first, with "Engeli kaldır" on each row.
 */
export default function BlockedMembersPanel() {
  const { blocks, ready, listError, unblock, refresh, notify } = useSafety();
  const [pending, setPending] = useState<number | null>(null);
  const [rowError, setRowError] = useState<{ id: number; text: string } | null>(null);
  const [retrying, setRetrying] = useState(false);

  // Links from the block toast land on #engellenen-uyeler after the page has rendered.
  useEffect(() => {
    if (window.location.hash !== "#engellenen-uyeler") return;
    document.getElementById("engellenen-uyeler")?.scrollIntoView({ block: "start" });
  }, []);

  const remove = async (id: number, name: string) => {
    setPending(id);
    setRowError(null);
    try {
      await unblock(id);
      notify({ text: `${name} için engel kaldırıldı.`, tone: "ok" });
    } catch (err) {
      setRowError({ id, text: err instanceof Error ? err.message : "Engel şu anda kaldırılamadı." });
    } finally {
      setPending(null);
    }
  };

  const retry = async () => {
    setRetrying(true);
    try { await refresh(); } finally { setRetrying(false); }
  };

  return (
    <section id="engellenen-uyeler" aria-labelledby="edit-blocked" className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-5 sm:p-7">
      <h2 id="edit-blocked" className="font-heading text-lg font-bold text-slate-900">Engellenen üyeler</h2>
      <p className="mt-1 text-sm text-gray-500">Engellediğin üyelerin tariflerini ve yorumlarını görmezsin. Engellediğin kişiye bildirim gitmez.</p>

      <div className="mt-5">
        {!ready ? (
          <p role="status" className="flex items-center gap-2 py-4 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Yükleniyor…</p>
        ) : blocks.length === 0 ? (
          listError ? null : (
            <p className="rounded-2xl bg-gray-50 px-4 py-4 text-sm text-gray-500">
              Engellediğin üye yok. Bir tarifte ya da yorumda <span aria-hidden>⋯</span><span className="sr-only">diğer seçenekler</span> menüsünden engelleyebilirsin.
            </p>
          )
        ) : (
          <ul className="divide-y divide-gray-100">
            {blocks.map(member => {
              const date = formatBlockDate(member.blockedAt);
              return (
                <li key={member.userId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <AccountAvatar url={member.avatar} name={member.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-slate-900">{member.name}</p>
                    {date && <p className="text-xs text-gray-500">{date} tarihinde engellendi</p>}
                    {rowError?.id === member.userId && <p className="mt-0.5 text-xs text-red-700">{rowError.text}</p>}
                  </div>
                  <button type="button" onClick={() => remove(member.userId, member.name)} disabled={pending !== null}
                    aria-label={`${member.name} için engeli kaldır`}
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-gray-200 px-3.5 text-sm font-semibold text-slate-700 transition hover:border-gray-300 hover:text-slate-900 disabled:opacity-50">
                    {pending === member.userId && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    Engeli kaldır
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {ready && listError && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-red-700">
            <span className="inline-flex items-start gap-2"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {listError}</span>
            <button type="button" onClick={retry} disabled={retrying}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 font-semibold text-slate-700 transition hover:border-gray-300 disabled:opacity-50">
              <RotateCw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} aria-hidden /> Tekrar dene
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
