import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";

export const metadata = {
  title: "KVKK Aydınlatma Metni | Tariften",
  description:
    "Tariften.com kişisel verilerin korunması ve işlenmesi hakkında aydınlatma metni.",
};

export default function KVKKPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-[#db4c3f] mb-8 transition"
      >
        <FaArrowLeft /> Anasayfaya Dön
      </Link>

      <h1 className="text-4xl font-bold font-heading text-slate-900 mb-2">
        Kişisel Verilerin Korunması ve İşlenmesine İlişkin Aydınlatma Metni
      </h1>
      <p className="text-slate-500 mb-8">Son Güncelleme: Ocak 2026</p>

      <div className="prose prose-slate max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            1. Veri Sorumlusu
          </h2>
          <p>
            İşbu Kişisel Verilerin Korunması ve İşlenmesine İlişkin Aydınlatma
            Metni (“Aydınlatma Metni”) ile, HİP Medya (“Şirket”) tarafından
            yönetilmekte olan ve www.tariften.com adresinde yer alan internet
            sitesi kullanıcılarına sağladığı çevrimiçi veya çevrimdışı
            (“Platform” olarak anılacaktır) hizmetler sırasında, kullanıcılar
            tarafından Şirket’imize sağlanan ve kullanıcıların Platform’u
            kullanımı sırasında elde edilen kişisel verilerin işlenmesi ve
            korunmasına ilişkin olarak veri sahiplerinin aydınlatılması
            amaçlanmaktadır. Bu kapsamda, kişisel verileriniz Veri Sorumlusu
            sıfatıyla HİP Medya tarafından, 6698 sayılı Kişisel Verilerin
            Korunması Kanunu (“Kanun”) uyarınca aşağıda açıklanan kapsamda
            işlenebilecektir.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            2. Hangi Kişisel Verilerinizi Topluyoruz?
          </h2>
          <p>
            Siteyi ve Platformları üye veya ziyaretçi olarak kullandığınızda,
            sizden kayıt bilgilerinizi (Site veya Platformlara üye olurken
            paylaştığınız bilgileri), kullanım bilgilerinizi (Site’yi ve
            Platformları kullanırken oluşturduğunuz trafik bilgilerini ve ilgi
            alanlarınız gibi tercihlerinizi), cihaz bilgilerinizi (Site’yi ve
            Platformları hangi cihaz ve tarayıcı ile ziyaret ettiğinizi, IP
            adresinizi), üçüncü taraf hesaplarınızdaki bilgilerinizi (Facebook,
            Twitter, Google vb. kişisel üçüncü taraf hesaplarınızdan “Platform”
            ile kendi onayınızla paylaştığınız bilgileri), konum bilgilerinizi ve
            çerezlerinizi toplayabiliriz.
          </p>

          <ul className="space-y-2 mt-4">
            <li>
              <strong>Kayıt bilgileriniz:</strong> Site veya Platformlara üye
              olurken paylaştığınız bilgiler
            </li>
            <li>
              <strong>Kullanım bilgileriniz:</strong> Trafik bilgileri, ilgi
              alanları ve tercihler
            </li>
            <li>
              <strong>Cihaz bilgileriniz:</strong> Cihaz/tarayıcı bilgisi ve IP
              adresi
            </li>
            <li>
              <strong>Üçüncü taraf hesaplarınız:</strong> Facebook, Twitter,
              Google vb. hesaplardan onayınızla paylaşılan bilgiler
            </li>
            <li>
              <strong>Konum bilgileriniz ve çerezleriniz</strong>
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            3. Kişisel Verilerinizin İşlenme Amaçları
          </h2>
          <p>
            Platform kapsamında sunulan hizmetlerden (“Hizmetler”)
            faydalanmanızın sağlanması sırasında elde edilen kişisel verileriniz,
            Kanun’da öngörülen temel ilkelere uygun olarak ve Kanun’un 5. ve 6.
            maddelerinde belirtilen kişisel veri işleme şartları dahilinde;
            üyelik başvuru ve kayıt işlemleri; kullanıcı ve hesap tanımlamaları;
            kimlik doğrulama; optimizasyon ve teknik geliştirmelerin
            gerçekleştirilmesi; kurumsal iletişim ve marka yönetimi; iş
            geliştirme; dijital veya diğer mecralarda reklam ve tanıtım
            faaliyetlerinin yönetimi; üye ilişkilerinin yönetimi ile memnuniyet
            ve bağlılığın artırılmasına yönelik aktiviteler; Platform’da
            yayınlanan içeriklerin kullanıcıların tercihlerine göre
            özelleştirilmesi; kişiselleştirilmiş içerik akışları vb.
            fonksiyonların sunulması ve geliştirilmesi; Platform’da yayınlanan
            içerikler ile etkileşimlerin sağlanması; kullanıcıların tarafından
            oluşturulan içeriklerin yayınlanması, önerilmesi ve tanıtılması ile
            bilgi ve sistem güvenliğine ilişkin amaçlarla (“Amaçlar”)
            işlenmektedir.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            4. Kişisel Verilerinizin Aktarıldığı Taraflar ve Aktarım Amaçları
          </h2>
          <p>
            Toplanan kişisel verileriniz, Kanun’da öngörülen temel ilkelere uygun
            olarak ve Kanun’un 8. ve 9. maddelerinde belirtilen kişisel veri
            işleme şartları dahilinde, Şirketimiz tarafından Amaçlar’ın
            gerçekleştirilmesi kapsamında; Şirket’imizin hizmetlerinden
            faydalandığı üçüncü kişilere ve hukuken bağlayıcı talepler
            doğrultusunda kanunen yetkili kamu kurum ve kuruluşları ile özel kişi
            ve kuruluşlara aktarılabilmektedir.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            5. Kişisel Verilerinizin Toplanma Yöntemi ve Hukuki Sebebi
          </h2>
          <p>
            Şirket’imiz tarafından işlenmekte olan kişisel verileriniz, Platform’u
            kullanırken ve/veya Platform’da üyelik oluşturduğunuz sırada, internet
            sitesi kanalıyla elektronik ortamda elde edilmektedir.
          </p>
          <p>
            Kişisel verileriniz, tercihleriniz doğrultusunda Platform’u
            kullanımınız sırasında Hizmetler’den faydalanmanızın sağlanması
            amacıyla sözleşmenin ifası ve HİP Medya ile paylaşmış olduğunuz
            içeriklerin yayınlanması kapsamında ilgili kişi tarafından
            alenileştirilmiş olma hukuki sebeplerine dayalı olarak
            işlenmektedir.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            6. Kişisel Veri Sahibi Olarak Kanun’un 11. Maddesinde Sayılan
            Haklarınız
          </h2>
          <p>
            Kişisel veri sahibi olarak Kanun’un 11. maddesi uyarınca aşağıdaki
            haklara sahip olduğunuzu bildiririz:
          </p>

          <ul className="space-y-2">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
            <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,</li>
            <li>
              Kişisel verilerinizin işlenme amacını ve bunların amacına uygun
              kullanılıp kullanılmadığını öğrenme,
            </li>
            <li>
              Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı
              üçüncü kişileri bilme,
            </li>
            <li>
              Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde
              bunların düzeltilmesini isteme ve bu kapsamda yapılan işlemin
              kişisel verilerinizin aktarıldığı üçüncü kişilere bildirilmesini
              isteme,
            </li>
            <li>
              Kanun’a ve ilgili diğer kanun hükümlerine uygun olarak işlenmiş
              olmasına rağmen, işlenmesini gerektiren sebeplerin ortadan kalkması
              hâlinde kişisel verilerin silinmesini veya yok edilmesini isteme
              ve bu kapsamda yapılan işlemin kişisel verilerinizin aktarıldığı
              üçüncü kişilere bildirilmesini isteme,
            </li>
            <li>
              İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz
              edilmesi suretiyle aleyhinize bir sonucun ortaya çıkması durumunda
              buna itiraz etme,
            </li>
            <li>
              Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle
              zarara uğramanız hâlinde zararın giderilmesini talep etme.
            </li>
          </ul>

          <p className="mt-4">
            Yukarıda sayılan haklarınıza yönelik başvurularınızı veya
            bilgilerinizin silinmesiyle ilgili taleplerinizi, Veri Sorumlusuna
            Başvuru Usul ve Esasları Hakkında Tebliğ hükümleri kapsamında aşağıda
            belirtilen yöntemlerle en geç 30 gün içerisinde yanıtlanmak üzere
            Şirket’imize iletebilirsiniz:
          </p>
        </section>

        <div className="mt-12 p-6 bg-slate-50 rounded-2xl">
          <p className="text-sm text-slate-600">
            <strong>Başvuru:</strong> Taleplerinizi{" "}
            <a
              href="mailto:iletisim@tariften.com"
              className="text-[#db4c3f] hover:underline font-medium"
            >
              iletisim@tariften.com
            </a>{" "}
            adresine iletebilirsiniz.
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
