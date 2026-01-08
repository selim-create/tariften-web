import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";

export const metadata = {
  title: "Gizlilik & Çerez Politikası | Tariften",
  description:
    "Tariften.com gizlilik politikası ve çerez kullanımı hakkında bilgilendirme.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-[#db4c3f] mb-8 transition"
      >
        <FaArrowLeft /> Anasayfaya Dön
      </Link>

      <h1 className="text-4xl font-bold font-heading text-slate-900 mb-2">
        Gizlilik &amp; Çerez Politikası
      </h1>
      <p className="text-slate-500 mb-8">Son Güncelleme: Ocak 2026</p>

      <div className="prose prose-slate max-w-none">
        {/* KVKK Kısa Bilgilendirme */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Kişisel Verilerin Korunması (KVKK)
          </h2>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-blue-800 mb-2">Veri Sorumlusu</h3>
            <p className="text-blue-700 text-sm">HİP Medya - www.tariften.com</p>
          </div>

          <p className="mb-4">
            Kişisel verilerinizin işlenmesi ve korunmasına ilişkin detaylı
            bilgilendirme için KVKK Aydınlatma Metni sayfamızı inceleyebilirsiniz.
          </p>

          <Link
            href="/kvkk"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-slate-900 text-white no-underline hover:bg-slate-800 transition"
          >
            KVKK Aydınlatma Metni’ne Git
          </Link>
        </section>

        {/* Çerez Aydınlatma Metni */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Çerez Aydınlatma Metni
          </h2>

          <p className="mb-4">
            İşbu Çerez Aydınlatma Metni (“Aydınlatma Metni”) ile HİP medya
            (“Şirket”) tarafından yönetilmekte olan ve www.tariften.com adresinde
            yer alan internet sitesinin kullanıcılarına sağladığı çevrimiçi veya
            çevrimdışı hizmetleri (“Platform” olarak anılacaktır) kullanan
            ziyaretçilerin (“Kullanıcı”) Platform’u kullanımları sırasında
            toplanan çerezlere ilişkin olarak aydınlatılması amaçlanmaktadır.
          </p>

          <p className="mb-4">
            Bu kapsamda, Kullanıcı’nın deneyimini geliştirmek için çerezler,
            pikseller, GIFler vb. birtakım teknolojilerden (“Çerezler”)
            faydalanılmaktadır.
          </p>

          <p className="mb-6">
            Bu teknolojilerin kullanımı, başta 6698 sayılı Kişisel Verilerin
            Korunması Kanunu (“KVKK”) olmak üzere, tabi olduğumuz mevzuata uygun
            şekilde gerçekleştirilmektedir.
          </p>

          <h3 className="text-xl font-bold text-slate-700 mt-6 mb-3">
            1. Hangi Çerezler Hangi Amaçlarla Kullanılmaktadır?
          </h3>

          <p className="mb-3">
            Platform’da kullandığımız Çerezler’in başlıca amaçları şunlardır:
          </p>

          <ul className="space-y-2">
            <li>
              <strong>
                Platform’un çalışması için gerekli temel fonksiyonları
                gerçekleştirmek:
              </strong>{" "}
              Örneğin, oturum açan üyelerin Platform’da farklı sayfaları ziyaret
              ederken tekrar şifre girmelerine gerek kalmaması.
            </li>
            <li>
              <strong>Platform’u analiz etmek, Platform’un performansını artırmak:</strong>{" "}
              Örneğin, Platform’un üzerinde çalıştığı farklı sunucuların
              entegrasyonu, Platform’u ziyaret edenlerin sayısının tespit edilmesi
              ve buna göre performans ayarlarının yapılması ya da Kullanıcı’nın
              aradığını bulmasının kolaylaştırılması.
            </li>
            <li>
              <strong>
                Platform’un işlevselliğini artırmak ve kullanım kolaylığı sağlamak:
              </strong>{" "}
              Örneğin, Platform üzerinden üçüncü taraf sosyal medya mecralarına
              paylaşımda bulunmak, Platform’u ziyaret eden Kullanıcı’nın daha sonraki
              ziyaretinde kullanıcı adı bilgisinin ya da arama sorgularının
              hatırlanması.
            </li>
            <li>
              <strong>
                Kişiselleştirme, hedefleme ve reklamcılık faaliyeti gerçekleştirmek:
              </strong>{" "}
              Örneğin, Kullanıcı’nın görüntülediği sayfa ve ürünler veya yaptığı
              seçimler üzerinden Kullanıcı’nın ilgi alanlarıyla bağlantılı
              reklam/içerik gösterilmesi.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-700 mt-6 mb-3">
            2. Çerez Kullanımını Nasıl Kontrol Edebilirim?
          </h3>

          <p className="mb-4">
            Çerezler ve benzeri teknolojilerin kullanımı konusunda Kullanıcı
            tercihleri bizler için esastır. Buna karşın Platform’un çalışması için
            zorunlu olan Çerezler’in kullanılması gerekmektedir. Ek olarak, bazı
            Çerezler’in kapatılması halinde Platform’un bazı işlevlerinin kısmen ya da
            tamamen çalışmayabileceğini hatırlatmak isteriz.
          </p>

          <p className="mb-4">
            Çerezleri silebilir veya internet tarayıcınızı çerezleri
            engelleyebilecek şekilde ayarlayabilirsiniz fakat bu halde Platform’da
            yer alan bazı hizmetler olması gerektiği gibi çalışamayabilir.
          </p>

          <p className="mb-0">
            Tarayıcınızdan ayarlarınızı değiştirmediğiniz sürece çerez kullanımını
            kabul etmiş olursunuz.
          </p>
        </section>

        <div className="mt-12 p-6 bg-slate-50 rounded-2xl">
          <h3 className="font-bold text-slate-800 mb-2">İletişim</h3>
          <p className="text-sm text-slate-600">
            Kişisel verilerinizle ilgili taleplerinizi{" "}
            <a
              href="mailto:iletisim@tariften.com"
              className="text-[#db4c3f] hover:underline"
            >
              iletisim@tariften.com
            </a>{" "}
            adresine iletebilirsiniz. Başvurularınız en geç 30 gün içerisinde
            yanıtlanacaktır.
          </p>
          <p className="text-sm text-slate-600 mt-3">
            <strong>Not:</strong> Eğer gönderim yaptığınız e-posta adresi
            Şirket’imizin sisteminde kayıtlı değilse, başvurunuzun güvenli
            elektronik imza ya da mobil imza ile imzalanması gerekmektedir.
          </p>
        </div>
      </div>
    </div>
  );
}
