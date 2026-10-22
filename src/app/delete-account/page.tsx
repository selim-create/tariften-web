import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock3, Info, Mail, ShieldCheck, Smartphone } from "lucide-react";
import PageIntro from "@/components/account/PageIntro";

export const metadata: Metadata = {
  title: "Hesap Silme Talebi — Tariften",
  description: "Tariften hesabınızı ve ilişkili verilerinizi nasıl silebileceğinizi öğrenin.",
};

const CARD = "rounded-3xl border border-gray-200 bg-white p-6 sm:p-8";
const CARD_TITLE = "mb-5 flex items-center gap-3 font-heading text-lg font-semibold text-slate-900";
const ICON = "da-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fdf1ea] text-brand";

const STEPS: React.ReactNode[] = [
  <>Tariften uygulamasını açın</>,
  <><strong className="font-semibold text-slate-900">Profil</strong> sekmesine gidin</>,
  <><strong className="font-semibold text-slate-900">Profili Düzenle</strong> sayfasını açın</>,
  <>En alttaki <strong className="da-danger font-semibold text-red-700">&quot;Hesabımı Sil&quot;</strong> butonuna tıklayın</>,
  <>Onay kutusuna <strong className="font-semibold text-slate-900">&quot;HESABIMI SIL&quot;</strong> yazarak işlemi onaylayın</>,
];

const DELETED = [
  "Hesap bilgileri (ad, e-posta, kullanıcı adı)",
  "Profil fotoğrafı",
  "Favori ve pişirdiklerim listesi",
  "Dolap verileri",
  "Oluşturulan tarifler",
  "Yorumlar",
];

export default function DeleteAccountPage() {
  return (
    <main className="bg-[#fcfcfc] pb-20">
      <PageIntro crumb="Hesap silme" kicker="Hesap ve veriler" title="Hesap Silme *Talebi*">
        Tariften hesabınızı ve ilişkili verilerinizi silmek istiyorsanız aşağıdaki adımları izleyin.
      </PageIntro>

      <div className="px-4 pt-10 sm:pt-14"><div className="mx-auto max-w-6xl">
        <div className="grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
          {/* Uygulama İçinden */}
          <section className={CARD} aria-labelledby="da-app">
            <h2 id="da-app" className={CARD_TITLE}>
              <span className={ICON}><Smartphone className="h-5 w-5" aria-hidden /></span> Uygulama İçinden
            </h2>
            <ol className="space-y-4 text-[15px] leading-relaxed text-slate-600">
              {STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="da-num grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gray-200 text-[13px] font-semibold text-slate-700">{i + 1}</span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-col gap-5">
            {/* E-posta İle */}
            <section className={CARD} aria-labelledby="da-mail">
              <h2 id="da-mail" className={CARD_TITLE}>
                <span className={ICON}><Mail className="h-5 w-5" aria-hidden /></span> E-posta İle
              </h2>
              <p className="text-[15px] leading-relaxed text-slate-600">
                Hesap silme talebinizi{" "}
                <a href="mailto:iletisim@tariften.com" className="break-all font-semibold text-brand underline-offset-2 hover:underline">
                  iletisim@tariften.com
                </a>{" "}
                adresine, hesabınızda kayıtlı e-posta adresinizden gönderin.
              </p>
            </section>

            {/* Silinen Veriler */}
            <section className={CARD} aria-labelledby="da-data">
              <h2 id="da-data" className={CARD_TITLE}>
                <span className={ICON}><ShieldCheck className="h-5 w-5" aria-hidden /></span> Silinen Veriler
              </h2>
              <ul className="space-y-2.5 text-[15px] text-slate-600">
                {DELETED.map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div className="mt-5 grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
          {/* Saklama Süresi */}
          <section className="da-note flex gap-4 rounded-3xl border border-[#eadfd7] bg-[#fbf7f3] p-6" aria-labelledby="da-keep">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
            <div>
              <h2 id="da-keep" className="mb-1.5 font-heading text-base font-semibold text-slate-900">Saklama Süresi</h2>
              <p className="text-[15px] leading-relaxed text-slate-600">
                Hesap silme talebi alındıktan sonra tüm verileriniz <strong className="font-semibold text-slate-900">30 gün içinde</strong> kalıcı olarak silinir.
              </p>
            </div>
          </section>

          {/* Bilgi Notu */}
          <section className="da-note flex gap-4 rounded-3xl border border-[#eadfd7] bg-[#fbf7f3] p-6" aria-labelledby="da-info">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
            <div>
              <h2 id="da-info" className="mb-1.5 font-heading text-base font-semibold text-slate-900">Önemli Not</h2>
              <p className="text-[15px] leading-relaxed text-slate-600">
                Hesabınızı sildikten sonra aynı e-posta adresi ile yeniden kayıt olabilirsiniz, ancak eski verileriniz geri getirilemez.
              </p>
            </div>
          </section>
        </div>

        <Link href="/" className="mt-10 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Ana Sayfaya Dön
        </Link>
      </div></div>
    </main>
  );
}
