"use client";

import { useState, useEffect, useRef, useMemo, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getPantry, updatePantry, analyzePantry, generateAIRecipe, createRecipe } from "@/lib/api";
import { PantryItem } from "@/types";
import {
  CalendarDays, Camera, Check, CircleAlert, CookingPot, LifeBuoy, Loader2, Plus, Sparkles, Trash2, X,
} from "lucide-react";
import PageIntro from "@/components/account/PageIntro";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";

// --- TYPES ---
type SaveStatus = "saved" | "saving" | "error";
type AiActionType = "rescue" | "suggest";
type Urgency = "expired" | "today" | "soon" | "week" | "fresh" | "none";
type Notice = { tone: "success" | "error" | "info"; message: string; login?: boolean } | null;

// --- TARİH HESAPLAMA ---
const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateLocal = (dateStr: string) => {
  if (!dateStr || dateStr === "0000-00-00") return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

const addDays = (days: number) => {
  const result = new Date();
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + days);
  return formatDateLocal(result);
};

/** Days left until the item's own date. No date means no guess. */
function analyse(expiry: string | null | undefined): { urgency: Urgency; days: number | null; text: string } {
  const date = parseDateLocal(expiry || "");
  if (!date) return { urgency: "none", days: null, text: "Tarih yok" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { urgency: "expired", days, text: `${Math.abs(days)} gün geçti` };
  if (days === 0) return { urgency: "today", days, text: "Bugün son gün" };
  if (days <= 3) return { urgency: "soon", days, text: `${days} gün kaldı` };
  if (days <= 7) return { urgency: "week", days, text: `${days} gün kaldı` };
  return { urgency: "fresh", days, text: `${days} gün kaldı` };
}

/** Legacy status field the API stores (fresh | warning | expired). */
const storedStatus = (expiry: string | null | undefined): "fresh" | "warning" | "expired" => {
  const { urgency } = analyse(expiry);
  return urgency === "expired" || urgency === "today" || urgency === "soon" ? "expired" : urgency === "week" ? "warning" : "fresh";
};

const CHIP: Record<Urgency, string> = {
  expired: "bg-red-50 text-red-700 ring-red-100",
  today: "bg-red-50 text-red-700 ring-red-100",
  soon: "bg-orange-50 text-orange-700 ring-orange-100",
  week: "bg-amber-50 text-amber-800 ring-amber-100",
  fresh: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  none: "bg-gray-50 text-gray-500 ring-gray-200",
};
const ORDER: Record<Urgency, number> = { expired: 0, today: 1, soon: 2, week: 3, fresh: 4, none: 5 };

export default function PantryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState<PantryItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const isDirty = useRef<boolean>(false);

  const [notice, setNotice] = useState<Notice>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempDateInput, setTempDateInput] = useState("");
  const [aiLoading, setAiLoading] = useState<null | AiActionType>(null);

  // --- YARDIMCI: GÖRSEL SIKIŞTIRMA ---
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL(file.type));
          } else reject(new Error("Canvas hatası"));
        };
        img.onerror = (error) => reject(error);
      };
    });
  };

  // --- 1. VERİLERİ YÜKLE ---
  useEffect(() => {
    if (authLoading) return;

    async function loadData() {
      try {
        if (user) {
          const data = await getPantry(user.token || "");
          if (data && Array.isArray(data)) {
            setItems(data.map((i: PantryItem) => {
              const expiresIn = (i.expiresIn === "0000-00-00" || !i.expiresIn) ? "" : i.expiresIn;
              return { ...i, expiresIn, status: storedStatus(expiresIn) };
            }));
          }
        } else {
          const saved = localStorage.getItem("tariften_pantry");
          if (saved) setItems(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Veri yükleme hatası:", e);
      } finally {
        setLoading(false);
        setIsLoaded(true);
      }
    }
    loadData();
  }, [user, authLoading]);

  // --- 2. VERİLERİ KAYDET ---
  useEffect(() => {
    if (authLoading || !isLoaded || !isDirty.current) return;

    const timeoutId = setTimeout(async () => {
      if (user) {
        const payload = items.map(i => ({
          name: i.name,
          quantity: i.quantity || "",
          unit: i.unit || "",
          status: storedStatus(i.expiresIn),
          expiresIn: i.expiresIn || "",
        }));
        if (user.token) {
          const success = await updatePantry(user.token, payload as unknown as PantryItem[]);
          setSaveStatus(success ? "saved" : "error");
        }
      } else {
        try { localStorage.setItem("tariften_pantry", JSON.stringify(items)); } catch { /* storage blocked */ }
        setSaveStatus("saved");
      }
      isDirty.current = false;
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [items, user, isLoaded, authLoading]);

  const updateItems = (newItems: PantryItem[]) => {
    setItems(newItems);
    isDirty.current = true;
    setSaveStatus("saving");
  };

  // --- MANUEL EKLEME ---
  // "Süt 3 gün" sets a date; "Yumurta" alone stays undated (no invented expiry).
  const handleManualAdd = () => {
    if (!inputValue.trim()) return;

    const rawInputs = inputValue.split(",").map(s => s.trim()).filter(s => s);
    const newItems: PantryItem[] = rawInputs.map(input => {
      const match = input.match(/^(.*?)\s+(\d+)\s*(gün|gun|day|hafta|week|ay|month)s?$/i);
      let name = input;
      let expiryDate = "";
      if (match) {
        name = match[1].trim();
        const amount = parseInt(match[2]);
        const unit = match[3].toLowerCase();
        let daysToAdd = 0;
        if (unit.includes("gün") || unit.includes("gun") || unit.includes("day")) daysToAdd = amount;
        if (unit.includes("hafta") || unit.includes("week")) daysToAdd = amount * 7;
        if (unit.startsWith("ay") || unit.includes("month")) daysToAdd = amount * 30;
        if (daysToAdd > 0) expiryDate = addDays(daysToAdd);
      }
      return {
        id: Date.now() + Math.random(),
        name: name.charAt(0).toLocaleUpperCase("tr-TR") + name.slice(1),
        quantity: "",
        unit: "",
        status: storedStatus(expiryDate),
        expiresIn: expiryDate,
      };
    });

    updateItems([...newItems, ...items]);
    setInputValue("");
  };

  // --- FİŞ OKUTMA ---
  const handleReceiptUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!user || !user.token) { setNotice({ tone: "info", message: "Fiş okutmak için giriş yapman gerekiyor.", login: true }); return; }
    if (file.size > 10 * 1024 * 1024) { setNotice({ tone: "error", message: "Dosya çok büyük; en fazla 10 MB olabilir." }); return; }

    setAnalyzing(true);
    setNotice(null);
    try {
      const resizedBase64 = await resizeImage(file);
      const analyzedItems = await analyzePantry(user.token, "", resizedBase64);
      const newItems: PantryItem[] = (analyzedItems || []).map((item: { name: string; quantity?: string; expiry_date?: string }) => {
        const date = item.expiry_date || "";
        return {
          id: Date.now() + Math.random(),
          name: item.name,
          quantity: item.quantity || "",
          unit: "",
          status: storedStatus(date),
          expiresIn: date,
        };
      });
      updateItems([...newItems, ...items]);
      setNotice({ tone: "success", message: newItems.length > 0 ? `Fişten ${newItems.length} ürün eklendi. Tarihi olmayanlara bir göz at.` : "Fişte okunabilir bir ürün bulamadık." });
    } catch {
      setNotice({ tone: "error", message: "Fiş okunamadı. Daha net bir fotoğrafla tekrar dener misin?" });
    } finally {
      setAnalyzing(false);
    }
  };

  const removeItem = (id: number) => {
    updateItems(items.filter((item) => item.id !== id));
  };

  const saveDate = (value: string) => {
    if (!editingItemId) return;
    updateItems(items.map(item => String(item.id) === editingItemId
      ? { ...item, expiresIn: value, status: storedStatus(value) }
      : item));
    setEditingItemId(null);
  };

  useEffect(() => {
    if (!editingItemId) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setEditingItemId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingItemId]);

  const rows = useMemo(() => items
    .map(item => ({ item, info: analyse(item.expiresIn) }))
    .sort((a, b) => ORDER[a.info.urgency] - ORDER[b.info.urgency]
      || (a.info.days ?? 9999) - (b.info.days ?? 9999)), [items]);

  const counts = useMemo(() => {
    const c = { critical: 0, week: 0, fresh: 0, none: 0 };
    rows.forEach(({ info }) => {
      if (info.urgency === "expired" || info.urgency === "today" || info.urgency === "soon") c.critical++;
      else if (info.urgency === "week") c.week++;
      else if (info.urgency === "fresh") c.fresh++;
      else c.none++;
    });
    return c;
  }, [rows]);

  const handleAiAction = async (type: AiActionType) => {
    if (!user || !user.token) { setNotice({ tone: "info", message: "Şefe sormak için giriş yapman gerekiyor.", login: true }); return; }

    let prompt = "";
    if (type === "rescue") {
      const critical = rows.filter(({ info }) => ["expired", "today", "soon", "week"].includes(info.urgency));
      if (critical.length === 0) { setNotice({ tone: "success", message: "Şu an kurtarılması gereken bir şey yok. Dolabın gayet iyi durumda." }); return; }
      prompt = critical.map(({ item }) => item.name).join(", ");
    } else {
      if (items.length === 0) { setNotice({ tone: "info", message: "Dolabın boş. Önce birkaç malzeme ekle." }); return; }
      prompt = items.map(i => i.name).join(", ");
    }

    setAiLoading(type);
    setNotice(null);
    try {
      const aiResponse = await generateAIRecipe(user.token, prompt);
      if (aiResponse.success && aiResponse.recipe) {
        const saveResponse = await createRecipe(user.token, aiResponse.recipe);
        if (saveResponse.success) {
          router.push(`/recipe/${saveResponse.slug || saveResponse.id}`);
          return;
        }
        setNotice({ tone: "error", message: "Tarif hazırlandı ama kaydedilemedi. Birazdan tekrar dener misin?" });
      } else {
        setNotice({ tone: "error", message: "Şef şu an yanıt veremedi. Birazdan tekrar dene." });
      }
    } catch {
      setNotice({ tone: "error", message: "Bir şeyler ters gitti. Birazdan tekrar dene." });
    }
    setAiLoading(null);
  };

  if (loading || authLoading) {
    return <main role="status" className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-gray-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Dolap açılıyor…
    </main>;
  }

  const editing = editingItemId ? items.find(i => String(i.id) === editingItemId) : null;

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24 text-slate-800">
      <PageIntro crumb="Dolap Modu" kicker={`Dolap modu${items.length > 0 ? ` · ${items.length} malzeme` : ""}`}
        title="Dolapta ne varsa, *ona göre* pişir.">
        Evdekileri yaz, son kullanma tarihine göre sıralayalım. Bozulmak üzere olanları şef kurtarsın; çöpe giden domates üzülmesin.
      </PageIntro>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pt-10 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-5 lg:col-span-7">
          {/* Ekleme kartı */}
          <section aria-labelledby="pantry-add" className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 sm:p-6">
            {analyzing && (
              <div role="status" className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/90 text-sm font-semibold text-brand">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Fiş okunuyor…
              </div>
            )}
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="pantry-add" className="font-heading text-lg font-bold text-slate-900">Dolaba ekle</h2>
              <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-brand/40 hover:text-brand focus-within:outline-2 focus-within:outline-brand">
                <Camera className="h-4 w-4" aria-hidden /> Fiş okut
                <input type="file" accept="image/*" className="sr-only" onChange={handleReceiptUpload} />
              </label>
            </div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleManualAdd(); }}>
              <label htmlFor="pantry-input" className="sr-only">Malzeme ekle</label>
              <input id="pantry-input" type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                placeholder="Örn. Süt 3 gün, yumurta, kaşar peyniri"
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] transition focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10" />
              <button type="submit" aria-label="Ekle"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-700">
                <Plus className="h-5 w-5" />
              </button>
            </form>
            <p className="mt-3 text-xs leading-5 text-gray-500">
              Virgülle birden fazla ekleyebilirsin. “Süt 3 gün” yazarsan son kullanma tarihini ben ayarlarım; yazmazsan tarihsiz kalır.
            </p>
            {!user && (
              <p className="mt-2 text-xs leading-5 text-gray-500">
                Giriş yapmadan eklediklerin yalnızca bu tarayıcıda durur. <Link href="/login" className="font-semibold text-brand hover:underline">Giriş yap</Link>, her cihazda seninle olsun.
              </p>
            )}
          </section>

          {notice && (
            <div role="status" className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${notice.tone === "error" ? "border-red-200 bg-red-50 text-red-800" : notice.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-gray-200 bg-white text-slate-700"}`}>
              {notice.tone === "error" ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
              <p className="flex-1">
                {notice.message}
                {notice.login && <> <Link href="/login" className="font-semibold text-brand hover:underline">Giriş yap</Link></>}
              </p>
              <button type="button" onClick={() => setNotice(null)} aria-label="Bildirimi kapat" className="text-current opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
            </div>
          )}

          {/* Liste */}
          <section aria-labelledby="pantry-list">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id="pantry-list" className="font-heading text-lg font-bold text-slate-900">Dolabın</h2>
              <p className="text-xs text-gray-500" aria-live="polite">
                {saveStatus === "saving" ? "Kaydediliyor…" : saveStatus === "error" ? <span className="text-red-600">Kaydedilemedi, bir sonraki değişiklikte tekrar denenecek.</span> : items.length > 0 ? "Son kullanma tarihine göre sıralı" : ""}
              </p>
            </div>
            {rows.length > 0 ? (
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-200 bg-white">
                {rows.map(({ item, info }) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f6efe8]">
                      <LokmaIngredientIcon name={item.name} size="lg" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{item.name}</p>
                      {item.quantity && <p className="truncate text-xs text-gray-500">{item.quantity}{item.unit ? ` ${item.unit}` : ""}</p>}
                    </div>
                    <button type="button" onClick={() => { setEditingItemId(String(item.id)); setTempDateInput(item.expiresIn || ""); }}
                      aria-label={`${item.name} için son kullanma tarihini ${item.expiresIn ? "değiştir" : "ekle"}`}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition hover:brightness-95 ${CHIP[info.urgency]}`}>
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                      {info.urgency === "none" ? "Tarih ekle" : info.text}
                    </button>
                    <button type="button" onClick={() => removeItem(item.id)} aria-label={`${item.name} dolaptan çıkar`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-300 transition hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                <div className="mb-4 flex -space-x-2">
                  {["yumurta", "domates", "peynir"].map(name => (
                    <span key={name} className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f6efe8] ring-4 ring-white"><LokmaIngredientIcon name={name} size="lg" /></span>
                  ))}
                </div>
                <p className="font-heading text-lg font-semibold text-slate-900">Dolabın tertemiz. Biraz fazla temiz.</p>
                <p className="mt-1 max-w-sm text-sm text-gray-500">Evde ne varsa yukarıya yaz; ne pişireceğini birlikte bulalım.</p>
              </div>
            )}
          </section>
        </div>

        {/* Sağ: Şef */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
          <section aria-labelledby="pantry-chef" className="rounded-3xl bg-slate-900 p-6 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f08a7f]">Şefe sor</p>
            <h2 id="pantry-chef" className="mt-2 font-heading text-2xl font-bold leading-tight">Bugün dolaptan <span className="italic text-[#f08a7f]">ne çıkar?</span></h2>
            <div className="mt-5 space-y-2">
              <button type="button" onClick={() => handleAiAction("rescue")} disabled={aiLoading !== null}
                className="flex w-full items-center gap-4 rounded-2xl bg-brand p-4 text-left transition hover:bg-brand-dark disabled:opacity-70">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15"><LifeBuoy className="h-5 w-5" aria-hidden /></span>
                <span className="min-w-0">
                  <span className="block font-semibold">Bozulacakları kurtar</span>
                  <span className="block text-xs text-white/80">
                    {counts.critical + counts.week > 0 ? `${counts.critical + counts.week} malzeme bu hafta değerlendirilmeli` : "Şu an acil bir şey yok"}
                  </span>
                </span>
              </button>
              <button type="button" onClick={() => handleAiAction("suggest")} disabled={aiLoading !== null}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-700 p-4 text-left transition hover:border-slate-500 hover:bg-slate-800 disabled:opacity-70">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-800"><Sparkles className="h-5 w-5 text-[#f08a7f]" aria-hidden /></span>
                <span className="min-w-0">
                  <span className="block font-semibold">Dolaptakilerle tarif öner</span>
                  <span className="block text-xs text-slate-400">Elindekilerden bir tarif hazırlansın</span>
                </span>
              </button>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">Şefin hazırladığı tarif hesabına kaydedilir ve tarif sayfası açılır.</p>
          </section>

          {items.length > 0 && (
            <section aria-label="Dolap durumu" className="rounded-3xl border border-gray-200 bg-white p-5">
              <dl className="grid grid-cols-4 gap-2 text-center">
                {([
                  ["Acil", counts.critical, "text-red-600"],
                  ["Bu hafta", counts.week, "text-amber-700"],
                  ["Taze", counts.fresh, "text-emerald-700"],
                  ["Tarihsiz", counts.none, "text-gray-500"],
                ] as const).map(([label, value, color]) => (
                  <div key={label}>
                    <dd className={`font-heading text-2xl font-bold tabular-nums ${color}`}>{value}</dd>
                    <dt className="mt-0.5 text-[11px] text-gray-500">{label}</dt>
                  </div>
                ))}
              </dl>
              <div aria-hidden className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className="bg-red-500" style={{ width: `${(counts.critical / items.length) * 100}%` }} />
                <div className="bg-amber-400" style={{ width: `${(counts.week / items.length) * 100}%` }} />
                <div className="bg-emerald-500" style={{ width: `${(counts.fresh / items.length) * 100}%` }} />
              </div>
            </section>
          )}
        </aside>
      </div>

      {editing && (
        <div role="presentation" className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setEditingItemId(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="pantry-date-title" className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f6efe8]"><LokmaIngredientIcon name={editing.name} size="lg" /></span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Son kullanma</p>
                  <h2 id="pantry-date-title" className="font-heading text-lg font-bold text-slate-900">{editing.name}</h2>
                </div>
              </div>
              <button type="button" onClick={() => setEditingItemId(null)} aria-label="Kapat" className="grid h-9 w-9 place-items-center rounded-full text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <label htmlFor="pantry-date" className="sr-only">Son kullanma tarihi</label>
            <input id="pantry-date" type="date" value={tempDateInput} onChange={(e) => setTempDateInput(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-brand/40 focus:outline-none focus:ring-4 focus:ring-brand/10" />
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 3, 7, 14].map(days => (
                <button key={days} type="button" onClick={() => setTempDateInput(addDays(days))}
                  className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand/40 hover:text-brand">
                  {days === 1 ? "Yarın" : `${days} gün`}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              {editing.expiresIn && (
                <button type="button" onClick={() => saveDate("")} className="h-12 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-slate-600 hover:border-gray-300">Tarihi kaldır</button>
              )}
              <button type="button" onClick={() => saveDate(tempDateInput)} disabled={!tempDateInput}
                className="h-12 flex-1 rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-dark disabled:opacity-40">Kaydet</button>
            </div>
          </section>
        </div>
      )}

      {aiLoading && (
        <div role="status" className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-brand"><CookingPot className="h-8 w-8" aria-hidden /></div>
            <h2 className="font-heading text-xl font-bold text-slate-900">Şef dolabına bakıyor…</h2>
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {aiLoading === "rescue" ? "Bozulmak üzere olanlara bir tarif bulunuyor" : "Elindekilerden bir tarif hazırlanıyor"}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
