import Link from "next/link";
import { getLatestPosts } from "@/lib/api";
import BlogCard from "@/components/blog/BlogCard";
import { FaArrowRight, FaNewspaper } from "react-icons/fa6";

export default async function BlogShowcase() {
  const posts = await getLatestPosts();

  // Eğer hiç yazı yoksa bu alanı gösterme
  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50/50 border-y border-gray-100 relative overflow-hidden">
      {/* Arkaplan Süsü (Opsiyonel) */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32 pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Başlık ve Buton */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <span className="text-[#db4c3f] font-bold tracking-wider text-xs uppercase mb-2 flex items-center gap-2">
              <FaNewspaper />
              Güncel İçerikler
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-heading leading-tight">
              Mutfaktan Blog
            </h2>
            <p className="text-gray-500 mt-2 text-sm md:text-base max-w-xl">
              Mutfak deneyiminizi zenginleştirecek en güncel yazılar, ipuçları ve gastronomi dünyasından haberler ve trendler.
            </p>
          </div>
          
          <Link 
            href="/blog" 
            className="group flex items-center gap-2 text-slate-600 font-bold hover:text-[#db4c3f] transition bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md"
          >
            Tüm Yazıları Gör 
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Blog Kartları Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}