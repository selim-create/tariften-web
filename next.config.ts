import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.tariften.com", 
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      // YENİ EKLENENLER:
      {
        protocol: "https",
        hostname: "ui-avatars.com", // İsim baş harflerinden avatar
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com", // WordPress varsayılan avatarları
      },
      { protocol: "https", hostname: "youtube.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" }, 
    ],
  },
};

export default nextConfig;