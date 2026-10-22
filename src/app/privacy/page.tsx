import Link from "next/link";
import { ArrowRight } from "lucide-react";
import LegalPage, { LEGAL_LINK, LegalContact, LegalNote, LegalSectionBlock } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Gizlilik & Çerez Politikası | Tariften",
  description:
    "Tariften.com gizlilik politikası ve çerez kullanımı hakkında bilgilendirme.",
};

const SECTIONS = [
  { id: "kvkk", label: "Kişisel Verilerin Korunması (KVKK)" },
  { id: "cerez-aydinlatma", label: "Çerez Aydınlatma Metni" },
  { id: "cerez-amaclari", label: "1. Hangi Çerezler Hangi Amaçlarla Kullanılmaktadır?" },
  { id: "cerez-kontrol", label: "2. Çerez Kullanımını Nasıl Kontrol Edebilirim?" },
  { id: "iletisim", label: "İletişim" },
];

const H3 = "mb-3 mt-8 scroll-mt-24 font-heading text-[18px] font-semibold leading-snug text-slate-900";
const STRONG = "font-semibold text-slate-900";

export default function PrivacyPage() {
  return (
    <LegalPage kicker="Gizlilik & Çerezler" title="Gizlilik & Çerez Politikası"
      updated="Son Güncelleme: Ocak 2026" sections={SECTIONS}>
      {/* KVKK Kısa Bilgilendirme */}
      <LegalSectionBlock id="kvkk" title="Kişisel Verilerin Korunması (KVKK)">
        <LegalNote title="Veri Sorumlusu">
          <p>HİP Medya - www.tariften.com</p>
        </LegalNote>

        <p>
          Kişisel verilerinizin işlenmesi ve korunmasına ilişkin detaylı
          bilgilendirme için KVKK Aydınlatma Metni sayfamızı inceleyebilirsiniz.
        </p>

        <Link href="/kvkk"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          KVKK Aydınlatma Metni’ne Git <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </LegalSectionBlock>

      {/* Çerez Aydınlatma Metni */}
      <LegalSectionBlock id="cerez-aydinlatma" title="Çerez Aydınlatma Metni">
        <p>
          İşbu Çerez Aydınlatma Metni (“Aydınlatma Metni”) ile HİP medya
          (“Şirket”) tarafından yönetilmekte olan ve www.tariften.com adresinde
          yer alan internet sitesinin kullanıcılarına sağladığı çevrimiçi veya
          çevrimdışı hizmetleri (“Platform” olarak anılacaktır) kullanan
          ziyaretçilerin (“Kullanıcı”) Platform’u kullanımları sırasında
          toplanan çerezlere ilişkin olarak aydınlatılması amaçlanmaktadır.
        </p>

        <p>
          Bu kapsamda, Kullanıcı’nın deneyimini geliştirmek için çerezler,
          pikseller, GIFler vb. birtakım teknolojilerden (“Çerezler”)
          faydalanılmaktadır.
        </p>

        <p>
          Bu teknolojilerin kullanımı, başta 6698 sayılı Kişisel Verilerin
          Korunması Kanunu (“KVKK”) olmak üzere, tabi olduğumuz mevzuata uygun
          şekilde gerçekleştirilmektedir.
        </p>

        <h3 id="cerez-amaclari" className={H3}>
          1. Hangi Çerezler Hangi Amaçlarla Kullanılmaktadır?
        </h3>

        <p>
          Platform’da kullandığımız Çerezler’in başlıca amaçları şunlardır:
        </p>

        <ul className="list-disc space-y-3 pl-5 marker:text-brand">
          <li>
            <strong className={STRONG}>
              Platform’un çalışması için gerekli temel fonksiyonları
              gerçekleştirmek:
            </strong>{" "}
            Örneğin, oturum açan üyelerin Platform’da farklı sayfaları ziyaret
            ederken tekrar şifre girmelerine gerek kalmaması.
          </li>
          <li>
            <strong className={STRONG}>Platform’u analiz etmek, Platform’un performansını artırmak:</strong>{" "}
            Örneğin, Platform’un üzerinde çalıştığı farklı sunucuların
            entegrasyonu, Platform’u ziyaret edenlerin sayısının tespit edilmesi
            ve buna göre performans ayarlarının yapılması ya da Kullanıcı’nın
            aradığını bulmasının kolaylaştırılması.
          </li>
          <li>
            <strong className={STRONG}>
              Platform’un işlevselliğini artırmak ve kullanım kolaylığı sağlamak:
            </strong>{" "}
            Örneğin, Platform üzerinden üçüncü taraf sosyal medya mecralarına
            paylaşımda bulunmak, Platform’u ziyaret eden Kullanıcı’nın daha sonraki
            ziyaretinde kullanıcı adı bilgisinin ya da arama sorgularının
            hatırlanması.
          </li>
          <li>
            <strong className={STRONG}>
              Kişiselleştirme, hedefleme ve reklamcılık faaliyeti gerçekleştirmek:
            </strong>{" "}
            Örneğin, Kullanıcı’nın görüntülediği sayfa ve ürünler veya yaptığı
            seçimler üzerinden Kullanıcı’nın ilgi alanlarıyla bağlantılı
            reklam/içerik gösterilmesi.
          </li>
        </ul>

        <h3 id="cerez-kontrol" className={H3}>
          2. Çerez Kullanımını Nasıl Kontrol Edebilirim?
        </h3>

        <p>
          Çerezler ve benzeri teknolojilerin kullanımı konusunda Kullanıcı
          tercihleri bizler için esastır. Buna karşın Platform’un çalışması için
          zorunlu olan Çerezler’in kullanılması gerekmektedir. Ek olarak, bazı
          Çerezler’in kapatılması halinde Platform’un bazı işlevlerinin kısmen ya da
          tamamen çalışmayabileceğini hatırlatmak isteriz.
        </p>

        <p>
          Çerezleri silebilir veya internet tarayıcınızı çerezleri
          engelleyebilecek şekilde ayarlayabilirsiniz fakat bu halde Platform’da
          yer alan bazı hizmetler olması gerektiği gibi çalışamayabilir.
        </p>

        <p>
          Tarayıcınızdan ayarlarınızı değiştirmediğiniz sürece çerez kullanımını
          kabul etmiş olursunuz.
        </p>
      </LegalSectionBlock>

      <div id="iletisim" className="scroll-mt-24">
        <LegalContact title="İletişim">
          <p>
            Kişisel verilerinizle ilgili taleplerinizi{" "}
            <a href="mailto:iletisim@tariften.com" className={LEGAL_LINK}>
              iletisim@tariften.com
            </a>{" "}
            adresine iletebilirsiniz. Başvurularınız en geç 30 gün içerisinde
            yanıtlanacaktır.
          </p>
          <p>
            <strong className={STRONG}>Not:</strong> Eğer gönderim yaptığınız e-posta adresi
            Şirket’imizin sisteminde kayıtlı değilse, başvurunuzun güvenli
            elektronik imza ya da mobil imza ile imzalanması gerekmektedir.
          </p>
        </LegalContact>
      </div>
    </LegalPage>
  );
}
