import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // YENİ EKLENEN KISIM: Server Actions limitini artırma
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Görsel yüklemeleri için limiti artırdık
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.tariften.com", // WordPress Medya Kütüphanesi
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Demo görseller için
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com", // Avatar görselleri için
      },
      {
        protocol: "https",
        hostname: "placehold.co", // Placeholder görseller için
      },
            // YENİ: Youtube Thumbnail İzni
      { protocol: "https", hostname: "youtube.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" }, 
    ],
  },
};

export default nextConfig;