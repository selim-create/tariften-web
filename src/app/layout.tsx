import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleAnalytics from '@/components/GoogleAnalytics';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ 
  weight: ["400", "500", "600", "700"], 
  subsets: ["latin"], 
  variable: "--font-poppins" 
});

export const metadata: Metadata = {
  metadataBase: new URL('https://tariften.com'),
  title: {
    default: 'Tariften - Yapay Zeka Destekli Tarif Asistanı',
    template: '%s | Tariften',
  },
  description: 'Dolabındaki malzemelerle yapabileceğin tarifleri keşfet. Yapay zeka destekli tarif önerileri, akıllı dolap yönetimi ve kişiselleştirilmiş yemek planları.',
  keywords: ['tarif', 'yemek tarifi', 'yapay zeka', 'dolap yönetimi', 'yemek planlama', 'türk mutfağı'],
  authors: [{ name: 'Tariften', url: 'https://tariften.com' }],
  creator: 'Hip Medya',
  publisher: 'Tariften',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://tariften.com',
    siteName: 'Tariften',
    title: 'Tariften - Yapay Zeka Destekli Tarif Asistanı',
    description: 'Dolabındaki malzemelerle yapabileceğin tarifleri keşfet.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Tariften',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tariften - Yapay Zeka Destekli Tarif Asistanı',
    description: 'Dolabındaki malzemelerle yapabileceğin tarifleri keşfet.',
    images: ['/og-image.jpg'],
    creator: '@tariften',
  },
  alternates: {
    canonical: 'https://tariften.com',
  },
};

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <GoogleAnalytics />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased bg-[#fcfcfc] text-slate-800 flex flex-col min-h-screen`}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <Header />
            <div className="flex-grow">
              {children}
            </div>
            <Footer />
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}