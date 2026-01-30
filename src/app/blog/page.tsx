// src/app/blog/page.tsx

import { getBlogPosts } from "@/lib/api";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa6";
import { Metadata } from "next";
import BlogList from "@/components/blog/BlogList";

export const metadata: Metadata = {
  title: 'Blog & Mutfak Sırları | Tariften',
  description: 'Mutfak tüyoları, beslenme önerileri, yemek kültürü ve en güncel gastronomi haberleri Tariften blog sayfasında.',
  openGraph: {
      title: 'Blog & Mutfak Sırları | Tariften',
      description: 'Mutfak tüyoları, beslenme önerileri ve en güncel gastronomi haberleri.',
      type: 'website',
      url: 'https://tariften.com/blog',
  }
};

export default async function BlogPage() {
  // İlk yüklemede 9 yazı getir
  const { data: posts, totalPages } = await getBlogPosts(1, 9);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb & Header */}
      <div className="mb-10 border-b border-gray-100 pb-8 text-center md:text-left">
        <nav className="flex items-center justify-center md:justify-start text-xs text-gray-400 mb-4 font-medium gap-2">
            <Link href="/" className="hover:text-[#db4c3f]">Anasayfa</Link>
            <FaChevronRight className="text-[10px]" />
            <span className="text-gray-800">Blog</span>
        </nav>
        <h1 className="text-4xl font-bold text-slate-900 font-heading mb-2">Mutfak Sırları & Blog İçerikleri</h1>
        <p className="text-gray-500 max-w-2xl">
              Mutfak deneyiminizi zenginleştirecek en güncel yazılar, ipuçları ve gastronomi dünyasından haberler ve trendler.
        </p>
      </div>

      {posts.length > 0 ? (
        // Client Component'e verileri aktar
        <BlogList initialPosts={posts} totalPages={totalPages} />
      ) : (
        <div className="text-center py-24 bg-gray-50 rounded-3xl border border-gray-100">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-2xl">📝</div>
            <h3 className="text-xl font-bold text-slate-900">Henüz yazı eklenmemiş.</h3>
            <p className="text-gray-500 mt-2">Çok yakında harika içeriklerle buradayız!</p>
        </div>
      )}
    </div>
  );
}