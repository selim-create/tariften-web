import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import PageIntro from "@/components/account/PageIntro";
import { FOCUS } from "@/components/guide/GuideBits";
import GuideToolCard, { GuideToolIcon } from "@/components/guide/tools/GuideToolCard";
import { GUIDE_SITE_URL, jsonLdString } from "@/lib/guides";
import { GUIDE_TOOL_ORDER, GUIDE_TOOLS, GUIDE_TOOLS_PATH, guideToolsJsonLd } from "@/lib/guide-tools";

const TITLE = "Mutfak araçları: yumurta, makarna, kurutma ve ölçü çevirici | Tariften";
const DESCRIPTION = "Yumurta kaç dakika haşlanır, makarnaya ne kadar su ve tuz gerekir, domates kaç derecede kurur, bir su bardağı un kaç gram? Tariften'in ücretsiz ve güvenli mutfak araçları.";
const CANONICAL = `${GUIDE_SITE_URL}${GUIDE_TOOLS_PATH}`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  keywords: ["yumurta haşlama süresi", "makarna su tuz oranı", "kurutma rehberi", "ölçü çevirici", "su bardağı kaç gram", "mutfak zamanlayıcı", "Tariften"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: CANONICAL, siteName: "Tariften", locale: "tr_TR", images: ["/og-image.jpg"] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og-image.jpg"] },
};

export default function GuideToolsPage() {
  const jsonLd = guideToolsJsonLd(GUIDE_SITE_URL, DESCRIPTION);
  const tools = GUIDE_TOOL_ORDER.map(key => GUIDE_TOOLS[key]);

  return (
    <main className="gd-page min-h-screen bg-[#fcfcfc] pb-24">
      {jsonLd.map((item, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(item) }} />
      ))}
      <PageIntro crumb="Mutfak araçları" parent={{ label: "Mutfak Rehberi", href: "/rehber" }} kicker="Mutfak Rehberi · 4 araç"
        title="Mutfakta *hesap kolay.*">
        Yumurtanın kıvamı, makarnanın suyu, kurutmanın derecesi, bardağın gramı. Seç, gör, zamanlayıcıyı başlat; sonuçlar hep güvenli aralıkta kalır.
      </PageIntro>

      <div className="mx-auto max-w-6xl px-4 pt-8 lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-x-14 xl:gap-x-20">
        <nav aria-label="Araçlar" className="lg:col-start-1">
          <div className="lg:sticky lg:top-24 lg:pt-4">
            <p className="mb-4 hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 lg:block">Araçlar</p>
            <ul className="gd-tool-navlist -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-0.5 lg:overflow-visible lg:px-0">
              {tools.map(tool => (
                <li key={tool.key} className="shrink-0">
                  <a href={`#${tool.anchor}`} className={`gd-tool-nav ${FOCUS}`}>
                    <GuideToolIcon tool={tool.key} className="h-4 w-4 shrink-0 text-brand" strokeWidth={1.8} />
                    <span className="whitespace-nowrap">{tool.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="mt-6 min-w-0 space-y-8 lg:col-start-2 lg:mt-0 lg:max-w-3xl">
          {tools.map(tool => (
            <GuideToolCard key={tool.key} tool={tool.key} id={tool.anchor} showAllLink={false} />
          ))}

          <div className="flex flex-col gap-3 border-t border-gray-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[15px] text-slate-600">Neden böyle? Süreler, sıcaklıklar ve ölçülerin ayrıntısı rehberlerde.</span>
            <Link href="/rehber" className={`inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-brand ${FOCUS}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Mutfak Rehberi
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
