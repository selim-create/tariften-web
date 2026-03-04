import { Metadata } from "next";
import Link from "next/link";
import { FaTrashCan, FaEnvelope, FaMobileScreen, FaCircleInfo, FaClock, FaShieldHalved } from "react-icons/fa6";

export const metadata: Metadata = {
  title: "Hesap Silme Talebi — Tariften",
  description: "Tariften hesabınızı ve ilişkili verilerinizi nasıl silebileceğinizi öğrenin.",
};

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-[#fcfcfc] py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Başlık */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTrashCan className="text-red-500 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 font-heading">Hesap Silme Talebi</h1>
          <p className="text-slate-500 text-sm mt-2">
            Tariften hesabınızı ve ilişkili verilerinizi silmek istiyorsanız aşağıdaki adımları izleyin.
          </p>
        </div>

        {/* Uygulama İçinden */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <FaMobileScreen className="text-brand" /> Uygulama İçinden
          </h2>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-brand/10 text-brand rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
              Tariften uygulamasını açın
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-brand/10 text-brand rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <strong>Profil</strong> sekmesine gidin
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-brand/10 text-brand rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <strong>Profili Düzenle</strong> sayfasını açın
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-brand/10 text-brand rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
              En alttaki <strong className="text-red-500">&quot;Hesabımı Sil&quot;</strong> butonuna tıklayın
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-brand/10 text-brand rounded-full flex items-center justify-center text-xs font-bold shrink-0">5</span>
              Onay kutusuna <strong>&quot;HESABIMI SIL&quot;</strong> yazarak işlemi onaylayın
            </li>
          </ol>
        </div>

        {/* E-posta İle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <FaEnvelope className="text-brand" /> E-posta İle
          </h2>
          <p className="text-sm text-slate-600">
            Hesap silme talebinizi{" "}
            <a href="mailto:iletisim@tariften.com" className="text-brand font-bold hover:underline">
              iletisim@tariften.com
            </a>{" "}
            adresine, hesabınızda kayıtlı e-posta adresinizden gönderin.
          </p>
        </div>

        {/* Silinen Veriler */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <FaShieldHalved className="text-brand" /> Silinen Veriler
          </h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0"></span>
              Hesap bilgileri (ad, e-posta, kullanıcı adı)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0"></span>
              Profil fotoğrafı
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0"></span>
              Favori ve pişirdiklerim listesi
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0"></span>
              Dolap verileri
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0"></span>
              Oluşturulan tarifler
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0"></span>
              Yorumlar
            </li>
          </ul>
        </div>

        {/* Saklama Süresi */}
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 mb-6">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
            <FaClock className="text-amber-500" /> Saklama Süresi
          </h2>
          <p className="text-sm text-slate-600">
            Hesap silme talebi alındıktan sonra tüm verileriniz <strong>30 gün içinde</strong> kalıcı olarak silinir.
          </p>
        </div>

        {/* Bilgi Notu */}
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 mb-8">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
            <FaCircleInfo className="text-blue-500" /> Önemli Not
          </h2>
          <p className="text-sm text-slate-600">
            Hesabınızı sildikten sonra aynı e-posta adresi ile yeniden kayıt olabilirsiniz, ancak eski verileriniz geri getirilemez.
          </p>
        </div>

        {/* Footer Link */}
        <div className="text-center">
          <Link href="/" className="text-sm text-brand font-bold hover:underline">
            ← Ana Sayfaya Dön
          </Link>
        </div>

      </div>
    </main>
  );
}
