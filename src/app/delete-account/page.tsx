import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock3, Info, Mail, Monitor, ShieldCheck, Smartphone, UsersRound } from "lucide-react";
import PageIntro from "@/components/account/PageIntro";

export const metadata: Metadata = {
  title: "Hesap Silme Talebi — Tariften",
  description: "Tariften hesabınızı uygulamadan veya web sitesinden nasıl silebileceğinizi, hangi verilerin silindiğini ve yayındaki tariflerin nasıl anonim kaldığını öğrenin.",
};

const CARD = "rounded-3xl border border-gray-200 bg-white p-6 sm:p-8";
const CARD_TITLE = "mb-5 flex items-center gap-3 font-heading text-lg font-semibold text-slate-900";
const ICON = "da-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fdf1ea] text-brand";

/** Mobile app: Profil → Hesap İşlemleri → "Hesabımı Sil" (app/(tabs)/profile.tsx). */
const APP_STEPS: React.ReactNode[] = [
  <>Tariften uygulamasını açın ve giriş yapın</>,
  <><strong className="font-semibold text-slate-900">Profil</strong> sekmesine gidin</>,
  <>En alttaki <strong className="font-semibold text-slate-900">Hesap İşlemleri</strong> bölümünde <strong className="da-danger font-semibold text-red-700">&quot;Hesabımı Sil&quot;</strong> satırına dokunun</>,
  <>Açılan onay penceresinde silme işlemini onaylayın</>,
];

/** Web: Profilim → Hesap ayarları → "Hesabı sil" (src/app/profile/edit/page.tsx). */
const WEB_STEPS: React.ReactNode[] = [
  <>tariften.com&apos;da hesabınıza giriş yapın</>,
  <><strong className="font-semibold text-slate-900">Profilim</strong> sayfasında <Link href="/profile/edit" className="font-semibold text-brand underline-offset-2 hover:underline">Hesap ayarları</Link>&apos;nı açın</>,
  <>En alttaki <strong className="font-semibold text-slate-900">Hesabı sil</strong> bölümünde <strong className="da-danger font-semibold text-red-700">&quot;Hesabımı sil&quot;</strong> butonuna tıklayın</>,
  <>Onay kutusuna <strong className="font-semibold text-slate-900">&quot;HESABIMI SIL&quot;</strong> yazıp <strong className="font-semibold text-slate-900">Sil</strong>&apos;e tıklayın</>,
];

const DELETED = [
  "Hesap bilgileri (ad, e-posta, kullanıcı adı) ve profil fotoğrafı",
  "Taslak, size özel ve onay bekleyen tarifler",
  "Menüler, tarif notları, favori ve pişirdiklerim listeleri",
  "Dolap, alışveriş ve mutfak profili verileri",
];

/** Core 1.0.67: published recipes move to the community account; comments are anonymised. */
const KEPT: React.ReactNode[] = [
  <><strong className="font-semibold text-slate-900">Yayındaki tarifleriniz</strong> sitede kalır; yazar olarak <strong className="font-semibold text-slate-900">&quot;Tariften Topluluğu&quot;</strong> görünür, adınız yer almaz.</>,
  <><strong className="font-semibold text-slate-900">Yorumlarınız</strong> anonimleşir: &quot;Eski üye&quot; adıyla, fotoğraf ve e-posta olmadan görünür.</>,
];

function StepList({ steps }: { steps: React.ReactNode[] }) {
  return (
    <ol className="space-y-4 text-[15px] leading-relaxed text-slate-600">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="da-num grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gray-200 text-[13px] font-semibold text-slate-700">{i + 1}</span>
          <span className="pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5 text-[15px] leading-relaxed text-slate-600">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DeleteAccountPage() {
  return (
    <main className="bg-[#fcfcfc] pb-20">
      <PageIntro crumb="Hesap silme" kicker="Hesap ve veriler" title="Hesap Silme *Talebi*">
        Tariften hesabınızı uygulamadan veya web sitesinden silebilirsiniz. Kişisel verileriniz silinir; yayındaki tarifleriniz sitede anonim olarak kalır.
      </PageIntro>

      <div className="px-4 pt-10 sm:pt-14"><div className="mx-auto max-w-6xl">
        <div className="grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
          {/* Uygulama İçinden */}
          <section className={CARD} aria-labelledby="da-app">
            <h2 id="da-app" className={CARD_TITLE}>
              <span className={ICON}><Smartphone className="h-5 w-5" aria-hidden /></span> Uygulama İçinden
            </h2>
            <StepList steps={APP_STEPS} />
          </section>

          {/* Web Sitesinden */}
          <section className={CARD} aria-labelledby="da-web">
            <h2 id="da-web" className={CARD_TITLE}>
              <span className={ICON}><Monitor className="h-5 w-5" aria-hidden /></span> Web Sitesinden
            </h2>
            <StepList steps={WEB_STEPS} />
          </section>

          {/* Silinen Veriler */}
          <section className={CARD} aria-labelledby="da-data">
            <h2 id="da-data" className={CARD_TITLE}>
              <span className={ICON}><ShieldCheck className="h-5 w-5" aria-hidden /></span> Silinen Veriler
            </h2>
            <Bullets items={DELETED} />
          </section>

          {/* Anonim Olarak Kalanlar */}
          <section className={CARD} aria-labelledby="da-kept">
            <h2 id="da-kept" className={CARD_TITLE}>
              <span className={ICON}><UsersRound className="h-5 w-5" aria-hidden /></span> Anonim Olarak Kalanlar
            </h2>
            <Bullets items={KEPT} />
          </section>

          {/* E-posta İle */}
          <section className={CARD} aria-labelledby="da-mail">
            <h2 id="da-mail" className={CARD_TITLE}>
              <span className={ICON}><Mail className="h-5 w-5" aria-hidden /></span> E-posta İle
            </h2>
            <p className="text-[15px] leading-relaxed text-slate-600">
              Uygulamaya veya siteye giremiyorsanız hesap silme talebinizi{" "}
              <a href="mailto:iletisim@tariften.com" className="break-all font-semibold text-brand underline-offset-2 hover:underline">
                iletisim@tariften.com
              </a>{" "}
              adresine, hesabınızda kayıtlı e-posta adresinizden gönderin.
            </p>
          </section>

          <div className="flex flex-col gap-5">
            {/* Saklama Süresi */}
            <section className="da-note flex gap-4 rounded-3xl border border-[#eadfd7] bg-[#fbf7f3] p-6" aria-labelledby="da-keep">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
              <div>
                <h2 id="da-keep" className="mb-1.5 font-heading text-base font-semibold text-slate-900">Ne Zaman Silinir?</h2>
                <p className="text-[15px] leading-relaxed text-slate-600">
                  Uygulamadan veya web sitesinden yaptığınız silme işlemi <strong className="font-semibold text-slate-900">hemen</strong> gerçekleşir. E-posta ile gelen talepler <strong className="font-semibold text-slate-900">en geç 30 gün içinde</strong> tamamlanır.
                </p>
              </div>
            </section>

            {/* Bilgi Notu */}
            <section className="da-note flex gap-4 rounded-3xl border border-[#eadfd7] bg-[#fbf7f3] p-6" aria-labelledby="da-info">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
              <div>
                <h2 id="da-info" className="mb-1.5 font-heading text-base font-semibold text-slate-900">Önemli Not</h2>
                <p className="text-[15px] leading-relaxed text-slate-600">
                  Hesabınızı sildikten sonra aynı e-posta adresi ile yeniden kayıt olabilirsiniz, ancak eski verileriniz geri getirilemez. Anonim olarak kalan tarifler ve yorumlar yeni hesabınıza bağlanamaz.
                </p>
              </div>
            </section>
          </div>
        </div>

        <Link href="/" className="mt-10 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Ana Sayfaya Dön
        </Link>
      </div></div>
    </main>
  );
}
