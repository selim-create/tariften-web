import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#db4c3f] mb-8 transition">
        <FaArrowLeft /> Anasayfaya Dön
      </Link>
      <h1 className="text-4xl font-bold font-heading text-slate-900 mb-6">Hakkımızda</h1>
      <div className="prose prose-slate lg:prose-lg text-slate-600">
        <p>
          Tariften.com, mutfaktaki en büyük yardımcınız olmak için tasarlandı. Yapay zeka destekli altyapımız sayesinde, elinizdeki malzemelerle yapabileceğiniz en lezzetli yemekleri saniyeler içinde bulabilirsiniz.
        </p>
        <p>
          Amacımız, mutfaklarda israfı önlemek ve "Bugün ne pişirsem?" sorusuna en pratik, en lezzetli ve en kişisel cevapları vermektir.
        </p>
      </div>
    </div>
  );
}