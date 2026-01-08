"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types"; // Tipleri merkezi dosyadan alıyoruz
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-client";

interface AuthContextType {
  user: User | null;
  login: (userData: any) => void; // userData API'den gelen ham veri olabilir, tipini esnek tutuyoruz
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = () => {
    setUser(null);
    localStorage.removeItem("tariften_user");
    localStorage.removeItem("tariften_token");
    // Cookie'yi temizle
    document.cookie = "tariften_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const refreshUser = async () => {
    const storedToken = localStorage.getItem("tariften_token");
    if (!storedToken) return;

    const response = await getCurrentUser(storedToken);
    
    // Token geçersiz veya süresi dolmuşsa logout yap
    if (!response.success) {
      console.warn("Token expired or invalid, logging out user");
      logout();
      return;
    }
    
    if (response.user) {
      const userData = response.user;
      const userToStore: User = {
        id: userData.id,
        user_login: userData.user_login || userData.username || "",
        user_nicename: userData.user_nicename || userData.username || "",
        user_email: userData.user_email || userData.email || "",
        user_display_name: userData.user_display_name || userData.fullname || "",
        avatar_url: userData.avatar_url || "",
        diet: userData.diet || "",
        experience: userData.experience || "",
        bio: userData.bio || "",
        token: storedToken
      };
      setUser(userToStore);
      localStorage.setItem("tariften_user", JSON.stringify(userToStore));
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem("tariften_user");
      const storedToken = localStorage.getItem("tariften_token");

      if (storedUser && storedToken) {
        try {
          // Önce localStorage'dan yükle (hızlı başlangıç)
          const parsedUser = JSON.parse(storedUser);
          const userWithToken: User = { 
            ...parsedUser, 
            token: storedToken,
            diet: parsedUser.diet || "",
            experience: parsedUser.experience || "",
            bio: parsedUser.bio || "",
            avatar_url: parsedUser.avatar_url || ""
          };
          setUser(userWithToken);
          
          // Sonra backend'den güncel veriyi çek
          await refreshUser();
        } catch (error) {
          console.error("User parse error", error);
          localStorage.removeItem("tariften_user");
          localStorage.removeItem("tariften_token");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (userData: any) => {
    const currentUser = user || {};
    let tokenToStore: string = userData.token || (currentUser as any).token || "";

    let newUserData: Partial<User>;

    // Backend'den user objesi geliyorsa (Google login veya profile update)
    if (userData.user) {
      const u = userData.user;
      newUserData = {
        id: u.id,
        user_login: u.user_login || u.username || "",
        user_nicename: u.user_nicename || u.username || "",
        user_email: u.user_email || u.email || "",
        user_display_name: u.user_display_name || u.fullname || "",
        avatar_url: u.avatar_url || "",
        diet: u.diet || "",
        experience: u.experience || "",
        bio: u.bio || "",
      };
    } else {
      // Normal JWT login yanıtı (root seviyesinde veriler)
      newUserData = {
        id: userData.id || 0,
        user_login: userData.user_nicename || userData.username || "",
        user_nicename: userData.user_nicename || "",
        user_email: userData.user_email || "",
        user_display_name: userData.user_display_name || "",
        avatar_url: userData.avatar_url || "",
        diet: userData.diet || "",
        experience: userData.experience || "",
        bio: userData.bio || "",
      };
    }

    const userToStore = { ...newUserData, token: tokenToStore } as User;

    setUser(userToStore);
    localStorage.setItem("tariften_user", JSON.stringify(userToStore));
    
    if (tokenToStore) {
      localStorage.setItem("tariften_token", tokenToStore);
      document.cookie = `tariften_token=${tokenToStore}; path=/; max-age=604800; SameSite=Lax`;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
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