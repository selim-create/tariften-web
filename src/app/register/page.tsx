"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { registerUser, loginWithGoogle } from "@/lib/api"; // Google Login fonksiyonu import edildi
import { useAuth } from "@/context/AuthContext"; // Auth Context eklendi
import { useGoogleLogin } from '@react-oauth/google'; // Google Hook'u eklendi
import { FaUser, FaEnvelope, FaLock, FaArrowRight, FaSpinner, FaGoogle, FaApple, FaUtensils, FaLeaf, FaCheck, FaTriangleExclamation, FaAt } from "react-icons/fa6";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth(); // Login fonksiyonunu aldık
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
    diet: "",
    level: ""
  });

  const [showModal, setShowModal] = useState(false);

  // GOOGLE LOGIN HANDLER
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      try {
        // Google'dan dönen access token'ı backend'e gönderiyoruz
        const data = await loginWithGoogle(tokenResponse.access_token);
        
        // Başarılı olursa direkt sisteme giriş yap ve profile yönlendir
        login(data);
        router.push("/profile");
      } catch (err: any) {
        console.error(err);
        setError("Google ile kayıt/giriş yapılamadı: " + (err.message || "Bilinmeyen hata"));
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError("Google penceresi kapandı veya hata oluştu.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basit Validasyon
    if (!formData.username || formData.username.length < 3) {
        setError("Kullanıcı adı en az 3 karakter olmalıdır.");
        setLoading(false);
        return;
    }

    try {
      await registerUser(formData);
      setShowModal(true);
    } catch (err: any) {
      console.error("Register Error:", err);
      setError(err.message || "Kayıt işlemi sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    router.push("/login");
  };

  return (
    <main className="fixed inset-0 z-[100] bg-white grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      
      {/* SOL KOLON (Marka Alanı) */}
      <div className="hidden lg:flex relative flex-col justify-between bg-slate-900 p-12 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[#db4c3f] rounded-full blur-[120px] opacity-40"></div>
        
        <div className="relative z-10">
          <Link href="/" className="bg-white p-4 rounded-2xl inline-block shadow-lg shadow-black/20 hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
            <Image 
              src="/logo.svg" 
              alt="Tariften Logo" 
              width={140} 
              height={40} 
              className="h-10 w-auto object-contain" 
            />
          </Link>
        </div>

        <div className="relative z-10 max-w-md mb-20">
          <h2 className="text-4xl font-bold font-heading mb-4 leading-tight">
            Kendi Tarif Defterini Oluştur.
          </h2>
          <p className="text-slate-400 text-lg font-light leading-relaxed">
            Sevdiğin tarifleri kaydet, dolabını yönet ve sana özel haftalık planlar oluştur. Üstelik tamamen ücretsiz.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-400 font-mono">
          Topluluğumuza Katıl
        </div>
      </div>

      {/* SAĞ KOLON (Form Alanı) */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 overflow-y-auto bg-[#fcfcfc] h-full">
        
        <div className="w-full max-w-md space-y-5 my-auto">
          
          <div className="lg:hidden text-center mb-6">
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

          <div className="flex flex-col md:flex-row items-center md:items-end justify-center md:justify-start gap-3 text-center md:text-left">
            <h2 className="text-3xl font-bold text-slate-900 font-heading">Kayıt Ol</h2>
            <p className="text-gray-500 pb-1.5 font-medium">Hızlıca aramıza katıl.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs flex items-center gap-2 border border-red-100 animate-pulse">
              <FaTriangleExclamation /> {error}
            </div>
          )}

          {/* SOSYAL MEDYA */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => googleLogin()} // Google butonu aktif
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition text-slate-700 font-medium text-xs shadow-sm"
            >
              <FaGoogle className="text-red-500 text-sm" /> Google ile
            </button>
            <button 
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-slate-400 font-medium text-xs shadow-sm cursor-default opacity-60"
              title="Yakında"
              // onClick kaldırıldı, Apple butonu pasif
            >
              <FaApple className="text-black text-sm opacity-50" /> Apple ile
            </button>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider"><span className="bg-[#fcfcfc] px-2 text-gray-400">veya</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wide">Ad Soyad</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                    <FaUser className="text-xs" />
                    </div>
                    <input 
                    type="text" 
                    required
                    value={formData.fullname}
                    onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
                    placeholder="Adın Soyadın"
                    />
                </div>
                </div>

                <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wide">Kullanıcı Adı</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                    <FaAt className="text-xs" />
                    </div>
                    <input 
                    type="text" 
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
                    placeholder="kullanici"
                    autoCapitalize="none"
                    />
                </div>
                </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wide">E-posta</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                  <FaEnvelope className="text-xs" />
                </div>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
                  placeholder="ornek@tariften.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wide">Şifre</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                  <FaLock className="text-xs" />
                </div>
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wide">Diyet</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400"><FaLeaf className="text-xs" /></div>
                  <select 
                    value={formData.diet}
                    onChange={(e) => setFormData({...formData, diet: e.target.value})}
                    className="w-full pl-8 pr-2 py-2 bg-white border border-gray-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-brand appearance-none shadow-sm cursor-pointer"
                  >
                    <option value="">Seçiniz...</option>
                    <option value="none">Hepçil</option>
                    <option value="vegan">Vegan</option>
                    <option value="vegetarian">Vejetaryen</option>
                    <option value="gluten_free">Glutensiz</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wide">Seviye</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400"><FaUtensils className="text-xs" /></div>
                  <select 
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                    className="w-full pl-8 pr-2 py-2 bg-white border border-gray-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-brand appearance-none shadow-sm cursor-pointer"
                  >
                    <option value="">Seçiniz...</option>
                    <option value="beginner">Acemi</option>
                    <option value="intermediate">Orta</option>
                    <option value="pro">Usta</option>
                  </select>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#db4c3f] hover:bg-[#b03d32] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <><FaSpinner className="animate-spin" /> Kaydediliyor...</> : <><FaArrowRight /> Hesap Oluştur</>}
            </button>

          </form>

          <p className="text-center text-xs text-gray-500 pb-2">
            Zaten hesabın var mı? <Link href="/login" className="text-brand font-bold hover:underline">Giriş Yap</Link>
          </p>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl transform transition-all scale-100 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl animate-bounce-in">
              <FaCheck />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Kayıt Başarılı!</h3>
            <p className="text-gray-500 mb-8">
              Aramıza hoşgeldin. Şimdi giriş yaparak mutfağını yönetmeye başlayabilirsin.
            </p>
            <button 
              onClick={handleModalClose}
              className="w-full bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand-dark transition shadow-lg shadow-brand/20"
            >
              Giriş Yap
            </button>
          </div>
        </div>
      )}

    </main>
  );
}