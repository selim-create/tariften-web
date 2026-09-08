'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaArrowRight, FaCheck, FaCompass, FaEnvelope, FaSpinner } from 'react-icons/fa6';
import HipostaNewsletterModal from '@/components/newsletter/HipostaNewsletterModal';
import { getNewsletterOptions, subscribeNewsletters } from '@/lib/newsletter-client';
import type { HipostaNewsletterOption, NewsletterSourceId } from '@/lib/hiposta-newsletters';

type Props = {
  source: NewsletterSourceId;
  className?: string;
  variant?: 'card' | 'horizontal';
  title?: string;
  description?: string;
};

function HipostaMiniMark() {
  return (
    <span className="inline-flex shrink-0 items-center text-[13px] font-black tracking-[-0.06em] text-slate-900" aria-label="Hiposta">
      <span>hip</span>
      <span className="mx-[1px] inline-grid h-3.5 w-3.5 -rotate-3 place-items-center rounded-[1px] bg-[#173bdc] text-[9px] tracking-normal text-white shadow-[1px_1px_0_#ffd93b]">o</span>
      <span>sta</span>
      <span className="text-[#ff6648]">.</span>
    </span>
  );
}

function cadenceLabel(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === 'daily') return 'Günlük';
  if (normalized === 'weekly') return 'Haftalık';
  if (normalized === 'monthly') return 'Aylık';
  return value;
}

export default function NewsletterForm({
  source,
  className = '',
  variant = 'card',
  title = 'Tariften Bültenleri',
  description = 'Günün ve haftanın mutfak kararlarını kolaylaştıran seçkiler e-postana gelsin.',
}: Props) {
  const isHorizontal = variant === 'horizontal';
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [options, setOptions] = useState<HipostaNewsletterOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    getNewsletterOptions()
      .then((nextOptions) => {
        if (!mounted) return;
        setOptions(nextOptions);
        setSelected(nextOptions.filter((option) => option.isPrimary).map((option) => option.slug));
      })
      .finally(() => {
        if (mounted) setLoadingOptions(false);
      });
    return () => { mounted = false; };
  }, []);

  const primaryOptions = useMemo(() => options.filter((option) => option.isPrimary), [options]);
  const networkOptions = useMemo(() => options.filter((option) => !option.isPrimary), [options]);
  const selectedNetworkSlugs = useMemo(
    () => selected.filter((slug) => networkOptions.some((option) => option.slug === slug)),
    [selected, networkOptions]
  );

  const closeModal = useCallback(() => setModalOpen(false), []);

  const toggle = (slug: string) => {
    setSelected((current) => current.includes(slug)
      ? current.filter((item) => item !== slug)
      : [...current, slug]
    );
  };

  const applyNetworkSelection = (networkSlugs: string[]) => {
    const primarySlugs = primaryOptions
      .filter((option) => selected.includes(option.slug))
      .map((option) => option.slug);
    setSelected([...new Set([...primarySlugs, ...networkSlugs])]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('idle');

    if (!email.trim() || !email.includes('@')) {
      setStatus('error');
      setMessage('Geçerli bir e-posta adresi gir.');
      return;
    }
    if (selected.length === 0) {
      setStatus('error');
      setMessage('En az bir bülten seçmelisin.');
      return;
    }
    if (!consent) {
      setStatus('error');
      setMessage('Bülten aboneliği için onay vermelisin.');
      return;
    }

    setSubmitting(true);
    const result = await subscribeNewsletters({ email, newsletters: selected, source, website });
    setSubmitting(false);

    if (result.success) {
      setStatus('success');
      setMessage(result.message);
      setEmail('');
      setConsent(false);
      setWebsite('');
      setSelected(primaryOptions.map((option) => option.slug));
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  if (status === 'success') {
    return (
      <div className={`${isHorizontal ? 'rounded-[28px] px-6 py-5 md:px-8' : 'rounded-2xl p-5'} border border-emerald-100 bg-emerald-50/80 ${className}`}>
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-emerald-600 shadow-sm"><FaCheck className="text-xs" /></span>
          <div>
            <p className="text-sm font-bold text-emerald-900">Seçimin kaydedildi</p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-700">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isHorizontal) {
    return (
      <section className={`overflow-hidden rounded-[30px] border border-[#eaded9] bg-gradient-to-br from-[#fff8f5] via-white to-[#fffdf7] shadow-[0_20px_60px_rgba(120,60,40,0.08)] ${className}`}>
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.35fr]">
          <div className="relative flex flex-col justify-between overflow-hidden border-b border-[#efe6e2] px-6 py-7 lg:border-b-0 lg:border-r lg:px-8 lg:py-8">
            <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-[#db4c3f]/8 blur-3xl" />
            <div className="relative">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#db4c3f] text-white shadow-[0_8px_24px_rgba(219,76,63,0.22)]"><FaEnvelope /></span>
                <span className="rounded-full border border-[#efd2cd] bg-white/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#b84a3f]">Tariften seçkileri</span>
              </div>
              <h3 className="max-w-md text-2xl font-bold leading-tight text-slate-900 md:text-[28px]">{title}</h3>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">{description}</p>
            </div>
            <div className="relative mt-6 flex items-center gap-2 text-[10px] text-slate-400">
              <span>Tariften bültenleri</span><span>•</span><span>Hiposta altyapısıyla</span>
            </div>
          </div>

          <div className="px-6 py-7 lg:px-8 lg:py-8">
            {loadingOptions ? (
              <div className="mb-4 flex items-center gap-2 text-xs text-slate-400"><FaSpinner className="animate-spin" /> Bültenler hazırlanıyor</div>
            ) : primaryOptions.length === 0 ? (
              <p className="mb-4 text-xs text-slate-400">Tariften bültenleri şu anda aboneliğe açık değil.</p>
            ) : (
              <div className="mb-4 flex flex-wrap gap-2">
                {primaryOptions.map((option) => {
                  const checked = selected.includes(option.slug);
                  return (
                    <label key={option.slug} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 transition ${checked ? 'border-[#e6aaa4] bg-[#fff7f5] text-slate-800 shadow-sm' : 'border-slate-200 bg-white text-slate-500'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggle(option.slug)} className="sr-only" />
                      <span className={`grid h-4 w-4 place-items-center rounded-full ${checked ? 'bg-[#db4c3f] text-white' : 'border border-slate-300 text-transparent'}`}><FaCheck className="text-[7px]" /></span>
                      <span className="text-xs font-bold">{option.name}</span>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {networkOptions.length > 0 && (
                <button type="button" onClick={() => setModalOpen(true)} className="group inline-flex items-center gap-2 rounded-full border border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/70 px-3.5 py-2 text-left transition hover:border-blue-200 hover:shadow-sm">
                  <FaCompass className="text-[#173bdc]" />
                  <HipostaMiniMark />
                  <span className="text-[11px] font-bold text-slate-600">ağından keşfet</span>
                  {selectedNetworkSlugs.length > 0 && <span className="rounded-full bg-[#173bdc] px-2 py-0.5 text-[9px] font-extrabold text-white">+{selectedNetworkSlugs.length}</span>}
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-posta adresin" required className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#db4c3f] focus:ring-4 focus:ring-red-50" />
                <button type="submit" disabled={submitting || loadingOptions || selected.length === 0 || !consent} className="rounded-2xl bg-[#db4c3f] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(219,76,63,0.2)] transition hover:bg-[#b03d32] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
                  {submitting ? <FaSpinner className="animate-spin" /> : 'Bültene katıl'}
                </button>
              </div>
              <input type="text" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-px w-px opacity-0" />
            </form>

            <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[10px] leading-relaxed text-slate-400">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#db4c3f] focus:ring-[#db4c3f]" />
              <span>Seçtiğim bültenleri e-posta ile almak istiyorum. <Link href="/kvkk" className="font-semibold text-slate-500 underline underline-offset-2 hover:text-[#db4c3f]">KVKK Aydınlatma Metni</Link></span>
            </label>
            {status === 'error' && <p className="mt-2 text-xs font-semibold text-red-500">{message}</p>}
          </div>
        </div>

        <HipostaNewsletterModal open={modalOpen} options={networkOptions} selected={selectedNetworkSlugs} onClose={closeModal} onApply={applyNetworkSelection} />
      </section>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-100 bg-slate-50 p-5 ${className}`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#db4c3f] shadow-sm"><FaEnvelope /></span>
        <div>
          <h4 className="font-bold text-slate-900">{title}</h4>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>

      {loadingOptions ? (
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-400"><FaSpinner className="animate-spin" /> Bültenler hazırlanıyor</div>
      ) : primaryOptions.length === 0 ? (
        <p className="mb-4 text-xs text-slate-400">Tariften bültenleri şu anda aboneliğe açık değil.</p>
      ) : (
        <div className="mb-4 space-y-2">
          {primaryOptions.map((option) => {
            const checked = selected.includes(option.slug);
            return (
              <label key={option.slug} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition ${checked ? 'border-[#efb3ad] bg-white shadow-sm' : 'border-slate-200 bg-white/60 hover:border-slate-300'}`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(option.slug)} className="sr-only" />
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${checked ? 'border-[#db4c3f] bg-[#db4c3f] text-white' : 'border-slate-300 bg-white text-transparent'}`}><FaCheck className="text-[9px]" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold leading-snug text-slate-800">{option.name}</span>
                  {option.cadence && <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">{cadenceLabel(option.cadence)}</span>}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {networkOptions.length > 0 && (
        <button type="button" onClick={() => setModalOpen(true)} className="group mb-4 flex w-full items-center justify-between gap-3 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/70 px-3.5 py-3 text-left transition hover:border-blue-200 hover:shadow-sm">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#173bdc] shadow-sm"><FaCompass /></span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700"><HipostaMiniMark /><span>ile daha fazlasını keşfet</span></span>
              <span className="mt-0.5 block truncate text-[10px] text-slate-400">{selectedNetworkSlugs.length > 0 ? `${selectedNetworkSlugs.length} ek bülten seçili` : `${networkOptions.length} aktif ağ bülteni`}</span>
            </span>
          </span>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-slate-400 shadow-sm transition group-hover:translate-x-0.5 group-hover:text-[#173bdc]"><FaArrowRight className="text-[10px]" /></span>
        </button>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-posta adresin" required className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#db4c3f] focus:ring-4 focus:ring-red-50" />
          <button type="submit" disabled={submitting || loadingOptions || selected.length === 0 || !consent} className="shrink-0 rounded-xl bg-[#db4c3f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#b03d32] disabled:cursor-not-allowed disabled:bg-slate-300">
            {submitting ? <FaSpinner className="animate-spin" /> : 'Abone Ol'}
          </button>
        </div>
        <input type="text" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-px w-px opacity-0" />
      </form>

      <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[10px] leading-relaxed text-slate-400">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#db4c3f] focus:ring-[#db4c3f]" />
        <span>Seçtiğim bültenleri e-posta ile almak istiyorum. <Link href="/kvkk" className="font-semibold text-slate-500 underline underline-offset-2 hover:text-[#db4c3f]">KVKK Aydınlatma Metni</Link></span>
      </label>

      {status === 'error' && <p className="mt-2 text-xs font-semibold text-red-500">{message}</p>}
      <HipostaNewsletterModal open={modalOpen} options={networkOptions} selected={selectedNetworkSlugs} onClose={closeModal} onApply={applyNetworkSelection} />
    </div>
  );
}
