import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";

export const metadata = {
  title: "KVKK Aydınlatma Metni | Tariften",
  description: "Tariften.com kişisel verilerin korunması ve işlenmesi hakkında aydınlatma metni.",
};

export default function KVKKPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#db4c3f] mb-8 transition">
        <FaArrowLeft /> Anasayfaya Dön
      </Link>
      
      <h1 className="text-4xl font-bold font-heading text-slate-900 mb-2">Kişisel Verilerin Korunması ve İşlenmesine İlişkin Aydınlatma Metni</h1>
      <p className="text-slate-500 mb-8">Son Güncelleme: Ocak 2026</p>
      
      <div className="prose prose-slate max-w-none">
        
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Veri Sorumlusu</h2>
          <p>İşbu Aydınlatma Metni ile, HİP Medya (&quot;Şirket&quot;) tarafından yönetilmekte olan www.tariften.com adresinde yer alan internet sitesi kullanıcılarına sağladığı hizmetler sırasında elde edilen kişisel verilerin işlenmesi ve korunmasına ilişkin olarak veri sahiplerinin aydınlatılması amaçlanmaktadır.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Hangi Kişisel Verilerinizi Topluyoruz?</h2>
          <ul className="space-y-2">
            <li><strong>Kayıt bilgileriniz:</strong> Üye olurken paylaştığınız bilgiler</li>
            <li><strong>Kullanım bilgileriniz:</strong> Trafik bilgileri ve tercihleriniz</li>
            <li><strong>Cihaz bilgileriniz:</strong> IP adresi, tarayıcı bilgisi</li>
            <li><strong>Üçüncü taraf hesaplarınızdaki bilgiler:</strong> Google vb.</li>
            <li><strong>Konum bilgileriniz ve çerezleriniz</strong></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Kişisel Verilerinizin İşlenme Amaçları</h2>
          <ul className="space-y-2">
            <li>Üyelik başvuru ve kayıt işlemleri</li>
            <li>Kullanıcı ve hesap tanımlamaları</li>
            <li>Kimlik doğrulama</li>
            <li>Optimizasyon ve teknik geliştirmeler</li>
            <li>Dijital veya diğer mecralarda reklam ve tanıtım faaliyetleri</li>
            <li>Kişiselleştirilmiş içerik akışları</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Kişisel Verilerinizin Aktarıldığı Taraflar</h2>
          <p>Toplanan kişisel verileriniz, Kanun&apos;da öngörülen temel ilkelere uygun olarak üçüncü kişilere ve kanunen yetkili kamu kurum ve kuruluşlarına aktarılabilmektedir.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Kişisel Veri Sahibi Olarak Haklarınız</h2>
          <ul className="space-y-2">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
            <li>Kişisel verilerinizin işlenme amacını öğrenme</li>
            <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
            <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme</li>
            <li>Kişisel verilerin silinmesini veya yok edilmesini isteme</li>
          </ul>
        </section>

        <div className="mt-12 p-6 bg-slate-50 rounded-2xl">
          <p className="text-sm text-slate-600">
            <strong>Başvuru:</strong> Kişisel verilerinizle ilgili taleplerinizi{" "}
            <a href="mailto:iletisim@tariften.com" className="text-[#db4c3f] hover:underline font-medium">iletisim@tariften.com</a>{" "}
            adresine iletebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
