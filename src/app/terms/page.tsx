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
          Bu Kullanıcı Sözleşmesi (&quot;Sözleşme&quot;), HİP Medya&apos;nın (&quot;Şirket&quot;) www.tariften.com internet adresinde yer alan site (&quot;Platform&quot;) ile kullanıcılarına (&quot;Kullanıcı&quot;) sağladığı çevrimiçi veya çevrimdışı hizmetlerin çerçevesini oluşturur. &quot;Platform&quot; ve &quot;Kullanıcı&quot; arasında kurulmuş işbu &quot;Sözleşme&quot;, elektronik ortamda &quot;Platform&quot;un ziyaret edilmesiyle yürürlüğe girer.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Sözleşme&apos;nin Konusu ve Kapsamı</h2>
          <p>Sözleşme&apos;nin konusu, Platform&apos;dan erişilen ve Platform&apos;da paylaşılan fotoğraf, resim, görsel, yazı, yorum, video ve diğer tüm içeriklere (&quot;İçerik&quot;) ilişkin usul ve esasların çerçevesinin çizilmesi, Kullanıcı&apos;nın Platform&apos;dan ve Platform&apos;da sunulan hizmetlerden faydalanmasına ilişkin hüküm ve koşulların belirlenmesi ve bu doğrultuda Taraflar&apos;ın hak ve yükümlülüklerinin düzenlenmesidir.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Taraflar&apos;ın Hak ve Yükümlülükleri</h2>
          <ul className="space-y-3">
            <li><strong>2.1.</strong> Kullanıcı, Platform&apos;dan faydalanmak için Şirket tarafından talep edilen bilgileri tam, doğru ve güncel bir şekilde sağlayarak işbu Sözleşme&apos;yi onaylaması gerektiğini bildiğini kabul eder.</li>
            <li><strong>2.2.</strong> Kullanıcı statüsünün tesisi için sağlanan bilgilerde herhangi bir değişiklik olması halinde, Kullanıcı söz konusu bilgileri derhal güncelleyecektir.</li>
            <li><strong>2.3.</strong> Kullanıcı, işbu Sözleşme&apos;yi akdetmek için gereken yasal ehliyete sahip bulunduğunu beyan eder.</li>
            <li><strong>2.4.</strong> Kullanıcı, Platform&apos;un kullanımına imkan veren hesaplar, kullanıcı adı, e-posta adresi ve şifre de dahil olmak üzere tüm bilgilerin kullanım ve yönetiminden bizzat sorumludur.</li>
            <li><strong>2.5.</strong> Kullanıcı Platform&apos;da gerçekleştireceği tüm işlemlerde işbu Sözleşme ile Platform&apos;da yayınlanabilecek koşullar ile kanuna, ahlaka ve adaba, dürüstlük ilkelerine uyacaktır.</li>
            <li><strong>2.6.</strong> Platform&apos;da bulunan yazılım, fotoğraf, resim, görsel ve tasarımların, yazıların, videoların, logoların her türlü hakkı Şirket&apos;e aittir.</li>
            <li><strong>2.7.</strong> Kullanıcı, Platform&apos;da yapılacak iyileştirme ve diğer değişikliklerin uygulanması için Platform&apos;a erişimin geçici olarak kapatılabileceğini kabul eder.</li>
            <li><strong>2.8.</strong> Şirket&apos;in Sözleşme ve Platform üzerinden yayınladığı koşulları dilediği zamanda tek taraflı olarak değiştirme hakkı saklıdır.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">3. İçerik Paylaşımı Faaliyetlerine İlişkin Koşullar</h2>
          <ul className="space-y-3">
            <li><strong>3.1.</strong> Platform&apos;da gerçekleştirilebilecek İçerik paylaşımı faaliyetlerinin münhasıran Kullanıcılar tarafından yapıldığı kabul edilir.</li>
            <li><strong>3.2.</strong> Şirket, İçerikler&apos;in Platform&apos;da yayınlanmasını herhangi bir gerekçe göstermeksizin reddedebilecektir.</li>
            <li><strong>3.3.</strong> Kullanıcı, İçerik&apos;i anlaşılır ve açık bir şekilde hazırlayarak Şirket&apos;e tam ve güncel olarak sağlayacaktır.</li>
          </ul>
        </section>

        <div className="mt-12 p-6 bg-slate-50 rounded-2xl">
          <p className="text-sm text-slate-600">
            <strong>İletişim:</strong> <a href="mailto:iletisim@tariften.com" className="text-[#db4c3f] hover:underline font-medium">iletisim@tariften.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}