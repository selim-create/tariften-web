import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#db4c3f] mb-8 transition">
        <FaArrowLeft /> Anasayfaya Dön
      </Link>
      <h1 className="text-4xl font-bold font-heading text-slate-900 mb-6">Kullanım Koşulları</h1>
      <div className="prose prose-slate text-slate-600">
        <p>Son Güncelleme: 15 Aralık 2025</p>
        <p>Tariften.com'a hoş geldiniz. Bu web sitesini kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız...</p>
        {/* İçerik buraya eklenebilir */}
        <p>(Bu sayfa yapım aşamasındadır.)</p>
      </div>
    </div>
  );
}