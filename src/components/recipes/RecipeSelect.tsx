"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  onCreateOption?: () => void;
};

/** Accessible custom dropdown for category and recipe-unit selection. */
export default function RecipeSelect({
  label, value, options, onChange, placeholder = "Seç", allowClear = true, onCreateOption,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const controlId = useId();
  const root = useRef<HTMLDivElement>(null);
  const unique = [...new Set([...options, ...(value && !options.includes(value) ? [value] : [])])];
  const visible = unique.filter(v => v.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR")));

  // Closing always clears the option search.
  const close = () => { setOpen(false); setSearch(""); };
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) { setOpen(false); setSearch(""); }
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); setSearch(""); }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  return <div ref={root} className="relative min-w-0">
    <label id={controlId+"-label"} className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>
    <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={controlId+"-options"}
      aria-labelledby={controlId+"-label"} onClick={() => (open ? close() : setOpen(true))}
      className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-[15px] text-slate-900 outline-none transition hover:border-gray-300 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/10 ${open ? "border-brand ring-4 ring-brand/10" : "border-gray-200"}`}>
      <span className={value ? "truncate font-medium" : "truncate text-gray-400"}>{value || placeholder}</span>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
    </button>
    {open && <div className="absolute left-0 right-0 top-full z-[80] mt-2 min-w-[180px] overflow-hidden rounded-2xl bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.14)] ring-1 ring-black/5">
      {unique.length > 6 && <input autoFocus type="search" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Seçenek ara…" aria-label={label+" seçeneklerinde ara"}
        className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />}
      <div id={controlId+"-options"} role="listbox" aria-labelledby={controlId+"-label"} className="max-h-52 space-y-0.5 overflow-y-auto">
        {allowClear && <button type="button" role="option" aria-selected={!value}
          onClick={() => { onChange(""); close(); }}
          className="w-full rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-400 hover:bg-gray-50">Belirtilmemiş</button>}
        {visible.map(option => <button key={option} type="button" role="option" aria-selected={value===option}
          onClick={() => { onChange(option); close(); }}
          className={`w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-[#fdf6f1] ${value===option ? "bg-[#fdf1ea] font-semibold text-brand-dark" : "text-slate-700"}`}>
          {option}
        </button>)}
        {!visible.length && <p className="px-3 py-2 text-xs text-gray-500">Sonuç bulunamadı.</p>}
      </div>
      {onCreateOption && <button type="button" onClick={() => { close(); onCreateOption(); }}
        className="mt-2 w-full rounded-xl border border-dashed border-gray-300 px-3 py-2.5 text-left text-xs font-semibold text-brand transition hover:border-brand">+ Yeni seçenek ekle</button>}
    </div>}
  </div>;
}
