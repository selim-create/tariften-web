"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaEnvelope, FaArrowLeft, FaPaperPlane, FaCheck, FaSpinner } from "react-icons/fa6";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Demo Simülasyon
    setTimeout(() => {
      setLoading(false);
      setIsSent(true);
    }, 1500);
  };

  return (
    <main className="fixed inset-0 z-[100] bg-white grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      
      {/* SOL KOLON (Marka Alanı) */}
      <div className="hidden lg:flex relative flex-col justify-between bg-[#db4c3f] p-12 text-white overflow-hidden">
        {/* Dekoratif Arkaplan */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

        {/* Logo (Beyaz Kutu İçinde) */}
        <div className="relative z-10">
          <Link href="/" className="bg-white p-4 rounded-2xl inline-block shadow-lg shadow-black/10 hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
            <Image 
              src="/logo.svg" 
              alt="Tariften Logo" 
              width={140} 
              height={40} 
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Mesaj */}
        <div className="relative z-10 max-w-md mb-20">
          <h2 className="text-4xl font-bold font-heading mb-4 leading-tight">
            Hesabına Yeniden Eriş.
          </h2>
          <p className="text-white/80 text-lg font-light leading-relaxed">
            Şifreni unuttuysan endişelenme. E-posta adresini girerek hızlıca yeni bir şifre oluşturabilirsin.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-white/40 font-mono">
          © 2025 Tariften Teknoloji A.Ş.
        </div>
      </div>

      {/* SAĞ KOLON (Form) */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 lg:p-24 overflow-y-auto bg-[#fcfcfc] h-full">
        
        <div className="w-full max-w-md space-y-8 my-auto">
          
          {/* Mobil Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-block hover:opacity-80 transition">
              <Image 
                src="/logo.svg" 
                alt="Tariften Logo" 
                width={140} 
                height={40} 
                className="h-10 w-auto object-contain mx-auto"
              />
            </Link>
          </div>

          {!isSent ? (
            <>
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-slate-900 font-heading">Şifreni mi Unuttun?</h2>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  Kayıtlı e-posta adresini gir, sana sıfırlama bağlantısı gönderelim.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">E-posta Adresin</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                      <FaEnvelope />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
                      placeholder="ornek@tariften.com"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Gönderiliyor...
                    </>
                  ) : (
                    <>
                      Bağlantı Gönder <FaPaperPlane className="text-sm" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl animate-bounce-in">
                <FaCheck />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">E-posta Gönderildi!</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                <strong>{email}</strong> adresine bir sıfırlama bağlantısı gönderdik. Lütfen gelen kutunu (ve spam klasörünü) kontrol et.
              </p>
              <Link href="/login" className="w-full bg-[#db4c3f] hover:bg-[#b03d32] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 block transition transform active:scale-95">
                Giriş Sayfasına Dön
              </Link>
            </div>
          )}

          {/* Geri Dön Linki */}
          {!isSent && (
            <p className="text-center mt-8">
              <Link href="/login" className="text-gray-400 hover:text-slate-600 text-sm font-medium flex items-center justify-center gap-2 transition group">
                <FaArrowLeft className="text-xs group-hover:-translate-x-1 transition-transform" /> Giriş sayfasına dön
              </Link>
            </p>
          )}

        </div>
      </div>
    </main>
  );
}