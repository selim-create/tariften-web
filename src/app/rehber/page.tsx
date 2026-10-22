import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, BookOpen, RotateCcw } from "lucide-react";
import PageIntro from "@/components/account/PageIntro";
import GuideCard from "@/components/guide/GuideCard";
import { FOCUS } from "@/components/guide/GuideBits";
import { getGuides, getGuideTopics } from "@/lib/guides-api";
import {
  findGuideTopic, GUIDE_SITE_URL, guideListHref, guideListJsonLd, guidePageWindow, jsonLdString, parseGuideListParams,
  type GuideLevel, type GuideListParams, type GuideTopic,
} from "@/lib/guides";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const CHIP = `inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition ${FOCUS}`;
const CHIP_ON = "border-brand bg-[#fdf1ea] text-[#a8362b] dark:bg-brand/15 dark:text-[#fbc4bd]";
const CHIP_OFF = "border-gray-200 bg-white text-slate-700 hover:border-gray-300";

const DESCRIPTION = "Bıçak bilemekten turşu kurmaya, saklama sürelerinden ölçü dönüşümlerine: Tariften Mutfak Rehberi'nde adım adım, sade ve güvenilir mutfak bilgisi.";

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = parseGuideListParams(await searchParams);
  const { topics } = await getGuideTopics();
  const found = findGuideTopic(topics, params.topic);
  const title = found ? `${found.topic.name} rehberleri | Tariften Mutfak Rehberi` : "Mutfak Rehberi | Tariften";
  const description = found?.topic.description || DESCRIPTION;
  // The topic (and page) are their own pages; a level filter is a view of them.
  const canonical = `${GUIDE_SITE_URL}${guideListHref({ topic: found ? params.topic : null, page: params.page })}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    ...(params.level ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, type: "website", url: canonical, siteName: "Tariften", locale: "tr_TR", images: ["/og-image.jpg"] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-image.jpg"] },
  };
}

function TopicChips({ topics, params }: { topics: GuideTopic[]; params: GuideListParams }) {
  const found = findGuideTopic(topics, params.topic);
  const activeRoot = found ? (found.parent || found.topic) : null;
  // Empty topics stay hidden until they have a guide (unless the URL asks for one).
  // On phones the chip row scrolls sideways, so the active topic moves next to "Tümü".
  const roots = topics.filter(t => t.totalCount > 0 || t.slug === activeRoot?.slug);
  const children = activeRoot ? activeRoot.children.filter(c => c.totalCount > 0 || c.slug === params.topic) : [];

  return (
    <div className="space-y-3">
      <nav aria-label="Konular" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        <Link href={guideListHref({ level: params.level })} aria-current={!activeRoot ? "page" : undefined}
          className={`${CHIP} max-md:-order-2 ${!activeRoot ? CHIP_ON : CHIP_OFF}`}>
          Tümü
        </Link>
        {roots.map(topic => {
          const on = activeRoot?.slug === topic.slug;
          return (
            <Link key={topic.slug} href={guideListHref({ topic: topic.slug, level: params.level })} aria-current={on && !found?.parent ? "page" : undefined}
              className={`${CHIP} ${on ? `${CHIP_ON} max-md:-order-1` : CHIP_OFF}`}>
              {topic.name}
              <span className={`text-xs tabular-nums ${on ? "opacity-80" : "text-slate-400"}`}>{topic.totalCount}</span>
            </Link>
          );
        })}
      </nav>
      {activeRoot && children.length > 0 && (
        <nav aria-label={`${activeRoot.name} alt konuları`} className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          <span className="shrink-0 pr-1 text-xs font-medium text-gray-500">Alt konular</span>
          <Link href={guideListHref({ topic: activeRoot.slug, level: params.level })} aria-current={!found?.parent ? "page" : undefined}
            className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-[13px] font-medium transition ${FOCUS} ${!found?.parent ? "gd-subchip-on bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}>
            Hepsi
          </Link>
          {children.map(child => {
            const on = params.topic === child.slug;
            return (
              <Link key={child.slug} href={guideListHref({ topic: child.slug, level: params.level })} aria-current={on ? "page" : undefined}
                className={`inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] font-medium transition ${FOCUS} ${on ? "gd-subchip-on bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}>
                {child.name} <span className={`text-xs tabular-nums ${on ? "opacity-70" : "text-slate-400"}`}>{child.totalCount}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

function LevelFilter({ levels, params }: { levels: GuideLevel[]; params: GuideListParams }) {
  const shown = levels.filter(l => l.count > 0 || l.slug === params.level);
  if (shown.length === 0) return null;
  const options = [{ slug: null as string | null, name: "Tüm seviyeler" }, ...shown];
  return (
    <nav aria-label="Seviye" className="gd-seg inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-gray-200 bg-white p-1 [scrollbar-width:none]">
      {options.map(option => {
        const on = (params.level || null) === option.slug;
        return (
          <Link key={option.slug || "all"} href={guideListHref({ topic: params.topic, level: option.slug })} aria-current={on ? "page" : undefined}
            className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium transition ${FOCUS} ${on ? "gd-seg-on bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}>
            {option.name}
          </Link>
        );
      })}
    </nav>
  );
}

function Pager({ params, pages }: { params: GuideListParams; pages: number }) {
  if (pages <= 1) return null;
  const href = (page: number) => guideListHref({ ...params, page });
  const prev = params.page > 1 ? params.page - 1 : null;
  const next = params.page < pages ? params.page + 1 : null;
  const edge = `inline-flex h-11 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-gray-300 ${FOCUS}`;
  return (
    <nav aria-label="Sayfalar" className="mt-14 flex items-center justify-between gap-3 sm:justify-center">
      {prev ? <Link href={href(prev)} rel="prev" className={edge}><ArrowLeft className="h-4 w-4" aria-hidden /> Önceki</Link>
        : <span className={`${edge} pointer-events-none opacity-40`} aria-hidden><ArrowLeft className="h-4 w-4" /> Önceki</span>}
      <span className="text-sm text-gray-500 tabular-nums sm:hidden">Sayfa {params.page} / {pages}</span>
      <ol className="hidden items-center gap-1 sm:flex">
        {guidePageWindow(params.page, pages).map((page, i) => (
          <li key={page ?? `gap-${i}`}>
            {page === null ? <span className="px-2 text-gray-400">…</span>
              : page === params.page
                ? <span aria-current="page" className="gd-seg-on grid h-11 min-w-11 place-items-center rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white tabular-nums">{page}</span>
                : <Link href={href(page)} className={`grid h-11 min-w-11 place-items-center rounded-xl px-3 text-sm font-medium text-slate-600 tabular-nums transition hover:text-slate-900 ${FOCUS}`}>{page}</Link>}
          </li>
        ))}
      </ol>
      {next ? <Link href={href(next)} rel="next" className={edge}>Sonraki <ArrowRight className="h-4 w-4" aria-hidden /></Link>
        : <span className={`${edge} pointer-events-none opacity-40`} aria-hidden>Sonraki <ArrowRight className="h-4 w-4" /></span>}
    </nav>
  );
}

export default async function GuideListPage({ searchParams }: { searchParams: SearchParams }) {
  const params = parseGuideListParams(await searchParams);
  const [{ topics, levels }, list] = await Promise.all([getGuideTopics(), getGuides(params)]);
  const found = findGuideTopic(topics, params.topic);
  const filtered = Boolean(params.topic || params.level);
  const pageName = found ? `${found.topic.name} rehberleri` : "Mutfak Rehberi";
  const listJsonLd = guideListJsonLd(pageName, found?.topic.description || DESCRIPTION,
    `${GUIDE_SITE_URL}${guideListHref({ topic: found ? params.topic : null, page: params.page })}`, list?.data ?? []);

  return (
    <main className="gd-page min-h-screen bg-[#fcfcfc] pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(listJsonLd) }} />
      <PageIntro crumb="Mutfak Rehberi" kicker={`Mutfak Rehberi${list && !filtered && list.count > 0 ? ` · ${list.count} rehber` : ""}`}
        title="Mutfağın *püf noktaları.*">
        {found?.topic.description || "Bıçak bilemekten turşu kurmaya, saklama sürelerinden ölçü dönüşümlerine: adım adım, sade ve güvenilir rehberler."}
      </PageIntro>

      <div className="mx-auto max-w-6xl px-4 pt-8">
        {topics.length > 0 && <TopicChips topics={topics} params={params} />}

        <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-lg font-semibold text-slate-900">
            {found ? found.topic.name : "Tüm rehberler"}
            {list && <span className="ml-2 text-sm font-normal text-gray-500 tabular-nums">{list.count} rehber</span>}
          </h2>
          <LevelFilter levels={levels} params={params} />
        </div>

        {list === null ? (
          <div className="mt-8 flex flex-col items-center rounded-3xl border border-gray-200 bg-white px-6 py-14 text-center">
            <span className="gd-icon mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f6efe8] text-brand"><BookOpen className="h-6 w-6" strokeWidth={1.6} aria-hidden /></span>
            <h3 className="font-heading text-xl font-semibold text-slate-900">Rehberler şu an yüklenemedi.</h3>
            <p className="mt-1 text-sm text-gray-500">Bağlantıda kısa bir sorun var gibi görünüyor. Biraz sonra yeniden dene.</p>
            <Link href={guideListHref(params)} className={`mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-gray-300 ${FOCUS}`}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Yeniden dene
            </Link>
          </div>
        ) : list.data.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-3xl border border-gray-200 bg-white px-6 py-14 text-center">
            <span className="gd-icon mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f6efe8] text-brand"><BookOpen className="h-6 w-6" strokeWidth={1.6} aria-hidden /></span>
            <h3 className="font-heading text-xl font-semibold text-slate-900">
              {params.page > 1 && list.count > 0 ? "Bu sayfada rehber kalmadı." : filtered ? "Bu seçimde henüz rehber yok." : "İlk rehberler hazırlanıyor."}
            </h3>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              {filtered ? "Başka bir konu ya da seviye seçebilir, tüm rehberlere dönebilirsin." : "Yakında teknikler, saklama ve ölçü rehberleri burada olacak."}
            </p>
            {(filtered || params.page > 1) && (
              <Link href="/rehber" className={`mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-gray-300 ${FOCUS}`}>
                Tüm rehberler
              </Link>
            )}
          </div>
        ) : (
          <>
            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {list.data.map(guide => (
                <li key={guide.slug}><GuideCard guide={guide} topicSlug={params.topic} /></li>
              ))}
            </ul>
            <Pager params={params} pages={list.pages} />
          </>
        )}
      </div>
    </main>
  );
}
