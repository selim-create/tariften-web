import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext"; // YENİ EKLENDİ

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ 
  weight: ["400", "500", "600", "700"], 
  subsets: ["latin"], 
  variable: "--font-poppins" 
});

export const metadata: Metadata = {
  title: "Tariften | AI ile Pişir",
  description: "Türkiye'nin ilk yapay zeka destekli mutfak asistanı.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased bg-[#fcfcfc] text-slate-800 flex flex-col min-h-screen`}>
        {/* AuthProvider ile tüm uygulamayı sarmalıyoruz */}
        <AuthProvider>
          <Header />
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}