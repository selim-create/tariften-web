"use client";

import { useState, useRef, useEffect } from "react"; 
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaCamera, FaFloppyDisk, FaSpinner, FaCheck, FaTriangleExclamation } from "react-icons/fa6"; 
import { updateProfile, uploadAvatar } from "@/lib/api"; 
import { useAuth } from "@/context/AuthContext";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth(); 
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    bio: "",
    diet: "",
    experience: "",
    password: "",
    confirmPassword: ""
  });

  // User verisi geldiğinde formu doldur
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullname: user.user_display_name || "",
        email: user.user_email || "",
        bio: user.bio || "", 
        diet: user.diet || "",
        experience: user.experience || "",
      }));
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    
    try {
        setLoading(true);
        // Token kontrolü: user.token varsa onu kullan, yoksa localStorage'a bak
        const token = user?.token || localStorage.getItem('tariften_token');
        
        if (token) {
            const avatarUrl = await uploadAvatar(token, file);
            // Avatar hemen güncellensin diye preview'ı URL ile değiştir
            setPreviewImage(avatarUrl); 
            
            // Context'i güncelle (Opsiyonel: Sayfa yenilenmeden avatarın her yerde değişmesi için)
            if (user) {
                login({ ...user, avatar_url: avatarUrl, token });
            }
        }
    } catch (err) {
        console.error(err);
        setError("Fotoğraf yüklenirken hata oluştu.");
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (formData.password && formData.password !== formData.confirmPassword) {
        setError("Şifreler eşleşmiyor.");
        setLoading(false);
        return;
    }

    try {
        const token = user?.token || localStorage.getItem('tariften_token');
        if (!token) throw new Error("Oturum bulunamadı.");

        const updateData = {
            fullname: formData.fullname,
            email: formData.email,
            diet: formData.diet,
            experience: formData.experience,
            bio: formData.bio,
            ...(formData.password ? { password: formData.password } : {})
        };

        const response = await updateProfile(token, updateData);
        
        // Context güncellemesi: Dönen yeni user objesiyle login'i tetikle
        if(response.user) {
             login({ 
                 ...response.user, 
                 token: token, 
                 // API yanıt yapısına göre map ediyoruz
                 user_display_name: response.user.fullname || response.user.user_display_name, 
                 user_email: response.user.email || response.user.user_email
             });
        }
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Güncelleme başarısız.");
    } finally {
        setLoading(false);
    }
  };

  // Auth verisi yükleniyorsa bekle
  if (authLoading) {
      return <div className="min-h-screen flex items-center justify-center text-slate-400"><FaSpinner className="animate-spin text-2xl mr-2" /> Yükleniyor...</div>;
  }

  // Kullanıcı yoksa login'e yönlendir (Middleware hallediyor ama client-side için ek güvenlik)
  if (!user) {
      if (typeof window !== 'undefined') router.push('/login');
      return null;
  }

  // Avatar URL'sini belirle
  const avatarUrl = previewImage || user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullname || "User")}&background=random&color=fff`;

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/profile" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 text-slate-600 transition">
                <FaArrowLeft />
            </Link>
            <h1 className="font-heading font-bold text-lg text-slate-800">Profili Düzenle</h1>
            <div className="w-10"></div> 
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* Avatar Yükleme */}
        <div className="flex flex-col items-center mb-8">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 relative">
                    <Image 
                        src={avatarUrl}
                        alt="Profil" 
                        fill
                        className="object-cover"
                        unoptimized={avatarUrl.includes('ui-avatars.com')} // Next.js optimizasyonunu bypass et
                    />
                </div>
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FaCamera className="text-white text-xl" />
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>
            <p className="text-xs text-gray-400 mt-3">Değiştirmek için fotoğrafa tıkla</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-3 border border-red-100 mb-6">
              <FaTriangleExclamation /> {error}
            </div>
        )}

        {success && (
            <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm flex items-center gap-3 border border-green-100 mb-6 animate-pulse">
              <FaCheck /> Profil başarıyla güncellendi!
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-slate-800 text-sm border-b border-gray-100 pb-3 mb-4">Kişisel Bilgiler</h3>
                
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Ad Soyad</label>
                    <input 
                        type="text" 
                        value={formData.fullname}
                        onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">E-posta</label>
                    <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Hakkımda</label>
                    <textarea 
                        rows={3}
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
                        placeholder="Mutfakta nelerden hoşlanırsın?"
                    />
                </div>
            </div>

            <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-slate-800 text-sm border-b border-gray-100 pb-3 mb-4">Mutfak Tercihleri</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">Beslenme Tipi</label>
                        <select 
                            value={formData.diet}
                            onChange={(e) => setFormData({...formData, diet: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-brand appearance-none"
                        >
                            <option value="">Seçiniz...</option>
                            <option value="none">Hepçil</option>
                            <option value="vegan">Vegan</option>
                            <option value="vegetarian">Vejetaryen</option>
                            <option value="gluten_free">Glutensiz</option>
                            <option value="keto">Ketojenik</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">Mutfak Deneyimi</label>
                        <select 
                            value={formData.experience}
                            onChange={(e) => setFormData({...formData, experience: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-brand appearance-none"
                        >
                            <option value="">Seçiniz...</option>
                            <option value="beginner">Acemi</option>
                            <option value="intermediate">Orta</option>
                            <option value="pro">Usta</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-slate-800 text-sm border-b border-gray-100 pb-3 mb-4">Güvenlik (Opsiyonel)</h3>
                
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Yeni Şifre</label>
                    <input 
                        type="password" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                        placeholder="Değiştirmek istemiyorsanız boş bırakın"
                    />
                </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Yeni Şifre (Tekrar)</label>
                    <input 
                        type="password" 
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    />
                </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <><FaSpinner className="animate-spin" /> Kaydediliyor...</> : <><FaFloppyDisk /> Değişiklikleri Kaydet</>}
            </button>

        </form>
      </div>

    </main>
  );
}