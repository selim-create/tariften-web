"use client";

import Link from "next/link";
import { CircleAlert, CloudCheck, Loader2, LogIn, RotateCcw } from "lucide-react";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import { lokmaDishName } from "@/lib/lokma-emoji";
import { isPlaceholderImage } from "@/lib/utils";
import type { KitchenSnapshot } from "@/lib/kitchen-sync";

export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** Recipe thumbnail: real photo or a Lokma dish illustration, never a stock image. */
export function RecipeThumb({ title, image, className = "h-14 w-14" }: { title: string; image?: string; className?: string }) {
  return (
    <span className={`kz-cream relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f6efe8] ${className}`}>
      {image && !isPlaceholderImage(image) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <LokmaIngredientIcon name={lokmaDishName(title)} size="lg" />
      )}
    </span>
  );
}

/** Quiet save state: "Kaydediliyor…", "Hesabına kaydedildi" or the error with a retry. */
export function SyncStatus({ snapshot, onRetry }: { snapshot: KitchenSnapshot; onRetry: () => void }) {
  if (snapshot.status === "error") {
    return (
      <p role="alert" className="kz-warn flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">{snapshot.error}</span>
        <button type="button" onClick={onRetry} className={`inline-flex items-center gap-1 font-semibold underline underline-offset-4 ${FOCUS}`}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Tekrar dene
        </button>
      </p>
    );
  }
  const saving = snapshot.status === "saving" || snapshot.dirty;
  return (
    <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs text-gray-500">
      {saving
        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Kaydediliyor…</>
        : snapshot.loaded
          ? <><CloudCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> Hesabına kaydedildi</>
          : <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Yükleniyor…</>}
    </p>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {label}
    </div>
  );
}

/** Signed-out visitors: one calm card, no device-only list. */
export function SignInPrompt({ title, text, icon, callbackPath }: { title: string; text: string; icon: string; callbackPath: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-gray-200 bg-white px-6 py-14 text-center">
      <span className="kz-cream mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f6efe8]"><LokmaIngredientIcon name={icon} size="xl" /></span>
      <p className="font-heading text-xl font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-gray-500">{text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackPath)}`}
          className={`inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-white transition hover:bg-brand-dark ${FOCUS}`}>
          <LogIn className="h-4 w-4" aria-hidden /> Giriş yap
        </Link>
        <Link href="/register" className={`inline-flex h-11 items-center rounded-xl border border-gray-200 px-5 font-semibold text-slate-700 transition hover:border-gray-300 ${FOCUS}`}>
          Hesap oluştur
        </Link>
      </div>
    </div>
  );
}

export function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="kz-warn rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
      <p>{message || "Şu anda yüklenemedi."}</p>
      <button type="button" onClick={onRetry} className={`mt-2 font-semibold text-brand underline underline-offset-4 ${FOCUS}`}>Tekrar dene</button>
    </div>
  );
}
