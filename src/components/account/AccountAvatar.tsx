import Image from "next/image";

/** The member's own photo, or their initial on the brand cream. No generated third-party avatars. */
export default function AccountAvatar({ url, name, size, className = "" }: { url?: string | null; name: string; size: number; className?: string }) {
  if (url) {
    return (
      <span className={`relative block shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/5 ${className}`} style={{ width: size, height: size }}>
        <Image src={url} alt="" fill sizes={`${size}px`} unoptimized className="object-cover" />
      </span>
    );
  }
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-[#f6efe8] font-heading font-semibold text-brand ring-1 ring-black/5 ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}>
      {name.trim().slice(0, 1).toLocaleUpperCase("tr-TR") || "T"}
    </span>
  );
}
