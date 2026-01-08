import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";

export const metadata = {
  title: "Kullanım Koşulları | Tariften",
  description: "Tariften.com kullanım koşulları ve kullanıcı sözleşmesi.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#db4c3f] mb-8 transition">
        <FaArrowLeft /> Anasayfaya Dön
      </Link>
      
      <h1 className="text-4xl font-bold font-heading text-slate-900 mb-2">Kullanıcı Sözleşmesi</h1>
      <p className="text-slate-500 mb-8">Son Güncelleme: Ocak 2026</p>
      
      <div className="prose prose-slate max-w-none">
        <p className="lead text-lg text-slate-600 mb-8">
          Bu Kullanıcı Sözleşmesi, HİP Medya&apos;nın www.tariften.com internet adresinde yer alan platform ile kullanıcılarına sağladığı hizmetlerin çerçevesini oluşturur.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Sözleşme&apos;nin Konusu ve Kapsamı</h2>
          <p>Sözleşme&apos;nin konusu, Platform&apos;dan erişilen ve Platform&apos;da paylaşılan fotoğraf, resim, görsel, yazı, yorum, video ve diğer tüm içeriklere ilişkin usul ve esasların çerçevesinin çizilmesi, Kullanıcı&apos;nın Platform&apos;dan ve Platform&apos;da sunulan hizmetlerden faydalanmasına ilişkin hüküm ve koşulların belirlenmesi ve bu doğrultuda Taraflar&apos;ın hak ve yükümlülüklerinin düzenlenmesidir.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Taraflar&apos;ın Hak ve Yükümlülükleri</h2>
          <ul className="space-y-3">
            <li>Kullanıcı, Platform&apos;dan faydalanmak için Şirket tarafından talep edilen bilgileri tam, doğru ve güncel bir şekilde sağlayarak işbu Sözleşme&apos;yi onaylaması gerektiğini kabul eder.</li>
            <li>Kullanıcı statüsünün tesisi için sağlanan bilgilerde değişiklik olması halinde, Kullanıcı söz konusu bilgileri derhal güncelleyecektir.</li>
            <li>Kullanıcı, Platform&apos;un kullanımına imkan veren hesaplar, kullanıcı adı ve şifre dahil tüm bilgilerin kullanım ve yönetiminden bizzat sorumludur.</li>
            <li>Kullanıcı, Platform&apos;da gerçekleştireceği tüm işlemlerde kanuna, ahlaka ve dürüstlük ilkelerine uyacaktır.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">3. İçerik Paylaşımı Koşulları</h2>
          <p>Platform&apos;da gerçekleştirilebilecek içerik paylaşımı faaliyetlerinin münhasıran Kullanıcılar tarafından yapıldığı kabul edilir. Şirket, yalnızca içerik paylaşımı işlemlerinin gerçekleştirilebilmesi için Kullanıcılar&apos;a bir platform sunmaktadır.</p>
          <p className="mt-4">Kullanıcı, Platform&apos;da sunduğu içerikler üzerinde sahip olduğu tüm hakları herhangi bir süre, amaç ve yer sınırlaması olmaksızın Şirket&apos;e devretmeyi taahhüt eder.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Sorumluluğun Sınırlandırılması</h2>
          <p>Şirket, Platform&apos;a girilmesi, Platform&apos;un kullanılması veya Platform&apos;da paylaşılan içerikler sebebiyle doğabilecek doğrudan ya da dolaylı hiçbir zarardan ağır kusuru dışında sorumlu değildir.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Uyuşmazlıkların Çözümü</h2>
          <p>Bu Sözleşme ile ilgili çıkabilecek uyuşmazlıklarda Türkiye Cumhuriyeti Kanunları uygulanacaktır. İstanbul Merkez Mahkemeleri ve İcra Daireleri yetkilidir.</p>
        </section>

        <div className="mt-12 p-6 bg-slate-50 rounded-2xl">
          <p className="text-sm text-slate-500">
            Bu sözleşme, Platform&apos;u kullanmaya başladığınız anda yürürlüğe girer. Sorularınız için{" "}
            <a href="mailto:iletisim@tariften.com" className="text-[#db4c3f] hover:underline">iletisim@tariften.com</a> adresinden bize ulaşabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}