import LegalPage, { LEGAL_LINK, LegalContact, LegalSectionBlock } from "@/components/legal/LegalPage";

export const metadata = {
  title: "KVKK Aydınlatma Metni | Tariften",
  description:
    "Tariften.com kişisel verilerin korunması ve işlenmesi hakkında aydınlatma metni.",
};

const SECTIONS = [
  { id: "veri-sorumlusu", label: "1. Veri Sorumlusu" },
  { id: "toplanan-veriler", label: "2. Hangi Kişisel Verilerinizi Topluyoruz?" },
  { id: "isleme-amaclari", label: "3. Kişisel Verilerinizin İşlenme Amaçları" },
  { id: "aktarim", label: "4. Kişisel Verilerinizin Aktarıldığı Taraflar ve Aktarım Amaçları" },
  { id: "toplama-yontemi", label: "5. Kişisel Verilerinizin Toplanma Yöntemi ve Hukuki Sebebi" },
  { id: "haklariniz", label: "6. Kişisel Veri Sahibi Olarak Kanun’un 11. Maddesinde Sayılan Haklarınız" },
  { id: "basvuru", label: "Başvuru" },
];

const LIST = "list-disc space-y-2 pl-5 marker:text-brand";

export default function KVKKPage() {
  return (
    <LegalPage kicker="KVKK Aydınlatma Metni"
      title="Kişisel Verilerin Korunması ve İşlenmesine İlişkin Aydınlatma Metni"
      updated="Son Güncelleme: Ocak 2026" sections={SECTIONS}>
      <LegalSectionBlock id="veri-sorumlusu" title="1. Veri Sorumlusu">
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
      </LegalSectionBlock>

      <LegalSectionBlock id="toplanan-veriler" title="2. Hangi Kişisel Verilerinizi Topluyoruz?">
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

        <ul className={LIST}>
          <li>
            <strong className="font-semibold text-slate-900">Kayıt bilgileriniz:</strong> Site veya Platformlara üye
            olurken paylaştığınız bilgiler
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Kullanım bilgileriniz:</strong> Trafik bilgileri, ilgi
            alanları ve tercihler
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Cihaz bilgileriniz:</strong> Cihaz/tarayıcı bilgisi ve IP
            adresi
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Üçüncü taraf hesaplarınız:</strong> Facebook, Twitter,
            Google vb. hesaplardan onayınızla paylaşılan bilgiler
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Konum bilgileriniz ve çerezleriniz</strong>
          </li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="isleme-amaclari" title="3. Kişisel Verilerinizin İşlenme Amaçları">
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
      </LegalSectionBlock>

      <LegalSectionBlock id="aktarim" title="4. Kişisel Verilerinizin Aktarıldığı Taraflar ve Aktarım Amaçları">
        <p>
          Toplanan kişisel verileriniz, Kanun’da öngörülen temel ilkelere uygun
          olarak ve Kanun’un 8. ve 9. maddelerinde belirtilen kişisel veri
          işleme şartları dahilinde, Şirketimiz tarafından Amaçlar’ın
          gerçekleştirilmesi kapsamında; Şirket’imizin hizmetlerinden
          faydalandığı üçüncü kişilere ve hukuken bağlayıcı talepler
          doğrultusunda kanunen yetkili kamu kurum ve kuruluşları ile özel kişi
          ve kuruluşlara aktarılabilmektedir.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="toplama-yontemi" title="5. Kişisel Verilerinizin Toplanma Yöntemi ve Hukuki Sebebi">
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
      </LegalSectionBlock>

      <LegalSectionBlock id="haklariniz" title="6. Kişisel Veri Sahibi Olarak Kanun’un 11. Maddesinde Sayılan Haklarınız">
        <p>
          Kişisel veri sahibi olarak Kanun’un 11. maddesi uyarınca aşağıdaki
          haklara sahip olduğunuzu bildiririz:
        </p>

        <ul className={LIST}>
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

        <p>
          Yukarıda sayılan haklarınıza yönelik başvurularınızı veya
          bilgilerinizin silinmesiyle ilgili taleplerinizi, Veri Sorumlusuna
          Başvuru Usul ve Esasları Hakkında Tebliğ hükümleri kapsamında aşağıda
          belirtilen yöntemlerle en geç 30 gün içerisinde yanıtlanmak üzere
          Şirket’imize iletebilirsiniz:
        </p>
      </LegalSectionBlock>

      <div id="basvuru" className="scroll-mt-24">
        <LegalContact>
          <p>
            <strong className="font-semibold text-slate-900">Başvuru:</strong> Taleplerinizi{" "}
            <a href="mailto:iletisim@tariften.com" className={LEGAL_LINK}>
              iletisim@tariften.com
            </a>{" "}
            adresine iletebilirsiniz.
          </p>

          <p>
            <strong className="font-semibold text-slate-900">Not:</strong> Eğer gönderim yaptığınız e-posta adresi
            Şirket’imizin sisteminde kayıtlı değilse, başvurunuzun güvenli
            elektronik imza ya da mobil imza ile imzalanması gerekmektedir.
          </p>
        </LegalContact>
      </div>
    </LegalPage>
  );
}
