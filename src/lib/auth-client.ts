// Bu dosya client component'lerde kullanılacak auth fonksiyonlarını içerir
// "use server" YOK - client-side'da çalışacak

const API_URL = "https://api.tariften.com/wp-json";

// Mevcut Kullanıcı Bilgilerini Getir (Client-side)
export async function getCurrentUser(token: string) {
  const res = await fetch(`${API_URL}/tariften/v1/auth/me`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });
  
  // 401 hatası için özel handling
  if (res.status === 401) {
    return { success: false, error: 'Token expired' };
  }
  
  if (!res.ok) {
    return { success: false, error: 'Request failed' };
  }
  
  const data = await res.json();
  // Backend'den gelen response'u success flag ile wrap et
  return { success: true, ...data };
}

// Login User (Client-side)
export async function loginUser(username: string, password: string) {
  try {
    const res = await fetch(`${API_URL}/jwt-auth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Giriş başarısız");
    return data; 
  } catch (error) {
    throw error;
  }
}

// Google Login (Client-side)
export async function loginWithGoogle(googleToken: string) {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: googleToken }),
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Google girişi başarısız.");
      return data;
    } else {
      const text = await res.text();
      console.error("Backend Error (HTML):", text);
      throw new Error("Sunucu tarafında bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    }
  } catch (error) {
    throw error;
  }
}

// Register User (Client-side)
export async function registerUser(userData: any) {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Kayıt işlemi başarısız.");
    
    return data;
  } catch (error) {
    throw error;
  }
}

// Profil Güncelleme (Client-side)
export async function updateProfile(token: string, profileData: any) {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/auth/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(profileData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Profil güncellenemedi.");
    
    return data;
  } catch (error) {
    throw error;
  }
}

// Avatar Yükleme (Client-side)
export async function uploadAvatar(token: string, file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/tariften/v1/auth/avatar`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}` 
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Avatar Upload Error Response:", data);
      throw new Error(data.message || "Avatar yüklenemedi.");
    }
    
    return data.avatar_url;
  } catch (error) {
    console.error("Upload Avatar Error:", error);
    throw error;
  }
}

// Hesap Silme (Client-side)
export async function deleteAccount(token: string) {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/auth/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Hesap silinemedi.");
    
    return data;
  } catch (error) {
    throw error;
  }
}
