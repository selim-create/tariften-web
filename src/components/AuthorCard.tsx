import Image from "next/image";
import { FaUser } from "react-icons/fa6";
import { Author } from "@/types";

interface AuthorCardProps {
  author: Author | null;
}

export default function AuthorCard({ author }: AuthorCardProps) {
  if (!author) return null;
  
  const avatarUrl = author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random&color=fff`;
  
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <FaUser className="text-brand" /> Tarif Yazarı
      </h3>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden relative flex-shrink-0 border-2 border-gray-100">
          <Image 
            src={avatarUrl}
            alt={author.name}
            fill
            className="object-cover"
            unoptimized={avatarUrl.includes('ui-avatars.com')}
          />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-lg">{author.name}</h4>
          <p className="text-sm text-gray-500 line-clamp-2">{author.bio || 'Tariften Şefi'}</p>
        </div>
      </div>
    </div>
  );
}
