"use client";

import Link from "next/link";
import { FaArrowRight, FaCheck, FaXmark } from "react-icons/fa6";

type Props = {
  title: string;
  existingRecipeId: number;
  existingRecipeSlug?: string | null;
  saving: boolean;
  uncertain: boolean;
  error: string;
  /** Core's allergen_warning for this candidate, read before publishing. */
  allergenWarning?: string;
  onCreate: () => void;
  onClose: () => void;
};

export default function SimilarRecipeChoice({
  title, existingRecipeId, existingRecipeSlug, saving, uncertain, error, allergenWarning, onCreate, onClose,
}: Props) {
  const path = `/recipe/${encodeURIComponent(existingRecipeSlug || String(existingRecipeId))}`;
  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center overflow-y-auto bg-[#202831]/60 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="similar-recipe-title"
        className="relative w-full max-w-md rounded-[28px] border border-[#e9d9cc] bg-[#fffaf6] px-7 py-8 shadow-[0_30px_95px_rgba(25,32,36,0.24)]">
        <button type="button" onClick={onClose} disabled={saving} aria-label="Pencereyi kapat"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl border border-[#efded1] text-[#7f746a] hover:bg-white disabled:opacity-40">
          <FaXmark />
        </button>
        <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#c75042]">TARİFTEN · BENZER TARİF</p>
        <h2 id="similar-recipe-title" className="mt-3 font-heading text-2xl font-extrabold leading-snug text-[#263941]">
          Benzer bir tarif zaten var.
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#7a7168]">
          <strong className="text-[#27373c]">{title}</strong> tarifine benzeyen bir içerik yayında.
          Mevcut tarifi inceleyebilir veya yeni tarifini ayrıca yayımlayabilirsin.
        </p>
        {allergenWarning && (
          <p role="note" className="ra-caution mt-4 rounded-2xl border border-[#efe2c4] bg-[#fffaf0] px-4 py-3 text-xs leading-5 text-[#6a4e1e]">
            <strong className="font-bold">Alerjen notu:</strong> {allergenWarning}{" "}
            <Link href="/profile/kitchen" onClick={onClose} className="font-bold underline underline-offset-2">Alerji bilgimi düzenle</Link>
          </p>
        )}
        <div className="mt-6 grid gap-3">
          <Link href={path} onClick={onClose}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#db4c3f] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#bb4035]">
            <FaArrowRight /> Mevcut tarifi görüntüle
          </Link>
          <button type="button" onClick={onCreate} disabled={saving || uncertain}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#e8d6ca] bg-white px-5 py-3 text-sm font-bold text-[#715951] transition hover:border-[#db4c3f] disabled:opacity-50">
            {saving ? "Yeni tarif yayımlanıyor…" : <><FaCheck /> Yine de yeni tarif oluştur</>}
          </button>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-[#fff0e9] p-3 text-xs font-bold text-[#b24b3a]">{error}</p>}
        {uncertain && <p role="alert" className="mt-2 text-xs leading-5 text-[#a45343]">
          Tarif kaydedilmiş olabilir. Yeni istek göndermeden önce Profil &gt; Tariflerim alanını kontrol et.
        </p>}
        <p className="mt-5 text-center text-[11px] text-[#99877b]">Benzer tarifi açmak yeni bir AI isteği başlatmaz.</p>
      </section>
    </div>
  );
}
