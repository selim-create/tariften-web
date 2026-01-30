"use client";

import { FaFacebookF, FaXTwitter, FaWhatsapp, FaLinkedinIn } from "react-icons/fa6";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export default function ShareButtons({ title, slug }: ShareButtonsProps) {
  // URL'yi dinamik oluşturuyoruz (Domaini env'den veya manuel alabilirsin, şimdilik window.location kullanımı için buton click kullanacağız)
  // SEO için statik URL yapısı daha sağlıklıdır:
  const siteUrl = "https://tariften.com"; // Burayı kendi domaininle güncelle
  const url = `${siteUrl}/blog/${slug}`;

  const shareLinks = [
    {
      name: "Facebook",
      icon: <FaFacebookF />,
      color: "hover:bg-[#1877F2] hover:text-white",
      bg: "bg-[#1877F2]/10 text-[#1877F2]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      name: "Twitter (X)",
      icon: <FaXTwitter />,
      color: "hover:bg-black hover:text-white",
      bg: "bg-gray-100 text-black",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
    },
    {
      name: "WhatsApp",
      icon: <FaWhatsapp />,
      color: "hover:bg-[#25D366] hover:text-white",
      bg: "bg-[#25D366]/10 text-[#25D366]",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`
    },
    {
      name: "LinkedIn",
      icon: <FaLinkedinIn />,
      color: "hover:bg-[#0077b5] hover:text-white",
      bg: "bg-[#0077b5]/10 text-[#0077b5]",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    }
  ];

  const handleShare = (link: string) => {
    window.open(link, '_blank', 'width=600,height=400');
  };

  return (
    <div className="flex flex-col gap-4 py-6 border-y border-gray-100 my-8">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bu yazıyı paylaş</span>
      <div className="flex flex-wrap gap-3">
        {shareLinks.map((item) => (
          <button
            key={item.name}
            onClick={() => handleShare(item.url)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${item.bg} ${item.color}`}
            aria-label={`${item.name} ile paylaş`}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
}