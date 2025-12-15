import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleOAuthProvider } from '@react-oauth/google';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ 
  weight: ["400", "500", "600", "700"], 
  subsets: ["latin"], 
  variable: "--font-poppins" 
});

export const metadata: Metadata = {
  title: "Tariften | AI ile Pişir",
  description: "Türkiye'nin ilk yapay zeka destekli mutfak asistanı.",
  icons: {
    icon: '/favicon.ico', // public/favicon.ico dosyasını işaret eder
    shortcut: '/favicon.ico',
    apple: '/favicon.ico', // İsterseniz özel apple-touch-icon.png de ekleyebilirsiniz
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