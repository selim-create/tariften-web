"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAccountQuotas, fetchAccountQuotas, quotaReached, quotaReset } from "@/lib/account-quotas-client";
import { generateAIMenu, advanceMenuJob, retryMenuJob, fetchMenuJob, findMenuJob, type MenuJob } from "@/lib/menu-jobs-client";
import { ArrowLeft, ArrowRight, Check, LogIn, Pencil, Salad, Users, UtensilsCrossed, WandSparkles } from "lucide-react";
import { Accent, BTN_GHOST, BTN_OUTLINE, BTN_PRIMARY, CHIP, CHIP_OFF, CHIP_ON, Crumbs, FOCUS, GuestStepper, INPUT, LABEL, Notice } from "@/components/menu/MenuStudio";

const MENU_STORAGE = "tariften_active_menu_job_v2";
const SIGN_IN_MESSAGE = "Menü hazırlamak için giriş yapmalısınız.";
const STEPS = ["Konsept", "Detaylar", "Onay"];
const EVENT_TYPES = ["Kahvaltı", "Öğle Yemeği", "Beş Çayı", "Akşam Yemeği", "Kokteyl"];
const DIETS = ["Normal", "Vejetaryen", "Vegan", "Glutensiz", "Düşük Karb"];
// One tap fills the concept; the reader can still type anything.
const IDEAS = ["Yılbaşı sofrası", "Vegan brunch", "İtalyan gecesi", "Doğum günü", "Pazar kahvaltısı"];

function messageOf(error: unknown): string {
  if (!(error instanceof Error)) {
    return "İşlem tamamlanamadı. Mevcut menü durumunu kontrol edin.";
  }
  // React #441 is an opaque production Server Components/RSC exception;
  // raw framework internals are not a useful message for readers.
  if (/minified react error|react\.dev\/errors\/441|server components render/i.test(error.message)) {
    return "Geçici bir sunucu görüntüleme hatası oluştu. Kayıtlı menünüz korunuyor; kaldığınız yerden devam edebilirsiniz.";
  }
  return error.message;
}

export default function CreateMenuPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Concept, 2: Details, 3: Review
  const [job, setJob] = useState<MenuJob | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  // Core 1.0.51 marks a dish refused for a declared allergen with this code.
  const allergenFailures = (job?.failures ?? [])
    .filter(failure => failure.error === "ai_allergen_conflict" && failure.name)
    .map(failure => failure.name);
  const quotas = useAccountQuotas(user?.token);
  const [recoveryCheckedFor, setRecoveryCheckedFor] = useState("");
  // Never expose one signed-in account's saved job to a second account.
  const storageKey = `${MENU_STORAGE}:${user?.id ?? "guest"}`;

  
  const [formData, setFormData] = useState({
    concept: "",
    guest_count: 4,
    event_type: "Akşam Yemeği",
    diet: "Normal",
    cuisine: "Türk"
  });

  useEffect(() => {
    const token = user?.token;
    if (!token || recoveryCheckedFor === storageKey) return;
    // One-shot guard per account: the saved job is looked up exactly once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecoveryCheckedFor(storageKey);
    (async () => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;
        const saved = JSON.parse(raw) as { id?: number; requestId?: string; formData?: typeof formData };
        if (saved.formData?.concept) {
          setFormData(saved.formData);
        }
        const recovered = saved.id
          ? await fetchMenuJob(token, saved.id)
          : saved.requestId ? await findMenuJob(token, saved.requestId) : null;
        if (recovered) {
          setJob(recovered);
          setStep(3);
          if (recovered.status === "ready" && recovered.slug) {
            localStorage.removeItem(storageKey);
            router.push(`/menu/${recovered.slug}`);
          }
        } else {
          setErrorMessage("Önceki menü isteğinin kaydı bulunamadı. Tekrar denemeden önce WordPress menülerini kontrol edin.");
        }
      } catch (error) {
        setErrorMessage("Önceki menü sorgulanamadı: " + messageOf(error));
      }
    })();
  }, [user?.token, router, recoveryCheckedFor, storageKey]);

  const continueMenuJob = async (initial: MenuJob) => {
    if (!user?.token) return;
    let current = initial;
    setLoading(true);
    setErrorMessage("");
    try {
      // At most one recipe per request. Each progress point persists server-side.
      for (let attempt = 0; attempt < 100; attempt++) {
        if (current.status === "ready") {
          localStorage.removeItem(storageKey);
          router.push(`/menu/${current.slug}`);
          return;
        }
        if (current.status === "needs_attention") {
          setJob(current);
          setErrorMessage(current.message || "Bazı tarifler oluşturulamadı. Menü taslak olarak saklandı.");
          return;
        }
        const previousCompleted = current.completed;
        try {
          current = await advanceMenuJob(user.token, current.id);
        } catch (error) {
          // A response can be lost while WordPress successfully saves a step.
          // Inspect the durable cursor before any retry, never restart the menu.
          let latest: MenuJob;
          try {
            latest = await fetchMenuJob(user.token, current.id);
          } catch {
            // Even status lookup can fail during an infrastructure incident.
            // The durable request remains in localStorage; never create a
            // second menu and pay for the same planned dishes.
            throw new Error("Sunucuyla bağlantı kesildi. Menü kayıtlı; biraz sonra Kaldığım Yerden Devam Et seçeneğini kullanın.");
          }
          setJob(latest);
          current = latest;
          if (latest.status === "ready" || latest.status === "needs_attention"
              || latest.completed > previousCompleted) {
            // Important: the response may have been lost AFTER the PHP step
            // was committed. Continue from the persisted result, not the
            // thrown transport error, to avoid fake failures.
            continue;
          }
          if (messageOf(error).includes("hâlâ")) {
            await new Promise(resolve => setTimeout(resolve, 1800));
            continue;
          }
          throw new Error(
            "Bu tarif isteğinin yanıtı alınamadı. " +
            latest.completed + "/" + latest.total +
            " tarif kaydedildi; biraz sonra aynı menüden güvenle devam edebilirsiniz."
          );
        }
        setJob(current);
        const stored = localStorage.getItem(storageKey);
        let savedRequestId = "";
        try { savedRequestId = stored ? (JSON.parse(stored) as { requestId?: string }).requestId || "" : ""; } catch {}
        localStorage.setItem(storageKey, JSON.stringify({ id: current.id, requestId: savedRequestId, formData }));
        if (current.status === "generating" && current.completed === previousCompleted) {
          // The previous request may still be running; avoid rapid polling.
          await new Promise(resolve => setTimeout(resolve, 1800));
        }
      }
      throw new Error("İşlem planlanandan uzun sürdü. Menü kaydedildi; kaldığınız yerden devam edebilirsiniz.");
    } catch (error) {
      setErrorMessage(messageOf(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.token) {
      setErrorMessage(SIGN_IN_MESSAGE);
      return;
    }
    if (loading) return;
    setErrorMessage("");
    if (job) {
      if (job.status === "needs_attention") {
        setLoading(true);
        try {
          // Only a deliberate button click can request additional paid
          // attempts for previously failed recipes. Completed items persist.
          const restarted = await retryMenuJob(user.token, job.id);
          setJob(restarted);
          await continueMenuJob(restarted);
        } catch (error) {
          setErrorMessage(messageOf(error));
        } finally {
          setLoading(false);
        }
        return;
      }
      await continueMenuJob(job);
      return;
    }
    // The quota must never prevent continuing an already reserved menu.
    // For a NEW menu, refresh on click so a stale tab cannot mislead users.
    if (!localStorage.getItem(storageKey)) {
      const fresh = await fetchAccountQuotas(user.token).catch(() => null);
      if (quotaReached(fresh, "menu_month")) {
        setErrorMessage("Aylık menü hakkın doldu. Yeni hak: " + quotaReset(fresh, "menu_month"));
        return;
      }
    }
    setLoading(true);
    const savedRaw = localStorage.getItem(storageKey);
    let requestId = crypto.randomUUID();
    if (savedRaw) {
      try {
        const stored = JSON.parse(savedRaw) as { requestId?: string };
        if (stored.requestId) requestId = stored.requestId;
      } catch { /* Invalid browser state. Start with fresh UUID. */ }
    }
    localStorage.setItem(storageKey, JSON.stringify({ requestId, formData }));
    let started: MenuJob | null = null;
    try {
      started = await generateAIMenu(user.token, formData, requestId);
    } catch (error) {
      // If the initial HTTP response times out AFTER creating the draft,
      // locate it by the same request ID rather than generating it again.
      try { started = await findMenuJob(user.token, requestId); } catch { /* preserve original error */ }
      if (!started) {
        setErrorMessage(messageOf(error) + " Yeni bir menü oluşturmadan önce menü kayıtlarını kontrol edin.");
      }
    } finally {
      setLoading(false);
    }
    if (!started) return;
    setJob(started);
    localStorage.setItem(storageKey, JSON.stringify({ id: started.id, requestId, formData }));
    await continueMenuJob(started);
  };

  const headingRef = useRef<HTMLHeadingElement>(null);
  const goTo = (target: number) => {
    setStep(target);
    // Keyboard and screen-reader users land on the new step's question.
    requestAnimationFrame(() => headingRef.current?.focus());
  };
  const next = () => goTo(step + 1);
  const back = () => goTo(step - 1);
  const conceptReady = formData.concept.trim() !== "";
  // The sign-in card below already says why; no second, duplicate warning.
  const signedOut = !authLoading && !user;
  const quotaBlocked = !job && recoveryCheckedFor === storageKey && quotaReached(quotas.data, "menu_month") && (typeof window === "undefined" || !localStorage.getItem(storageKey));

  if (loading) {
    const percent = job?.total ? Math.round(100 * job.completed / job.total) : 0;
    return (
      <main className="min-h-screen bg-[#fcfcfc] px-4 pb-24 pt-16 sm:pt-24">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div aria-hidden className="relative mb-9 grid h-20 w-20 place-items-center">
            <span className="absolute inset-0 rounded-full border-4 border-[#f6efe8] dark:border-slate-700" />
            <span className="absolute inset-0 animate-spin rounded-full border-4 border-brand border-t-transparent motion-reduce:animate-none" />
            <WandSparkles className="h-7 w-7 text-brand" />
          </div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">Yapay zekâ şefi çalışıyor</p>
          <h1 className="font-heading text-[34px] font-bold leading-[1.06] tracking-[-0.03em] text-slate-900 text-balance sm:text-[44px]">
            <Accent text="Menün *hazırlanıyor.*" />
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-500">
            “{formData.concept}” konseptine uygun, {formData.guest_count} kişilik menün hazırlanıyor.
            Tarifler sırayla oluşturuluyor; bu ekranı kapatırsan daha sonra kaldığın yerden devam edebilirsin.
          </p>
          {job && (
            <div className="mt-9 w-full rounded-2xl border border-gray-200 bg-white p-5 text-left" aria-live="polite">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-slate-700">Hazırlanan tarifler</span>
                <span className="font-semibold tabular-nums text-slate-900">{job.completed} / {job.total}</span>
              </div>
              <div role="progressbar" aria-label="Hazırlanan tarifler" aria-valuemin={0} aria-valuemax={job.total || 0} aria-valuenow={job.completed}
                className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${percent}%` }} />
              </div>
              <span className="mt-3 block text-xs text-slate-500">{job.message || "Tarif hazırlanıyor..."}</span>
            </div>
          )}
          <p className="sr-only">Görseller tarifler kaydedildikten sonra arka planda tamamlanabilir.</p>
        </div>
      </main>
    );
  }

  const heading = step === 1
    ? { title: "Bugün neyi *kutluyoruz?*", text: "Özel bir davet, romantik bir akşam yemeği ya da kendini şımartacağın bir pazar kahvaltısı. Bir iki kelime yeter." }
    : step === 2
      ? { title: "Biraz *detay* verelim.", text: "Kaç kişilik bir sofra, hangi öğün ve nasıl bir beslenme tercihi?" }
      : job
        ? { title: "Kaldığın yerden *devam et.*", text: "Bu menü için başlattığın hazırlık kayıtlı. Yeni menü açmadan aynı yerden sürdürebilirsin." }
        : { title: "Her şey *hazır.*", text: "Son bir kez göz at. Menüyü oluşturduğunda yapay zekâ şefimiz tarifleri tek tek hazırlar." };

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24">
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Crumbs items={[{ label: "Anasayfa", href: "/" }, { label: "Menüler", href: "/menus" }, { label: "Yeni menü" }]} />

        {/* Progress */}
        <ol aria-label="Menü oluşturma adımları" className="mt-8 grid grid-cols-3 gap-2 sm:mt-12">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            return (
              <li key={label} aria-current={step === n ? "step" : undefined}>
                <span aria-hidden className={`block h-1 rounded-full transition-colors ${step >= n ? "bg-brand" : "bg-gray-200 dark:bg-slate-700"}`} />
                <span className={`mt-2.5 flex items-center gap-1.5 text-xs font-medium ${step === n ? "text-slate-900" : done ? "text-slate-600" : "text-slate-400"}`}>
                  {done ? <Check className="h-3.5 w-3.5 text-brand" aria-hidden /> : <span aria-hidden className="tabular-nums">{n}</span>}
                  {label}
                  {done && <span className="sr-only">, tamamlandı</span>}
                </span>
              </li>
            );
          })}
        </ol>

        <header className="mt-10 sm:mt-12">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">Yeni menü · Adım {step} / 3</p>
          <h1 ref={headingRef} tabIndex={-1} className="font-heading text-[34px] font-bold leading-[1.06] tracking-[-0.03em] text-slate-900 outline-none text-balance sm:text-[46px]">
            <Accent text={heading.title} />
          </h1>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-slate-500">{heading.text}</p>
        </header>

        <div className="mt-8 sm:mt-10">
          {/* STEP 1: CONCEPT */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); if (conceptReady) next(); }}
              className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-8">
              <label htmlFor="menu-concept" className={LABEL}>Menünün konsepti</label>
              <input
                id="menu-concept"
                type="text"
                autoFocus
                autoComplete="off"
                enterKeyHint="next"
                value={formData.concept}
                onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                placeholder="ör. Yılbaşı, vegan brunch, İtalyan gecesi"
                className={`${INPUT} h-14 text-lg`}
              />
              <div className="mt-6">
                <span id="menu-ideas" className="text-[13px] text-slate-500">Aklına bir şey gelmediyse:</span>
                <div role="group" aria-labelledby="menu-ideas" className="mt-2 flex flex-wrap gap-2">
                  {IDEAS.map(idea => {
                    const selected = formData.concept === idea;
                    return (
                      <button key={idea} type="button" aria-pressed={selected}
                        onClick={() => setFormData({ ...formData, concept: idea })}
                        className={`${CHIP} ${selected ? CHIP_ON : CHIP_OFF}`}>
                        {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                        {idea}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
                <button type="submit" disabled={!conceptReady} className={`${BTN_PRIMARY} w-full sm:w-auto`}>
                  Devam et <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
            <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-8">
              <div className="space-y-8">
                <div>
                  <h2 id="menu-guests" className="flex items-center gap-2 font-heading text-base font-semibold text-slate-900">
                    <Users className="h-4 w-4 text-gray-400" aria-hidden /> Kişi sayısı
                  </h2>
                  <span className="mb-3 mt-0.5 block text-sm text-gray-500">1–20 kişi arası</span>
                  <GuestStepper labelledBy="menu-guests" min={1} max={20} value={formData.guest_count}
                    onChange={(guest_count) => setFormData({ ...formData, guest_count })} />
                </div>

                <div>
                  <h2 id="menu-event" className="mb-3 flex items-center gap-2 font-heading text-base font-semibold text-slate-900">
                    <UtensilsCrossed className="h-4 w-4 text-gray-400" aria-hidden /> Öğün tipi
                  </h2>
                  <div role="group" aria-labelledby="menu-event" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {EVENT_TYPES.map(option => {
                      const selected = formData.event_type === option;
                      return (
                        <button key={option} type="button" aria-pressed={selected}
                          onClick={() => setFormData({ ...formData, event_type: option })}
                          className={`flex min-h-12 items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left text-[15px] font-medium transition ${FOCUS} ${selected ? CHIP_ON : CHIP_OFF}`}>
                          <span>{option}</span>
                          <span aria-hidden className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? "border-brand bg-brand text-white" : "border-gray-300 dark:border-slate-500"}`}>
                            {selected && <Check className="h-3 w-3" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h2 id="menu-diet" className="mb-3 flex items-center gap-2 font-heading text-base font-semibold text-slate-900">
                    <Salad className="h-4 w-4 text-gray-400" aria-hidden /> Diyet tercihi
                  </h2>
                  <div role="group" aria-labelledby="menu-diet" className="flex flex-wrap gap-2">
                    {DIETS.map(opt => {
                      const selected = formData.diet === opt;
                      return (
                        <button key={opt} type="button" aria-pressed={selected}
                          onClick={() => setFormData({ ...formData, diet: opt })}
                          className={`${CHIP} ${selected ? CHIP_ON : CHIP_OFF}`}>
                          {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={back} className={BTN_GHOST}>
                  <ArrowLeft className="h-4 w-4" aria-hidden /> Geri
                </button>
                <button type="button" onClick={next} className={BTN_PRIMARY}>
                  Son adım <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && (
            <div className="space-y-4">
              {job && (
                <Notice tone="ok" title="Kaydedilmiş menü bulundu.">
                  {job.completed}/{job.total} tarif hazır. Yeni menü başlatmadan kaldığınız yerden devam edebilirsiniz.
                </Notice>
              )}
              {errorMessage && !(signedOut && errorMessage === SIGN_IN_MESSAGE) && <Notice tone="warn">
                {errorMessage}
                {allergenFailures.length > 0 && (
                  <span className="mt-2 block text-xs leading-5">
                    Alerji listendeki malzemeler olmadan hazırlanamayan: {allergenFailures.join(", ")}. Bu yemekler için yeniden deneme de aynı kurala uyar.{" "}
                    <Link href="/profile/kitchen" className="font-semibold underline underline-offset-2">Alerji bilgimi düzenle</Link>
                  </span>
                )}
              </Notice>}
              {signedOut && (
                <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  <span>Menüyü hazırlamak için giriş yapman gerekiyor. Seçimlerin bu sayfada kalır.</span>
                  <Link href={`/login?callbackUrl=${encodeURIComponent("/menu/create")}`} className={`${BTN_OUTLINE} shrink-0`}>
                    <LogIn className="h-4 w-4" aria-hidden /> Giriş yap
                  </Link>
                </div>
              )}

              <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-heading text-lg font-semibold text-slate-900">Menü özeti</h2>
                  <button type="button" onClick={back} className={`${BTN_GHOST} -mr-3`}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> Düzenle
                  </button>
                </div>
                <dl className="mt-3 divide-y divide-gray-100 dark:divide-slate-700">
                  {[
                    ["Konsept", formData.concept],
                    ["Kişi", `${formData.guest_count} kişi`],
                    ["Öğün", formData.event_type],
                    ["Tercih", formData.diet],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-4 py-3">
                      <dt className="text-sm text-gray-500">{label}</dt>
                      <dd className="min-w-0 text-right text-[15px] font-semibold text-slate-900 [overflow-wrap:anywhere]">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 border-t border-gray-100 pt-6">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={quotaBlocked}
                    className={`${BTN_PRIMARY} w-full`}
                  >
                    <WandSparkles className="h-4 w-4" aria-hidden />
                    {job ? (job.status === "ready" ? "Menüyü aç" : job.status === "needs_attention" ? "Başarısız tarifleri yeniden dene (ücretli olabilir)" : "Kaldığım yerden devam et") : "Menüyü oluştur"}
                  </button>
                  <span className="mt-3 block text-center text-[13px] leading-relaxed text-slate-500">
                    {quotaBlocked
                      ? `Aylık menü hakkın doldu.${quotaReset(quotas.data, "menu_month") ? ` Yeni hak: ${quotaReset(quotas.data, "menu_month")}` : ""}`
                      : "Tarifler sırayla hazırlanır; ekranı kapatsan da kaldığın yerden devam edebilirsin."}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
