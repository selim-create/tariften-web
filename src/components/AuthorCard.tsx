import Image from "next/image";
import { Author } from "@/types";

interface AuthorCardProps {
  author: Author | null;
  label?: string;
}

export default function AuthorCard({ author, label = "Tarifi paylaşan" }: AuthorCardProps) {
  if (!author) return null;

  const avatarUrl = author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=f6efe8&color=db4c3f&bold=true`;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <div className="flex items-start gap-4">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/5">
          <Image
            src={avatarUrl}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
            unoptimized={avatarUrl.includes('ui-avatars.com')}
          />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-base font-semibold text-slate-900">{author.name}</p>
          {author.bio && <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-gray-500">{author.bio}</p>}
        </div>
      </div>
    </div>
  );
}
