"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const choices = [
  { value: "copyright", label: "Telif hakkı / izinsiz kullanım" },
  { value: "identity", label: "Hesap veya içerik sahipliği" },
  { value: "privacy", label: "Kişisel bilgiler / gizlilik" },
  { value: "inaccurate", label: "Yanlış veya yanıltıcı tarif" },
  { value: "other", label: "Diğer" },
];

export default function ContentReportForm() {
  const search = useSearchParams();
  const recipeId = Number(search.get("recipe"));
  const validId = Number.isSafeInteger(recipeId) && recipeId > 0;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("copyright");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState<number | null>(null);
  const [website, setWebsite] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validId || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/content-report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipeId, name, email, reason, details, website }),
      });
      const data = await response.json();
      if (!response.ok || data.success !== true || !Number.isSafeInteger(data.reference)) {
        throw new Error(typeof data.message === "string" ? data.message : "Başvuru alınamadı.");
      }
      setReference(data.reference);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Bağlantı kurulamadı. Lütfen tekrar dene.");
    } finally { setBusy(false); }
  };
  if (!validId) return <p className="text-slate-600">Tarif bağlantısı eksik. Lütfen itiraz butonunu tarif sayfasından kullan.</p>;
  if (reference) return (
    <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
      <h2 className="text-xl font-semibold text-emerald-900">Başvurun alındı</h2>
      <p className="mt-2 text-emerald-900">Başvuru numaran: #{reference}. İçerik yayından otomatik kaldırılmaz; editörlerimiz talebini inceleyecek.</p>
      <Link href="/recipes" className="mt-4 inline-block font-semibold underline">Tariflere dön</Link>
    </div>
  );
  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-8">
      <p className="text-sm leading-6 text-slate-600">Tarif #{recipeId} ile ilgili itirazını editörlerimize ilet. Talebin özel bir kayıt olarak değerlendirilir. Gerektiğinde verdiğin e-posta adresinden iletişime geçilebilir.</p>
      <div className="hidden" aria-hidden><label>Web sitesi<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)} /></label></div>
      <label className="block text-sm font-medium text-slate-800">Ad soyad
        <input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={100} required
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-brand" />
      </label>
      <label className="block text-sm font-medium text-slate-800">E-posta
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={160} required
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-brand" />
      </label>
      <label className="block text-sm font-medium text-slate-800">İtiraz nedeni
        <select value={reason} onChange={e=>setReason(e.target.value)}
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-brand">
          {choices.map(c=><option value={c.value} key={c.value}>{c.label}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-800">Açıklama
        <textarea value={details} onChange={e=>setDetails(e.target.value)} required minLength={20} maxLength={3000} rows={6}
          placeholder="İlgili hak sahipliğini, hatayı veya kaldırma gerekçeni ayrıntılı biçimde açıkla."
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-brand" />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="rounded-xl bg-brand px-6 py-3 font-semibold text-white disabled:opacity-50">
        {busy ? "Gönderiliyor…" : "İtiraz talebini gönder"}
      </button>
    </form>
  );
}
