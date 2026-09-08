'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaCheck, FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';
import type { HipostaNewsletterOption } from '@/lib/hiposta-newsletters';

type Props = {
  open: boolean;
  options: HipostaNewsletterOption[];
  selected: string[];
  onClose: () => void;
  onApply: (selected: string[]) => void;
};

type PublicationGroup = {
  slug: string;
  name: string;
  brandColor: string;
  foregroundColor: string;
  monogram: string;
  logoUrl: string | null;
  newsletters: HipostaNewsletterOption[];
};

function HipostaWordmark() {
  return (
    <div className="inline-flex flex-col leading-none" aria-label="Hiposta">
      <div className="flex items-center text-[28px] font-black tracking-[-0.07em] text-[#111216]">
        <span>hip</span>
        <span className="mx-[2px] inline-grid h-[22px] w-[22px] -rotate-3 place-items-center rounded-[2px] bg-[#173bdc] text-[17px] font-black tracking-normal text-white shadow-[2px_2px_0_#ffd93b]">o</span>
        <span>sta</span>
        <span className="ml-[1px] text-[#ff6648]">.</span>
      </div>
      <span className="mt-1 text-[7px] font-semibold uppercase tracking-[0.2em] text-slate-400">Hip Medya bülten platformu</span>
    </div>
  );
}

function cadenceLabel(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === 'daily') return 'Günlük';
  if (normalized === 'weekly') return 'Haftalık';
  if (normalized === 'monthly') return 'Aylık';
  return value;
}

export default function HipostaNewsletterModal({ open, options, selected, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<string[]>(selected);
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      setDraft(selected);
      setQuery('');
    }
  }, [open, selected]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  const groups = useMemo<PublicationGroup[]>(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');
    const map = new Map<string, PublicationGroup>();

    options.forEach((option) => {
      const matches = !normalizedQuery || [option.name, option.publicationName, option.description]
        .some((value) => value.toLocaleLowerCase('tr-TR').includes(normalizedQuery));
      if (!matches) return;

      const current = map.get(option.publicationSlug) || {
        slug: option.publicationSlug,
        name: option.publicationName,
        brandColor: option.publicationBrandColor,
        foregroundColor: option.publicationForegroundColor,
        monogram: option.publicationMonogram,
        logoUrl: option.publicationLogoUrl,
        newsletters: [],
      };
      current.newsletters.push(option);
      map.set(option.publicationSlug, current);
    });

    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [options, query]);

  if (!open || !mounted || typeof document === 'undefined') return null;

  const toggle = (slug: string) => {
    setDraft((current) => current.includes(slug)
      ? current.filter((item) => item !== slug)
      : [...current, slug]
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[2147483000] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[6px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Hiposta bültenlerini keşfet">
      <button className="absolute inset-0 z-0 cursor-default" aria-label="Modalı kapat" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[30px] bg-[#f5f3ee] shadow-[0_32px_100px_rgba(15,23,42,0.38)] sm:max-h-[86dvh] sm:rounded-[30px]">
        <div className="flex items-start justify-between gap-4 border-b border-[#ddd9cf] bg-[#fffdf8] px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex min-w-0 items-center gap-5">
            <HipostaWordmark />
            <div className="hidden h-10 w-px bg-[#ddd9cf] sm:block" />
            <div className="hidden min-w-0 sm:block">
              <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-[#173bdc]">Bülten ağını keşfet</p>
              <p className="mt-1 text-sm text-slate-500">Hip Medya yayınlarından okumak istediklerini ayrıca seç.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#ddd9cf] bg-white text-slate-500 transition hover:border-slate-400 hover:text-slate-900" aria-label="Kapat">
            <FaXmark />
          </button>
        </div>

        <div className="border-b border-[#ddd9cf] bg-[#fffdf8] px-5 pb-5 sm:px-8">
          <div className="relative max-w-xl">
            <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Yayın veya bülten ara" className="w-full rounded-full border border-[#ddd9cf] bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#173bdc] focus:ring-4 focus:ring-blue-100/60" />
          </div>
        </div>

        <div className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-7">
          {groups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cbc6bb] bg-white/60 px-6 py-10 text-center text-sm text-slate-500">Aramana uygun aktif bülten bulunamadı.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {groups.map((group) => (
                <section key={group.slug} className="overflow-hidden rounded-[22px] border border-[#ddd9cf] bg-[#fffdf8] shadow-[0_10px_35px_rgba(17,18,22,0.04)]">
                  <header className="flex items-center gap-3 border-b border-[#e6e2d8] px-4 py-4">
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl text-xs font-black shadow-sm"
                      style={{
                        backgroundColor: group.logoUrl ? '#ffffff' : group.brandColor,
                        color: group.foregroundColor,
                        backgroundImage: group.logoUrl ? `url(${group.logoUrl})` : undefined,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      {!group.logoUrl && group.monogram}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-[#111216]">{group.name}</p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{group.newsletters.length} aktif bülten</p>
                    </div>
                  </header>
                  <div className="divide-y divide-[#ece8df]">
                    {group.newsletters.map((option) => {
                      const checked = draft.includes(option.slug);
                      return (
                        <button key={option.slug} type="button" onClick={() => toggle(option.slug)} className="group flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-white">
                          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${checked ? 'border-[#173bdc] bg-[#173bdc] text-white' : 'border-slate-300 bg-white text-transparent group-hover:border-[#173bdc]'}`}>
                            <FaCheck className="text-[9px]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-800">{option.name}</span>
                              {option.cadence && <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">{cadenceLabel(option.cadence)}</span>}
                            </span>
                            {option.description && <span className="mt-1.5 block text-xs leading-relaxed text-slate-500">{option.description}</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-[#ddd9cf] bg-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs text-slate-500"><strong className="text-[#111216]">{draft.length}</strong> ağ bülteni seçili. Bu seçimler Tariften bültenlerinden bağımsızdır.</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">Vazgeç</button>
            <button type="button" onClick={() => { onApply(draft); onClose(); }} className="rounded-full bg-[#111216] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#173bdc]">Seçimleri uygula</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
