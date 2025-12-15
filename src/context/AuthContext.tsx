"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types"; // Tipleri merkezi dosyadan alıyoruz
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  login: (userData: any) => void; // userData API'den gelen ham veri olabilir, tipini esnek tutuyoruz
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan kullanıcıyı geri yükle
    const storedUser = localStorage.getItem("tariften_user");
    const storedToken = localStorage.getItem("tariften_token");

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Token'ı user objesine de ekleyebiliriz veya ayrı tutabiliriz
        // Eğer storedUser içinde token yoksa, storedToken'ı ekle
        
        // Eksik alanları tamamla (Eski localStorage verisi olabilir)
        const userWithToken: User = { 
            ...parsedUser, 
            token: storedToken,
            // Eğer eski veride bu alanlar yoksa boş string ata ki undefined olmasın
            diet: parsedUser.diet || "",
            experience: parsedUser.experience || "",
            bio: parsedUser.bio || "",
            avatar_url: parsedUser.avatar_url || ""
        };
        setUser(userWithToken);
      } catch (error) {
        console.error("User parse error", error);
        localStorage.removeItem("tariften_user");
        localStorage.removeItem("tariften_token");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: any) => {
    // API yanıtından gelen veriyi User tipine uygun hale getiriyoruz
    // Backend yanıtı: { token, user_email, user_nicename, user_display_name, avatar_url, diet, experience, bio ... }
    
    // Eğer userData içinde 'user' objesi varsa (profile update yanıtı gibi), onu kullan
    // Yoksa userData'nın kendisi user bilgilerini içeriyordur (login yanıtı gibi)
    
    // MEVCUT KULLANICIYI KORU (MERGE STRATEJİSİ)
    // Eğer sadece token yenileniyorsa veya kısmi güncelleme geliyorsa eski veriyi kaybetme.
    // Ancak gelen veri "null" veya "boş string" ise ve gerçekten silinmesi isteniyorsa bu strateji sorun yaratabilir.
    // Şimdilik sadece "undefined" veya "eksik" verileri koruyalım.
    const currentUser = user || (localStorage.getItem("tariften_user") ? JSON.parse(localStorage.getItem("tariften_user")!) : {});

    let newUser: Partial<User> = {};
    let tokenToStore: string = userData.token || currentUser.token || "";

    if (userData.user) {
        // Profil update yanıtı veya detaylı login yanıtı
        const u = userData.user;
        // Backend'den gelen veriyi öncelikli al, yoksa mevcut veriyi koru
        newUser = {
            id: u.id || currentUser.id,
            user_login: u.user_login || u.username || currentUser.user_login || "",
            user_nicename: u.user_nicename || u.username || currentUser.user_nicename || "",
            user_email: u.user_email || u.email || currentUser.user_email || "",
            user_display_name: u.user_display_name || u.fullname || currentUser.user_display_name || "",
            // Avatar URL boş string gelebilir (silinmişse), bu yüzden || kontrolü dikkatli yapılmalı
            // Eğer u.avatar_url undefined ise currentUser'ı al
            avatar_url: u.avatar_url !== undefined ? u.avatar_url : (currentUser.avatar_url || ""),
            diet: u.diet !== undefined ? u.diet : (currentUser.diet || ""),
            experience: u.experience !== undefined ? u.experience : (currentUser.experience || ""),
            bio: u.bio !== undefined ? u.bio : (currentUser.bio || ""),
        };
    } else {
        // Düz login yanıtı (root seviyesinde veriler)
        // Burada da undefined kontrolü yapalım
        newUser = {
            id: userData.id || currentUser.id || 0,
            user_login: userData.user_nicename || userData.username || currentUser.user_login || "",
            user_nicename: userData.user_nicename || userData.username || currentUser.user_nicename || "",
            user_email: userData.user_email || userData.email || currentUser.user_email || "",
            user_display_name: userData.user_display_name || userData.fullname || currentUser.user_display_name || "",
            avatar_url: userData.avatar_url !== undefined ? userData.avatar_url : (currentUser.avatar_url || ""),
            diet: userData.diet !== undefined ? userData.diet : (currentUser.diet || ""),
            experience: userData.experience !== undefined ? userData.experience : (currentUser.experience || ""),
            bio: userData.bio !== undefined ? userData.bio : (currentUser.bio || ""),
        };
    }

    // Token'ı ekle
    const userToStore = { ...newUser, token: tokenToStore } as User;

    // State ve Storage güncelle
    setUser(userToStore);
    localStorage.setItem("tariften_user", JSON.stringify(userToStore));
    
    if (tokenToStore) {
        localStorage.setItem("tariften_token", tokenToStore);
        // Cookie'ye de yaz (Middleware için)
        document.cookie = `tariften_token=${tokenToStore}; path=/; max-age=604800; SameSite=Lax`; // 1 hafta
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("tariften_user");
    localStorage.removeItem("tariften_token");
    // Cookie'yi temizle
    document.cookie = "tariften_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}