import { getBlogPost, getBlogPosts, getRelatedPosts } from "@/lib/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft, ChevronRight } from "lucide-react";
import ShareButtons from "@/components/blog/ShareButtons";
import BlogCard from "@/components/blog/BlogCard";
import SectionHeading from "@/components/home/SectionHeading";
import { postAuthor, postCategory, postDate, postExcerpt, postImage, postTitle, readingMinutes } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) return { title: 'Yazı Bulunamadı' };

  const seo = post.yoast_head_json;
  const title = postTitle(post);
  const description = seo?.description || postExcerpt(post).slice(0, 160);
  const image = seo?.og_image?.[0]?.url || postImage(post)?.url;

  return {
    title: seo?.title || `${title} | Tariften Blog`,
    description,
    openGraph: {
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      type: 'article',
      url: `https://tariften.com/blog/${post.slug}`,
      images: image ? [image] : ['/og-image.jpg'],
      publishedTime: post.date,
      modifiedTime: post.modified,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.title || title,
      description,
      images: image ? [image] : ['/og-image.jpg'],
    },
    alternates: { canonical: `https://tariften.com/blog/${post.slug}` },
  };
}

function sameDay(a?: string, b?: string) {
  if (!a || !b) return true;
  return a.slice(0, 10) === b.slice(0, 10);
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const title = postTitle(post);
  const excerpt = postExcerpt(post);
  // WordPress auto-excerpts are the first words cut with "[…]": fine on a
  // card, but a truncated standfirst reads broken, so only a written one shows.
  const standfirst = /(\[&hellip;\]|\[…\]|&hellip;|…)\s*(<\/p>)?\s*$/.test(post.excerpt?.rendered || "") ? null : excerpt;
  const image = postImage(post);
  const category = postCategory(post);
  const author = postAuthor(post);
  const minutes = readingMinutes(post.content?.rendered);
  const published = postDate(post.date);
  const updated = !sameDay(post.date, post.modified) && post.modified ? postDate(post.modified) : null;

  const categoryId = post.categories?.[0] || 0;
  let related = categoryId ? await getRelatedPosts(categoryId, post.id) : [];
  if (related.length < 3) {
    // Top up with the latest posts so the reader always has a next read.
    const { data: latest } = await getBlogPosts(1, 6);
    related = [...related, ...latest.filter(p => p.id !== post.id && !related.some(r => r.id === p.id))].slice(0, 3);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: excerpt,
    datePublished: post.date,
    dateModified: post.modified || post.date,
    ...(image ? { image: [image.url] } : {}),
    ...(author ? { author: { "@type": "Person", name: author } } : { author: { "@type": "Organization", name: "Tariften" } }),
    publisher: { "@type": "Organization", name: "Tariften", logo: { "@type": "ImageObject", url: "https://tariften.com/logo.svg" } },
    mainEntityOfPage: `https://tariften.com/blog/${post.slug}`,
  };

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="mx-auto max-w-6xl px-4 pt-6">
        <nav aria-label="Sayfa konumu" className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs text-gray-500">
          <Link href="/" className="transition hover:text-brand">Anasayfa</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" aria-hidden />
          <Link href="/blog" className="transition hover:text-brand">Blog</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" aria-hidden />
          <span className="truncate font-medium text-slate-700">{title}</span>
        </nav>
      </div>

      <article>
        <header className="mx-auto max-w-3xl px-4 pb-10 pt-12 text-center sm:pt-16">
          {category && (
            <Link href={`/blog?kategori=${encodeURIComponent(category.slug)}`}
              className="mb-5 inline-block text-[11px] font-semibold uppercase tracking-[0.22em] text-brand hover:text-brand-dark">
              {category.name}
            </Link>
          )}
          <h1 className="font-heading text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-900 text-balance sm:text-5xl lg:text-[56px]">
            {title}
          </h1>
          {standfirst && (
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500 text-pretty sm:text-xl">{standfirst}</p>
          )}
          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-gray-500 tabular-nums">
            {author && <><span className="font-semibold text-slate-800">{author}</span><span aria-hidden>·</span></>}
            {published && <time dateTime={post.date}>{published}</time>}
            {minutes && <><span aria-hidden>·</span><span>{minutes} dk okuma</span></>}
            {updated && <><span aria-hidden>·</span><span>Güncellendi: <time dateTime={post.modified}>{updated}</time></span></>}
          </p>
        </header>

        {image && (
          <figure className="mx-auto max-w-5xl px-4">
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-gray-100 ring-1 ring-black/5">
              <Image src={image.url} alt={image.alt} fill priority unoptimized sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
            </div>
          </figure>
        )}

        <div className="mx-auto mt-12 max-w-6xl px-4 sm:mt-16 lg:grid lg:grid-cols-[1fr_minmax(0,68ch)_1fr] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-28 flex justify-end">
              <ShareButtons title={title} slug={post.slug} layout="rail" />
            </div>
          </aside>

          <div className="min-w-0">
            <div
              className="prose prose-lg prose-slate max-w-none
                prose-headings:font-heading prose-headings:font-bold prose-headings:tracking-[-0.02em] prose-headings:text-slate-900
                prose-h2:mb-4 prose-h2:mt-12 prose-h2:text-[28px] prose-h2:leading-tight
                prose-h3:mt-8 prose-h3:text-xl
                prose-p:leading-[1.8] prose-p:text-slate-700
                prose-a:font-semibold prose-a:text-brand prose-a:no-underline hover:prose-a:underline
                prose-strong:text-slate-900 prose-li:text-slate-700 prose-li:marker:text-brand
                prose-img:rounded-2xl prose-figcaption:text-center prose-figcaption:text-sm
                [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:mt-1
                [&>p:first-of-type]:first-letter:font-heading [&>p:first-of-type]:first-letter:text-[64px] [&>p:first-of-type]:first-letter:font-bold
                [&>p:first-of-type]:first-letter:leading-[0.85] [&>p:first-of-type]:first-letter:text-brand"
              dangerouslySetInnerHTML={{ __html: post.content.rendered }}
            />

            <div className="mt-12 flex flex-col gap-6 border-t border-gray-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <ShareButtons title={title} slug={post.slug} />
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-brand">
                <ArrowLeft className="h-4 w-4" aria-hidden /> Tüm yazılar
              </Link>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl border-t border-gray-200 px-4 pt-14">
          <SectionHeading kicker="Mutfaktan blog" title="Sıradaki *okumalık*" href="/blog" linkLabel="Tüm yazılar" />
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3">
            {related.map(item => <BlogCard key={item.id} post={item} />)}
          </div>
        </section>
      )}
    </main>
  );
}
