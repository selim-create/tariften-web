"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  token: string;
  email: string;
  user_nicename: string; // WordPress'ten gelen kullanıcı adı
  user_display_name: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Sayfa açıldığında oturum kontrolü
  useEffect(() => {
    const storedUser = localStorage.getItem("tariften_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // GİRİŞ YAPMA (Güncellendi)
  const login = (userData: User) => {
    setUser(userData);
    
    // 1. Veriyi tarayıcı hafızasına at (Arayüzde kullanmak için)
    localStorage.setItem("tariften_user", JSON.stringify(userData));
    localStorage.setItem("tariften_token", userData.token);

    // 2. Cookie oluştur (Middleware'in görmesi için KRİTİK ADIM)
    // 7 günlük bir cookie oluşturuyoruz
    document.cookie = `tariften_token=${userData.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  };

  // ÇIKIŞ YAPMA
  const logout = () => {
    setUser(null);
    localStorage.removeItem("tariften_user");
    localStorage.removeItem("tariften_token");
    
    // Cookie'yi sil (Süresini geçmişe ayarla)
    document.cookie = "tariften_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    
    router.push("/login");
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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