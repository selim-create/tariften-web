"use client";

import { useId, useState } from "react";
import { CircleAlert, Eye, EyeOff, Loader2, type LucideIcon } from "lucide-react";

export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const INPUT = "au-input h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-[15px] text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-red-400";

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "id"> & {
  label: string; icon: LucideIcon; hint?: React.ReactNode; aside?: React.ReactNode; invalid?: boolean;
};

/** Labelled text input with a leading icon; `aside` sits right of the label (e.g. "Şifremi unuttum"). */
export function AuthInput({ label, icon: Icon, hint, aside, invalid, ...input }: InputProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
        {aside}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden />
        <input id={id} {...input} aria-invalid={invalid || undefined} aria-describedby={hint ? hintId : undefined} className={INPUT} />
      </div>
      {hint && <p id={hintId} className="mt-1.5 text-[13px] leading-snug text-slate-500">{hint}</p>}
    </div>
  );
}

/** Password input with a 44px show/hide toggle. */
export function PasswordInput({ label, icon: Icon, hint, aside, invalid, ...input }: InputProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
        {aside}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden />
        <input id={id} {...input} type={visible ? "text" : "password"} aria-invalid={invalid || undefined}
          aria-describedby={hint ? hintId : undefined} className={`${INPUT} pr-12`} />
        <button type="button" onClick={() => setVisible(v => !v)} aria-pressed={visible} aria-controls={id}
          aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
          className={`absolute right-0.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition hover:text-slate-700 ${FOCUS}`}>
          {visible ? <EyeOff className="h-[18px] w-[18px]" aria-hidden /> : <Eye className="h-[18px] w-[18px]" aria-hidden />}
        </button>
      </div>
      {hint && <p id={hintId} className="mt-1.5 text-[13px] leading-snug text-slate-500">{hint}</p>}
    </div>
  );
}

export function AuthSelect({ label, icon: Icon, children, ...select }: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className" | "id"> & { label: string; icon: LucideIcon }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden />
        <select id={id} {...select} className={`${INPUT} cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")] bg-[position:right_14px_center] bg-no-repeat pr-10 text-[14px]`}>
          {children}
        </select>
      </div>
    </div>
  );
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="au-error mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export function SubmitButton({ loading, loadingLabel, children }: { loading: boolean; loadingLabel: string; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading} aria-busy={loading || undefined}
      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70 ${FOCUS}`}>
      {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {loadingLabel}</> : children}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8l4-3Z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.4.8 2.2-1.3 3.1-2.5c1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1ZM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5Z" />
    </svg>
  );
}

/** Google is live; Apple stays passive and is clearly marked "Yakında". */
export function SocialButtons({ onGoogle, disabled, googleLabel = "Google ile devam et" }: { onGoogle: () => void; disabled?: boolean; googleLabel?: string }) {
  return (
    <div className="space-y-3">
      <button type="button" onClick={onGoogle} disabled={disabled}
        className={`au-social inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 text-[15px] font-medium text-slate-800 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60 ${FOCUS}`}>
        <GoogleMark /> {googleLabel}
      </button>
      <button type="button" disabled aria-disabled="true" title="Yakında"
        className="au-social au-soon inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-transparent px-4 text-[15px] font-medium text-slate-400">
        <AppleMark /> Apple ile devam et
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Yakında</span>
      </button>
    </div>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="au-divider my-7 flex items-center gap-4" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-gray-200" />
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}
