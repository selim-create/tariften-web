"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser, loginWithGoogle } from "@/lib/auth-client";
import { subscribeToPrimaryTariftenNewsletters } from "@/lib/newsletter-client";
import { useAuth } from "@/context/AuthContext";
import { useGoogleLogin } from '@react-oauth/google';
import { ArrowRight, AtSign, Check, ChefHat, Lock, Mail, Salad, UserRound } from "lucide-react";
import AuthShell, { AuthHeading } from "@/components/auth/AuthShell";
import { AuthError, AuthInput, AuthSelect, Divider, FOCUS, PasswordInput, SocialButtons, SubmitButton } from "@/components/auth/AuthFields";

/** Core returns {success, token, user} once registration also signs the member in. */
function hasRegistrationSession(data: unknown): data is { success: true; token: string; user: Record<string, unknown> } {
  if (!data || typeof data !== "object") return false;
  const value = data as { success?: unknown; token?: unknown; user?: unknown };
  return value.success === true && typeof value.token === "string" && value.token.length > 0
    && !!value.user && typeof value.user === "object";
}

const TIER_SOON = "au-soon min-h-11 cursor-not-allowed rounded-xl border border-dashed border-gray-200 px-1.5 text-center text-[11.5px] font-medium leading-tight text-slate-400";

export default function RegisterPage() {
  const router = useRouter();
  const { login, refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
    diet: "",
    level: ""
  });

  const [showModal, setShowModal] = useState(false);

  const subscribeAfterRegistration = async (email: string) => {
    if (!newsletterOptIn || !email) return;
    try {
      await subscribeToPrimaryTariftenNewsletters(email, 'tariften_registration');
    } catch {
      // Newsletter delivery must never block or roll back account creation.
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      try {
        const data = await loginWithGoogle(tokenResponse.access_token);
        const googleEmail = data?.user?.email || data?.email || '';
        await subscribeAfterRegistration(googleEmail);
        login(data);
        router.push("/profile");
      } catch (err) {
        console.error(err);
        setError("Google ile kayıt/giriş yapılamadı: " + ((err instanceof Error && err.message) || "Bilinmeyen hata"));
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

    if (!formData.username || formData.username.length < 3) {
      setError("Kullanıcı adı en az 3 karakter olmalıdır.");
      setLoading(false);
      return;
    }

    try {
      const data = await registerUser(formData);
      await subscribeAfterRegistration(formData.email);
      if (hasRegistrationSession(data)) {
        // Core 1.0.47+ signs the new member in: same cookie + AuthContext path as login.
        login(data);
        void refreshUser();
        router.push("/profile/kitchen?welcome=1");
        return;
      }
      setShowModal(true);
    } catch (err) {
      console.error("Register Error:", err);
      setError((err instanceof Error && err.message) || "Kayıt işlemi sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    router.push("/login");
  };

  const usernameShort = error === "Kullanıcı adı en az 3 karakter olmalıdır.";

  return (
    <AuthShell panelKicker="Standart Üyelik" panelTitle="Kendi *tarif defterini* oluştur."
      panelText="Sevdiğin tarifleri kaydet, dolabını yönet ve sana özel haftalık planlar oluştur. Standart Üyelik ile mutfağını Tariften'de keşfet."
      lokma={["limon", "yumurta", "makarna"]}>
      <AuthHeading title="Kayıt ol">Hızlıca aramıza katıl.</AuthHeading>

      {error && <AuthError>{error}</AuthError>}

      <div className="mb-7">
        <p className="mb-2 text-[13px] font-medium text-slate-500">Üyelik seçenekleri</p>
        <div className="grid grid-cols-3 gap-2" aria-label="Üyelik seçenekleri">
          <span className="au-tier-on inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-brand/50 bg-[#fdf1ea] px-2 text-center text-[12px] font-semibold text-[#a8362b]">
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden /> Standart Üye
          </span>
          <button type="button" disabled title="Henüz yayında değil" className={TIER_SOON}>Premium · Yakında</button>
          <button type="button" disabled title="Henüz yayında değil" className={TIER_SOON}>Premium + · Yakında</button>
        </div>
      </div>

      <SocialButtons onGoogle={() => googleLogin()} disabled={loading} googleLabel="Google ile kayıt ol" />

      <Divider label="veya e-posta ile" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <AuthInput label="Ad soyad" icon={UserRound} type="text" name="name" required autoComplete="name"
            value={formData.fullname} onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
            placeholder="Adın Soyadın" />
          <AuthInput label="Kullanıcı adı" icon={AtSign} type="text" name="username" required autoComplete="username"
            autoCapitalize="none" spellCheck={false} value={formData.username} invalid={usernameShort}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="kullanici" />
        </div>

        <AuthInput label="E-posta" icon={Mail} type="email" name="email" required autoComplete="email" inputMode="email"
          autoCapitalize="none" spellCheck={false} value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="ornek@tariften.com" />

        <PasswordInput label="Şifre" icon={Lock} name="password" required autoComplete="new-password"
          value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Bir şifre belirle" />

        <fieldset>
          <legend className="mb-3 text-[13px] text-slate-500">İsteğe bağlı: tarifleri sana göre sıralamamıza yardım eder.</legend>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <AuthSelect label="Diyet" icon={Salad} value={formData.diet} onChange={(e) => setFormData({ ...formData, diet: e.target.value })}>
              <option value="">Seçiniz...</option><option value="none">Hepçil</option><option value="vegan">Vegan</option><option value="vegetarian">Vejetaryen</option><option value="gluten_free">Glutensiz</option><option value="keto">Ketojenik</option>
            </AuthSelect>
            <AuthSelect label="Mutfak deneyimi" icon={ChefHat} value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })}>
              <option value="">Seçiniz...</option><option value="beginner">Acemi (Yumurta kırarım)</option><option value="intermediate">Orta (Tarif takip ederim)</option><option value="pro">Usta (Göz kararı yaparım)</option>
            </AuthSelect>
          </div>
        </fieldset>

        <label className={`au-optin flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${newsletterOptIn ? 'au-optin-on border-brand/50 bg-[#fdf1ea]' : 'border-gray-200 bg-white'}`}>
          <input type="checkbox" checked={newsletterOptIn} onChange={(e) => setNewsletterOptIn(e.target.checked)}
            className={`mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 accent-brand ${FOCUS}`} />
          <span className="min-w-0">
            <span className="au-optin-title block text-sm font-semibold text-slate-800">Tariften bültenlerini de almak istiyorum.</span>
            <span className="au-optin-body mt-1 block text-[13px] leading-relaxed text-slate-500">Aktif Tariften bültenleri e-posta adresine gönderilir. İsteğe bağlıdır. <Link href="/kvkk" target="_blank" className="font-medium text-slate-600 underline underline-offset-2 hover:text-brand">KVKK Aydınlatma Metni</Link></span>
          </span>
        </label>

        <p className="text-[13px] leading-relaxed text-slate-500">
          Hesap oluşturarak <Link href="/terms" target="_blank" className="font-medium text-slate-600 underline underline-offset-2 hover:text-brand">Kullanım Koşulları</Link>’nı ve <Link href="/terms#topluluk-kurallari" target="_blank" className="font-medium text-slate-600 underline underline-offset-2 hover:text-brand">Topluluk Kuralları</Link>’nı kabul etmiş olursun. Uygunsuz içeriğe ve kötüye kullanıma izin verilmez.
        </p>

        <SubmitButton loading={loading} loadingLabel="Kaydediliyor…">
          Hesap oluştur <ArrowRight className="h-4 w-4" aria-hidden />
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Zaten hesabın var mı?{" "}
        <Link href="/login" className={`rounded font-semibold text-brand hover:underline ${FOCUS}`}>Giriş yap</Link>
      </p>

      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="register-success-title">
          <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl">
            <span className="au-ok mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-6 w-6" aria-hidden />
            </span>
            <h3 id="register-success-title" className="font-heading text-2xl font-bold text-slate-900">Kayıt başarılı!</h3>
            <p className="mb-8 mt-2 text-[15px] leading-relaxed text-slate-500">Aramıza hoşgeldin. Şimdi giriş yaparak mutfağını yönetmeye başlayabilirsin.</p>
            <button type="button" onClick={handleModalClose} autoFocus
              className={`inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-dark ${FOCUS}`}>Giriş yap</button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
