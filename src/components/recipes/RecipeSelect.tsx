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

  useEffect(() => {
    if (!open) { setSearch(""); return; }
    const closeOutside = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  return <div ref={root} className="relative min-w-0">
    <label id={controlId+"-label"} className="mb-1.5 block text-xs font-bold text-[#78665b]">{label}</label>
    <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={controlId+"-options"}
      aria-labelledby={controlId+"-label"} onClick={() => setOpen(v => !v)}
      className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-[#eadccf] bg-[#fffdfa] px-3 py-2.5 text-left text-sm text-[#27343a] outline-none transition hover:border-[#da776b] focus-visible:ring-2 focus-visible:ring-[#db4c3f]">
      <span className={value ? "truncate font-semibold" : "truncate text-[#99877e]"}>{value || placeholder}</span>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className={`shrink-0 text-[#ae766c] transition-transform ${open ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
    </button>
    {open && <div className="absolute left-0 right-0 top-full z-[80] mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-[#edddd0] bg-white p-2 shadow-[0_18px_36px_rgba(35,38,33,0.16)]">
      {unique.length > 6 && <input autoFocus type="search" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Seçenek ara…" aria-label={label+" seçeneklerinde ara"}
        className="mb-2 w-full rounded-lg border border-[#e9dad0] px-3 py-2 text-sm outline-none focus:border-[#db4c3f]" />}
      <div id={controlId+"-options"} role="listbox" aria-labelledby={controlId+"-label"} className="max-h-52 space-y-0.5 overflow-y-auto">
        {allowClear && <button type="button" role="option" aria-selected={!value}
          onClick={() => { onChange(""); setOpen(false); }}
          className="w-full rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#9e887d] hover:bg-[#fdf3ee]">Belirtilmemiş</button>}
        {visible.map(option => <button key={option} type="button" role="option" aria-selected={value===option}
          onClick={() => { onChange(option); setOpen(false); }}
          className={`w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-[#fff0e9] ${value===option ? "bg-[#fff0e9] font-bold text-[#bc473a]" : "text-[#33434a]"}`}>
          {option}
        </button>)}
        {!visible.length && <p className="px-3 py-2 text-xs text-[#84796c]">Sonuç bulunamadı.</p>}
      </div>
      {onCreateOption && <button type="button" onClick={() => { setOpen(false); onCreateOption(); }}
        className="mt-2 w-full rounded-xl border border-[#e9dad0] px-3 py-2.5 text-left text-xs font-bold text-[#b94a3d]">+ Yeni seçenek ekle</button>}
    </div>}
  </div>;
}
