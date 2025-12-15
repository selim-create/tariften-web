import Link from "next/link";
import { FaArrowLeft, FaEnvelope } from "react-icons/fa6";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#db4c3f] mb-8 transition">
        <FaArrowLeft /> Anasayfaya Dön
      </Link>
      <h1 className="text-4xl font-bold font-heading text-slate-900 mb-6">İletişim & Reklam</h1>
      <p className="text-slate-600 mb-8">
        Öneri, şikayet veya işbirliği teklifleriniz için bize her zaman ulaşabilirsiniz.
      </p>
      
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <FaEnvelope />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">E-posta Gönderin</h3>
        <p className="text-slate-500 mb-6">En kısa sürede dönüş yapacağız.</p>
        <a href="mailto:info@tariften.com" className="text-xl font-bold text-[#db4c3f] hover:underline">
            info@tariften.com
        </a>
      </div>
    </div>
  );
}