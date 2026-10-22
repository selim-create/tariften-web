"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { loginUser, loginWithGoogle } from "@/lib/auth-client";
import { useAuth } from "@/context/AuthContext";
import { useGoogleLogin } from '@react-oauth/google';
import { safeCallbackPath } from "@/lib/login-callback";
import AuthShell, { AuthHeading } from "@/components/auth/AuthShell";
import { AuthError, AuthInput, Divider, FOCUS, PasswordInput, SocialButtons, SubmitButton } from "@/components/auth/AuthFields";

/** Back to the page that sent the visitor here (?callbackUrl=), else the profile. */
function afterLoginPath(): string {
  if (typeof window === "undefined") return "/profile";
  return safeCallbackPath(new URLSearchParams(window.location.search).get("callbackUrl"));
}

export default function LoginPage() {
  const router = useRouter();
  const { login, refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  // GOOGLE LOGIN HANDLER
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      try {
        const data = await loginWithGoogle(tokenResponse.access_token);
        login(data);
        router.push(afterLoginPath());
      } catch (err) {
        console.error(err);
        setError("Google ile giriş yapılamadı: " + ((err instanceof Error && err.message) || "Bilinmeyen hata"));
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

    try {
      const data = await loginUser(formData.username, formData.password);
      login(data);
      // Normal login sonrası güncel profil bilgilerini çek
      await refreshUser();
      router.push(afterLoginPath());
    } catch (err) {
      console.error(err);
      setError("Giriş başarısız. Kullanıcı adı veya şifre hatalı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell panelKicker="Tekrar hoş geldin" panelTitle="Mutfakta harikalar yaratmaya *hazır mısın?*"
      panelText="Yapay zeka asistanınla dolabındaki malzemeleri değerlendir, israfı önle."
      lokma={["domates", "fesleğen", "peynir"]}>
      <AuthHeading title="Giriş yap">Hesabına erişmek için bilgilerini gir.</AuthHeading>

      {error && <AuthError>{error}</AuthError>}

      <SocialButtons onGoogle={() => googleLogin()} disabled={loading} />

      <Divider label="veya e-posta ile" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput label="Kullanıcı adı veya e-posta" icon={Mail} type="text" name="username" required
          autoComplete="username" autoCapitalize="none" spellCheck={false} inputMode="email"
          value={formData.username} invalid={!!error}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="ornek@tariften.com" />

        <PasswordInput label="Şifre" icon={Lock} name="password" required autoComplete="current-password"
          value={formData.password} invalid={!!error}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Şifren"
          aside={<Link href="/forgot-password" className={`rounded text-sm font-medium text-brand hover:underline ${FOCUS}`}>Şifremi unuttum</Link>} />

        <SubmitButton loading={loading} loadingLabel="Giriş yapılıyor…">
          Giriş yap <ArrowRight className="h-4 w-4" aria-hidden />
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Hesabın yok mu?{" "}
        <Link href="/register" className={`rounded font-semibold text-brand hover:underline ${FOCUS}`}>Hemen kayıt ol</Link>
      </p>
    </AuthShell>
  );
}
