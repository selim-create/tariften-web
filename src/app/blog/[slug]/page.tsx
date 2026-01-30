// src/app/blog/[slug]/page.tsx

import { getBlogPost, getRelatedPosts } from "@/lib/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaChevronRight, FaArrowRight } from "react-icons/fa6";
import { Metadata } from "next";
import ShareButtons from "@/components/blog/ShareButtons";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

interface Props {
  params: Promise<{ slug: string }>;
}

// --- RANK MATH SEO ENTEGRASYONU ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  
  if (!post) return { title: 'Yazı Bulunamadı' };

  const seo = post.yoast_head_json;

  return {
    title: seo?.title || `${post.title.rendered} | Tariften Blog`,
    description: seo?.description || post.excerpt.rendered.replace(/<[^>]*>?/gm, '').slice(0, 160),
    openGraph: {
        title: seo?.og_title || post.title.rendered,
        description: seo?.og_description,
        type: 'article',
        url: `https://tariften.com/blog/${post.slug}`,
        images: seo?.og_image ? seo.og_image.map(img => img.url) : (post._embedded?.['wp:featuredmedia']?.[0]?.source_url ? [post._embedded['wp:featuredmedia'][0].source_url] : []),
    },
    twitter: {
        card: (seo?.twitter_card as "summary" | "summary_large_image") || 'summary_large_image',
        title: seo?.title,
        description: seo?.description,
        images: seo?.og_image ? [seo.og_image[0].url] : [],
    },
    alternates: {
        canonical: `https://tariften.com/blog/${post.slug}`,
    }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  // --- VERİ HAZIRLIĞI ---
  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  
  // Benzer İçerikleri Çek
  const categoryId = post.categories && post.categories.length > 0 ? post.categories[0] : 0;
  const relatedPosts = categoryId ? await getRelatedPosts(categoryId, post.id) : [];

  return (
    <div className="container mx-auto px-4 py-8">
       {/* Breadcrumb */}
       <nav className="flex items-center text-xs text-gray-400 mb-8 font-medium gap-2">
            <Link href="/" className="hover:text-[#db4c3f]">Anasayfa</Link>
            <FaChevronRight className="text-[10px]" />
            <Link href="/blog" className="hover:text-[#db4c3f]">Blog</Link>
            <FaChevronRight className="text-[10px]" />
            <span className="text-gray-800 line-clamp-1 max-w-[200px]" dangerouslySetInnerHTML={{__html: post.title.rendered}} />
        </nav>

        <article className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-8 text-center">
                <h1 
                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 font-heading leading-tight mb-6"
                    dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                />
            </header>

            {/* Featured Image */}
            <div className="relative aspect-[21/9] w-full mb-10 rounded-2xl overflow-hidden shadow-lg bg-gray-100">
                {featuredImage ? (
                    <Image 
                        src={featuredImage}
                        alt={post.title.rendered}
                        fill
                        className="object-cover"
                        priority
                        unoptimized
                    />
                ) : (
                    <ImagePlaceholder title={post.title.rendered} variant="detail" />
                )}
            </div>

            {/* GÜÇLENDİRİLMİŞ İÇERİK ALANI */}
            <div className="
                prose prose-lg prose-slate max-w-none 
                /* Başlıklar */
                prose-headings:font-heading prose-headings:font-bold prose-headings:text-slate-900 prose-h2:mt-10 prose-h2:mb-4
                /* Linkler */
                prose-a:text-[#db4c3f] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                /* Metin */
                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-6
                /* Kalın ve İtalik */
                prose-strong:text-slate-900 prose-strong:font-bold
                prose-em:text-slate-800
                /* Listeler */
                prose-li:text-slate-600
                /* Görseller */
                prose-img:rounded-2xl prose-img:shadow-md
                /* Mobil Uyumu */
                mb-12"
                dangerouslySetInnerHTML={{ __html: post.content.rendered }}
            />
            
            <ShareButtons title={post.title.rendered} slug={post.slug} />

        </article>

        {/* --- BENZER İÇERİKLER ALANI --- */}
        {relatedPosts.length > 0 && (
            <div className="max-w-6xl mx-auto mt-16 pt-16 border-t border-gray-100">
                <h3 className="text-2xl font-bold text-slate-900 font-heading mb-8">Bunlar da İlginizi Çekebilir</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {relatedPosts.map((related) => {
                        const relImg = related._embedded?.['wp:featuredmedia']?.[0]?.source_url;
                        return (
                            <Link href={`/blog/${related.slug}`} key={related.id} className="group block h-full flex flex-col">
                                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4 relative">
                                    {relImg ? (
                                        <Image 
                                            src={relImg} 
                                            alt={related.title.rendered} 
                                            fill 
                                            className="object-cover group-hover:scale-105 transition duration-500"
                                            unoptimized
                                        />
                                    ) : (
                                        <ImagePlaceholder title={related.title.rendered} variant="card" />
                                    )}
                                </div>
                                <h4 
                                    className="font-bold text-slate-800 text-lg group-hover:text-[#db4c3f] transition line-clamp-2 mb-2"
                                    dangerouslySetInnerHTML={{ __html: related.title.rendered }}
                                />
                                <div 
                                  className="text-sm text-gray-500 line-clamp-2 mb-3"
                                  dangerouslySetInnerHTML={{ __html: related.excerpt.rendered }}
                                />
                                <span className="mt-auto text-sm text-[#db4c3f] font-bold flex items-center gap-1">
                                    Oku <FaArrowRight className="group-hover:translate-x-1 transition" />
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        )}
    </div>
  );
}