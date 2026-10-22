import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ChevronRight, Clock3, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import GuideToc from "@/components/guide/GuideToc";
import { Accent, FOCUS, LevelBadge } from "@/components/guide/GuideBits";
import RecipeCover from "@/components/recipe/RecipeCover";
import { getGuide } from "@/lib/guides-api";
import { guideDate, guideJsonLd, guideListHref, jsonLdString, prepareGuideHtml } from "@/lib/guides";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  // Thrown here too so crawlers (blocking metadata) get a real 404 status.
  if (!guide) notFound();

  const { seo } = guide;
  const image = seo.ogImage
    ? [{ url: seo.ogImage.url, ...(seo.ogImage.width ? { width: seo.ogImage.width } : {}), ...(seo.ogImage.height ? { height: seo.ogImage.height } : {}), alt: guide.title }]
    : guide.image ? [{ url: guide.image, alt: guide.title }] : ["/og-image.jpg"];

  return {
    // Core's SEO title already ends with "| Tariften Mutfak Rehberi".
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: seo.canonical },
    openGraph: {
      type: "article",
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
      siteName: "Tariften",
      locale: "tr_TR",
      images: image,
      ...(guide.publishedAt ? { publishedTime: guide.publishedAt } : {}),
      ...(guide.updatedAt ? { modifiedTime: guide.updatedAt } : {}),
      ...(guide.topics[0] ? { section: guide.topics[0].name } : {}),
    },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description, images: image },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();

  const { html, toc, faq } = prepareGuideHtml(guide.contentHtml);
  const topic = guide.topics[0] || null;
  const updated = guideDate(guide.updatedAt || guide.publishedAt);
  const reviewed = guide.foodSafety ? guideDate(guide.foodSafety.reviewedAt) : "";
  const jsonLd = guideJsonLd(guide, faq);

  return (
    <main className="gd-page min-h-screen bg-[#fcfcfc] pb-24">
      {jsonLd.map((item, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(item) }} />
      ))}

      <div className="mx-auto max-w-6xl px-4 pt-6">
        <nav aria-label="Sayfa konumu" className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs text-gray-500">
          <Link href="/" className="shrink-0 transition hover:text-brand">Anasayfa</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" aria-hidden />
          <Link href="/rehber" className="shrink-0 transition hover:text-brand">Mutfak Rehberi</Link>
          {topic && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" aria-hidden />
              <Link href={guideListHref({ topic: topic.slug })} className="truncate font-medium text-slate-700 transition hover:text-brand">{topic.name}</Link>
            </>
          )}
        </nav>
      </div>

      <article className="mx-auto max-w-6xl px-4 lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-x-14 xl:gap-x-20">
        <header className="pt-10 sm:pt-14 lg:col-start-2 lg:max-w-[68ch]">
          {topic && (
            <Link href={guideListHref({ topic: topic.slug })}
              className="mb-4 inline-block text-[11px] font-semibold uppercase tracking-[0.22em] text-brand transition hover:text-brand-dark">
              {topic.name}
            </Link>
          )}
          <h1 className="font-heading text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-slate-900 text-balance [overflow-wrap:anywhere] sm:text-[46px]">
            {guide.title}
          </h1>
          {guide.excerpt && (
            <p className="mt-5 text-lg leading-relaxed text-slate-500 text-pretty sm:text-xl">{guide.excerpt}</p>
          )}

          <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 tabular-nums">
            {guide.level && <li><LevelBadge level={guide.level} className="font-medium text-slate-700" /></li>}
            {guide.readingMinutes && (
              <li className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" aria-hidden /> {guide.readingMinutes} dk okuma</li>
            )}
            {updated && (
              <li className="inline-flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                <span>Güncellendi <time dateTime={guide.updatedAt || guide.publishedAt || undefined}>{updated}</time></span>
              </li>
            )}
          </ul>

          {guide.foodSafety && (
            <p className="gd-safety mt-5 inline-flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-[13.5px] font-medium leading-snug text-emerald-900">
              <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <span>Gıda güvenliği uzmanı tarafından incelendi{reviewed && <> · <time dateTime={guide.foodSafety.reviewedAt || undefined}>{reviewed}</time></>}</span>
            </p>
          )}
          {guide.foodSafetyWarning && (
            <div role="note" className="gd-safety-warn mt-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-[13.5px] leading-relaxed text-amber-950">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              <p><span className="font-semibold">Uzman incelemesi bekleniyor.</span> {guide.foodSafetyWarning}</p>
            </div>
          )}
        </header>

        {guide.image && (
          <figure className="mt-10 lg:col-span-2 lg:mt-12">
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-[#f6efe8] ring-1 ring-black/5">
              <Image src={guide.image} alt={guide.title} fill priority unoptimized sizes="(min-width: 1152px) 1120px, 100vw" className="object-cover" />
            </div>
          </figure>
        )}

        {toc.length >= 2 && (
          <aside className="hidden lg:col-start-1 lg:row-start-3 lg:block">
            <div className="sticky top-24 pt-12">
              <GuideToc items={toc} variant="rail" />
            </div>
          </aside>
        )}

        <div className="min-w-0 lg:col-start-2 lg:row-start-3">
          {toc.length >= 2 && (
            <div className="mt-8 lg:hidden">
              <GuideToc items={toc} variant="inline" />
            </div>
          )}

          <div className="gd-body mt-10 lg:mt-12" dangerouslySetInnerHTML={{ __html: html }} />

          {guide.sources.length > 0 && (
            <div className="gd-sources mt-14 max-w-[68ch] border-t border-gray-200 pt-8">
              <h2 className="font-heading text-lg font-semibold text-slate-900">Kaynaklar</h2>
              <ol className="mt-4 space-y-2.5">
                {guide.sources.map(source => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer"
                      className={`group inline-flex items-start gap-2 text-[15px] leading-snug text-slate-700 transition hover:text-brand ${FOCUS}`}>
                      <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-brand" aria-hidden />
                      <span>{source.title}{source.host && source.host !== source.title && <span className="ml-1.5 text-sm text-gray-500">{source.host}</span>}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-12 flex max-w-[68ch] flex-col gap-4 border-t border-gray-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
            {guide.topics.length > 0 ? (
              <ul className="flex flex-wrap gap-2" aria-label="Konular">
                {guide.topics.map(t => (
                  <li key={t.slug}>
                    <Link href={guideListHref({ topic: t.slug })}
                      className={`inline-flex min-h-10 items-center rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand ${FOCUS}`}>
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <span />}
            <Link href={topic ? guideListHref({ topic: topic.slug }) : "/rehber"}
              className={`inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-brand ${FOCUS}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> {topic ? `Tüm ${topic.name.toLocaleLowerCase("tr-TR")} rehberleri` : "Tüm rehberler"}
            </Link>
          </div>
        </div>
      </article>

      {guide.relatedRecipes.length > 0 && (
        <section aria-labelledby="gd-related" className="mx-auto mt-20 max-w-6xl px-4">
          <div className="border-t border-gray-200 pt-14">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">Mutfağa geç</p>
            <h2 id="gd-related" className="font-heading text-[30px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-900 sm:text-[40px]">
              <Accent text="Bu rehberle *pişir.*" />
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {guide.relatedRecipes.map(recipe => (
                <li key={recipe.slug}>
                  <Link href={`/recipe/${encodeURIComponent(recipe.slug)}`} className={`group block rounded-2xl ${FOCUS}`}>
                    <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-2xl bg-[#f6efe8] ring-1 ring-black/5">
                      {recipe.image ? (
                        <Image src={recipe.image} alt="" fill unoptimized sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                          className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <RecipeCover title={recipe.title} compact />
                      )}
                    </div>
                    <h3 className="line-clamp-2 font-heading text-[16px] font-semibold leading-snug text-slate-900 transition group-hover:text-brand sm:text-[17px]">{recipe.title}</h3>
                    {recipe.totalTime && (
                      <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-gray-500 tabular-nums"><Clock3 className="h-3.5 w-3.5" aria-hidden /> {recipe.totalTime} dk</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
