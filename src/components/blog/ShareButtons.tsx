"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { FaFacebookF, FaXTwitter, FaWhatsapp, FaLinkedinIn } from "react-icons/fa6";

interface ShareButtonsProps {
  title: string;
  /** Blog slug (builds the blog URL) — or pass a full `url` for other pages. */
  slug?: string;
  url?: string;
  layout?: "row" | "rail";
}

export default function ShareButtons({ title, slug = "", url: fullUrl, layout = "row" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url = fullUrl || `https://tariften.com/blog/${slug}`;

  const links = [
    { name: "WhatsApp", icon: FaWhatsapp, href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}` },
    { name: "X", icon: FaXTwitter, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { name: "Facebook", icon: FaFacebookF, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: "LinkedIn", icon: FaLinkedinIn, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };

  const button = "grid h-10 w-10 place-items-center rounded-full border border-gray-200 bg-white text-slate-500 transition hover:border-slate-900 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
  const rail = layout === "rail";

  return (
    <div className={rail ? "flex flex-col items-center gap-2" : "flex flex-wrap items-center gap-2"}>
      <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 ${rail ? "mb-1 [writing-mode:vertical-rl] rotate-180" : "mr-2"}`}>Paylaş</span>
      {links.map(({ name, icon: Icon, href }) => (
        <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${name} ile paylaş`} title={name} className={button}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </a>
      ))}
      <button type="button" onClick={copy} aria-label={copied ? "Bağlantı kopyalandı" : "Bağlantıyı kopyala"} title="Bağlantıyı kopyala" className={button}>
        {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}
