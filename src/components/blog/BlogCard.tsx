import Link from "next/link";
import Image from "next/image";
import { BlogPost } from "@/types";
import { FaArrowRight } from "react-icons/fa6";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

export default function BlogCard({ post }: { post: BlogPost }) {
  // Görsel kontrolü
  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;

  return (
    <Link href={`/blog/${post.slug}`} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <div className="aspect-[16/9] overflow-hidden bg-gray-100 relative">
        {featuredImage ? (
          <Image
            src={featuredImage}
            alt={post.title.rendered}
            fill
            className="object-cover group-hover:scale-105 transition duration-700"
            unoptimized // Harici WP görselleri için
          />
        ) : (
          <ImagePlaceholder title={post.title.rendered} variant="card" />
        )}
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h2 
          className="text-xl font-bold text-slate-800 mb-3 leading-tight group-hover:text-[#db4c3f] transition font-heading line-clamp-2"
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />
        
        <div 
            className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
        />

        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold text-[#db4c3f] flex items-center gap-1 group-hover:gap-2 transition-all">
                Devamını Oku <FaArrowRight />
            </span>
        </div>
      </div>
    </Link>
  );
}