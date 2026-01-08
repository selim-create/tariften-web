import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";

export const metadata = {
  title: "Gizlilik & Çerez Politikası | Tariften",
  description: "Tariften.com gizlilik politikası ve çerez kullanımı hakkında bilgilendirme.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#db4c3f] mb-8 transition">
        <FaArrowLeft /> Anasayfaya Dön
      </Link>
      
      <h1 className="text-4xl font-bold font-heading text-slate-900 mb-2">Gizlilik & Çerez Politikası</h1>
      <p className="text-slate-500 mb-8">Son Güncelleme: Ocak 2026</p>
      
      <div className="prose prose-slate max-w-none">
        
        {/* KVKK Bölümü */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Kişisel Verilerin Korunması (KVKK)</h2>
          
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-blue-800 mb-2">Veri Sorumlusu</h3>
            <p className="text-blue-700 text-sm">HİP Medya - www.tariften.com</p>
          </div>

          <h3 className="text-xl font-bold text-slate-700 mt-6 mb-3">Toplanan Kişisel Veriler</h3>
          <ul className="space-y-2">
            <li><strong>Kayıt Bilgileri:</strong> Üye olurken paylaştığınız bilgiler</li>
            <li><strong>Kullanım Bilgileri:</strong> Platform&apos;u kullanırken oluşturduğunuz trafik ve tercih bilgileri</li>
            <li><strong>Cihaz Bilgileri:</strong> Tarayıcı türü, IP adresi</li>
            <li><strong>Üçüncü Taraf Hesapları:</strong> Google vb. hesaplardan paylaştığınız bilgiler</li>
            <li><strong>Konum Bilgileri:</strong> Yaklaşık konum verisi</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-700 mt-6 mb-3">Verilerin İşlenme Amaçları</h3>
          <ul className="space-y-2">
            <li>Üyelik başvuru ve kayıt işlemleri</li>
            <li>Kullanıcı ve hesap tanımlamaları, kimlik doğrulama</li>
            <li>Platform&apos;da yayınlanan içeriklerin kişiselleştirilmesi</li>
            <li>Teknik geliştirmeler ve optimizasyon</li>
            <li>Kurumsal iletişim ve marka yönetimi</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-700 mt-6 mb-3">KVKK Kapsamındaki Haklarınız</h3>
          <ul className="space-y-2">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
            <li>İşlenmesini gerektiren sebeplerin ortadan kalkması halinde silinmesini isteme</li>
          </ul>
        </section>

        {/* Çerez Politikası */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Çerez Politikası</h2>
          
          <p className="mb-4">Deneyiminizi geliştirmek için çerezler, pikseller ve benzeri teknolojilerden faydalanmaktayız.</p>

          <h3 className="text-xl font-bold text-slate-700 mt-6 mb-3">Kullanılan Çerez Türleri</h3>
          
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-slate-800">Zorunlu Çerezler</h4>
              <p className="text-sm text-slate-600">Oturum yönetimi, güvenlik ve temel fonksiyonlar için gereklidir.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-slate-800">Performans Çerezleri</h4>
              <p className="text-sm text-slate-600">Platform performansını analiz etmek ve iyileştirmek için kullanılır.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-slate-800">İşlevsellik Çerezleri</h4>
              <p className="text-sm text-slate-600">Tercihlerinizi hatırlamak ve kullanım kolaylığı sağlamak için kullanılır.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-slate-800">Reklam Çerezleri</h4>
              <p className="text-sm text-slate-600">İlgi alanlarınıza uygun içerik ve reklam göstermek için kullanılır.</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-700 mt-6 mb-3">Çerez Kontrolü</h3>
          <p>Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Ancak bu durumda bazı hizmetler düzgün çalışmayabilir.</p>
        </section>

        <div className="mt-12 p-6 bg-slate-50 rounded-2xl">
          <h3 className="font-bold text-slate-800 mb-2">İletişim</h3>
          <p className="text-sm text-slate-600">
            Kişisel verilerinizle ilgili taleplerinizi{" "}
            <a href="mailto:iletisim@tariften.com" className="text-[#db4c3f] hover:underline">iletisim@tariften.com</a>{" "}
            adresine iletebilirsiniz. Başvurularınız en geç 30 gün içerisinde yanıtlanacaktır.
          </p>
        </div>
      </div>
    </div>
  );
}