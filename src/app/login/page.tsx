"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaEnvelope, FaLock, FaArrowRight, FaSpinner, FaGoogle, FaApple, FaTriangleExclamation } from "react-icons/fa6";
import { loginUser } from "@/lib/api"; // API fonksiyonumuzu çağırıyoruz
import { useAuth } from "@/context/AuthContext"; // Global state

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth(); // Context'ten login fonksiyonunu al
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. WordPress API'ye istek at
      const data = await loginUser(formData.username, formData.password);
      
      // 2. Gelen veriyi (Token vb.) sisteme kaydet
      // WordPress JWT eklentisi { token, user_email, ... } döner
      login(data);

      // 3. Başarılı! Yönlendir.
      // (Eğer middleware bir sayfadan buraya attıysa oraya geri dön, yoksa profile git)
      // Şimdilik direkt profile atalım:
      router.push("/profile");
      
    } catch (err: any) {
      console.error(err);
      setError("Giriş başarısız. Kullanıcı adı veya şifre hatalı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="fixed inset-0 z-[100] bg-white grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      
      {/* SOL KOLON (Marka Alanı) */}
      <div className="hidden lg:flex relative flex-col justify-between bg-[#db4c3f] p-12 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

        <div className="relative z-10">
          <Link href="/" className="bg-white p-4 rounded-2xl inline-block shadow-lg shadow-black/10 hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
            <Image src="/logo.svg" alt="Tariften Logo" width={140} height={40} className="h-10 w-auto object-contain" />
          </Link>
        </div>

        <div className="relative z-10 max-w-md mb-20">
          <h2 className="text-4xl font-bold font-heading mb-4 leading-tight">Mutfakta Harikalar Yaratmaya Hazır Mısın?</h2>
          <p className="text-white/80 text-lg font-light leading-relaxed">
            Yapay zeka asistanınla dolabındaki malzemeleri değerlendir, israfı önle.
          </p>
        </div>

        <div className="relative z-10 text-xs text-white/40 font-mono">© 2025 Tariften Teknoloji A.Ş.</div>
      </div>

      {/* SAĞ KOLON (Form) */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 lg:p-24 overflow-y-auto bg-[#fcfcfc]">
        <div className="w-full max-w-md space-y-8">
          
          <div className="lg:hidden text-center mb-8">
            <Link href="/">
              <Image src="/logo.svg" alt="Tariften Logo" width={140} height={40} className="h-10 w-auto object-contain mx-auto" />
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 font-heading">Giriş Yap</h2>
            <p className="text-gray-500 mt-2">Hesabına erişmek için bilgilerini gir.</p>
          </div>

          {/* HATA MESAJI (Varsa) */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-3 border border-red-100 animate-pulse">
              <FaTriangleExclamation /> {error}
            </div>
          )}

          {/* SOSYAL MEDYA (Demo) */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-slate-700 font-medium text-sm">
              <FaGoogle className="text-red-500" /> Google
            </button>
            <button className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-slate-700 font-medium text-sm">
              <FaApple className="text-black" /> Apple
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#fcfcfc] px-2 text-gray-400">veya e-posta</span></div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 ml-1">Kullanıcı Adı veya E-posta</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                  <FaEnvelope />
                </div>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
                  placeholder="Kullanıcı adınız"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-700">Şifre</label>
                <Link href="/forgot-password" className="text-xs text-brand hover:underline">Unuttum?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                  <FaLock />
                </div>
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <><FaSpinner className="animate-spin" /> Giriş Yapılıyor...</> : <><FaArrowRight /> Giriş Yap</>}
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-gray-500">
            Hesabın yok mu? <Link href="/register" className="text-brand font-bold hover:underline">Hemen Kayıt Ol</Link>
          </p>
        </div>
      </div>
    </main>
  );
}