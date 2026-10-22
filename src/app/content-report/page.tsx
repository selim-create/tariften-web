import { Suspense } from "react";
import ContentReportForm from "@/components/recipe/ContentReportForm";

export const metadata = { title: "İçeriğe İtiraz Et | Tariften", robots: { index: false, follow: false } };

export default function ContentReportPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Tariften destek</p>
      <h1 className="mb-4 mt-3 font-heading text-3xl font-bold text-slate-900">İçeriğe itiraz et</h1>
      <p className="mb-8 text-slate-600">Sosyal medyadan aktarılan bir tarifin düzeltilmesini veya kaldırılmasını talep edebilirsin.</p>
      <Suspense fallback={<p>Form yükleniyor…</p>}><ContentReportForm /></Suspense>
    </main>
  );
}
