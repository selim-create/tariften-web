import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#db4c3f] mb-8 transition">
        <FaArrowLeft /> Anasayfaya Dön
      </Link>
      <h1 className="text-4xl font-bold font-heading text-slate-900 mb-6">Gizlilik Politikası</h1>
      <div className="prose prose-slate text-slate-600">
        <p>Tariften.com olarak gizliliğinize önem veriyoruz. Kişisel verilerinizin nasıl işlendiği hakkında bilgi almak için...</p>
        {/* İçerik buraya eklenebilir */}
        <p>(Bu sayfa yapım aşamasındadır.)</p>
      </div>
    </div>
  );
}