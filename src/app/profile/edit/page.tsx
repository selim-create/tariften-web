"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, Check, ChefHat, CircleAlert, Loader2, Save, Trash2, TriangleAlert, X } from "lucide-react";
import { updateProfile, uploadAvatar, deleteAccount } from "@/lib/auth-client";
import { useAuth } from "@/context/AuthContext";
import PageIntro from "@/components/account/PageIntro";
import AccountAvatar from "@/components/account/AccountAvatar";
import BlockedMembersPanel from "@/components/account/BlockedMembersPanel";

const FIELD = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-slate-800 transition focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10";
const LABEL = "mb-1.5 block text-sm font-medium text-slate-700";
const CONFIRM = "HESABIMI SIL";

function Card({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-7">
      <h2 id={id} className="font-heading text-lg font-bold text-slate-900">{title}</h2>
      {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, login, logout, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

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

  // Giriş yoksa login'e (middleware de yönlendirir; bu istemci tarafı güvence)
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!showDeleteModal) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !deleteLoading) { setShowDeleteModal(false); setDeleteConfirmText(""); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showDeleteModal, deleteLoading]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPreviewImage(URL.createObjectURL(file));
    setError(null);
    try {
      setAvatarUploading(true);
      const token = user?.token || localStorage.getItem("tariften_token");
      if (token) {
        const avatarUrl = await uploadAvatar(token, file);
        setPreviewImage(avatarUrl);
        // Avatar sayfa yenilenmeden her yerde değişsin
        if (user) login({ ...user, avatar_url: avatarUrl, token });
      }
    } catch (err) {
      console.error(err);
      setPreviewImage(null);
      setError("Fotoğraf yüklenemedi. Başka bir fotoğrafla tekrar dener misin?");
    } finally {
      setAvatarUploading(false);
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
      const token = user?.token || localStorage.getItem("tariften_token");
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

      if (response.user) {
        login({
          ...response.user,
          token: token,
          user_display_name: response.user.fullname || response.user.user_display_name,
          user_email: response.user.email || response.user.user_email
        });
      }

      setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error && err.message ? err.message : "Güncelleme başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== CONFIRM) return;

    setDeleteLoading(true);
    try {
      const token = user?.token || localStorage.getItem("tariften_token");
      if (!token) throw new Error("Oturum bulunamadı.");

      await deleteAccount(token);

      logout();
      router.push("/");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error && err.message ? err.message : "Hesap silinirken bir hata oluştu.");
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (authLoading || !user) {
    return <main role="status" className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-gray-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {authLoading ? "Yükleniyor…" : "Giriş sayfasına yönlendiriliyorsun…"}
    </main>;
  }

  const name = formData.fullname || user.user_display_name || user.user_nicename || "";
  const set = (key: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24">
      <PageIntro crumb="Hesap ayarları" kicker="Hesap ayarları" title="Mutfağın, *senin kuralların.*"
        actions={
          <Link href="/profile" className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-gray-300">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Profile dön
          </Link>
        }>
        Adın, fotoğrafın ve mutfak tercihlerin. Hepsi burada, tek tencerede.
      </PageIntro>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pt-10 lg:grid-cols-12 lg:gap-12">
        {/* Fotoğraf */}
        <aside className="lg:col-span-4">
          <div className="flex items-center gap-5 rounded-3xl border border-gray-200 bg-white p-5 lg:sticky lg:top-24 lg:flex-col lg:p-7 lg:text-center">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
              aria-label="Profil fotoğrafını değiştir"
              className="group relative shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
              <AccountAvatar url={previewImage || user.avatar_url} name={name} size={112} />
              <span className={`absolute inset-0 grid place-items-center rounded-full bg-slate-900/40 text-white transition ${avatarUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}>
                {avatarUploading ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <Camera className="h-6 w-6" aria-hidden />}
              </span>
              <span className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-brand text-white ring-4 ring-white">
                <Camera className="h-4 w-4" aria-hidden />
              </span>
            </button>
            <input type="file" ref={fileInputRef} className="sr-only" tabIndex={-1} accept="image/*" onChange={handleFileChange} aria-hidden />
            <div className="min-w-0">
              <p className="truncate font-heading text-lg font-bold text-slate-900">{name || "Adını ekle"}</p>
              {(user.user_nicename || user.user_login) && <p className="truncate text-sm text-gray-500">@{user.user_nicename || user.user_login}</p>}
              <p className="mt-2 text-xs text-gray-500" aria-live="polite">
                {avatarUploading ? "Fotoğraf yükleniyor…" : "Değiştirmek için fotoğrafa dokun."}
              </p>
            </div>
          </div>
        </aside>

        <div className="space-y-6 lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card id="edit-personal" title="Kişisel bilgiler">
              <div>
                <label htmlFor="edit-username" className={LABEL}>Kullanıcı adı</label>
                <input id="edit-username" type="text" value={user.user_nicename || user.user_login || ""} readOnly disabled
                  aria-describedby="edit-username-hint"
                  className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-[15px] text-gray-500" />
                <p id="edit-username-hint" className="mt-1.5 text-xs text-gray-500">Kullanıcı adı değiştirilemez.</p>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-fullname" className={LABEL}>Ad soyad</label>
                  <input id="edit-fullname" type="text" autoComplete="name" value={formData.fullname} onChange={set("fullname")} className={FIELD} />
                </div>
                <div>
                  <label htmlFor="edit-email" className={LABEL}>E-posta</label>
                  <input id="edit-email" type="email" autoComplete="email" value={formData.email} onChange={set("email")} className={FIELD} />
                </div>
              </div>
              <div>
                <label htmlFor="edit-bio" className={LABEL}>Hakkımda</label>
                <textarea id="edit-bio" rows={3} value={formData.bio} onChange={set("bio")}
                  className={`${FIELD} resize-none`} placeholder="Mutfakta nelerden hoşlanırsın? Fırından mı çıkmıyorsun, tencereden mi?" />
              </div>
            </Card>

            <Card id="edit-kitchen" title="Mutfak tercihleri" hint="Kendini nasıl tarif edersin?">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-diet" className={LABEL}>Beslenme tipi</label>
                  <select id="edit-diet" value={formData.diet} onChange={set("diet")} className={FIELD}>
                    <option value="">Seçiniz…</option>
                    <option value="none">Hepçil</option>
                    <option value="vegan">Vegan</option>
                    <option value="vegetarian">Vejetaryen</option>
                    <option value="gluten_free">Glutensiz</option>
                    <option value="keto">Ketojenik</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-experience" className={LABEL}>Mutfak deneyimi</label>
                  <select id="edit-experience" value={formData.experience} onChange={set("experience")} className={FIELD}>
                    <option value="">Seçiniz…</option>
                    <option value="beginner">Çırak · yeni başlıyorum</option>
                    <option value="intermediate">Hevesli aşçı · idare ederim</option>
                    <option value="pro">Usta şef · gözü kapalı</option>
                  </select>
                </div>
              </div>
              <Link href="/profile/kitchen"
                className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-slate-600 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                <ChefHat className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                <span className="flex-1">Hane, sevmediklerin, ekipman ve alerjiler için <span className="font-semibold text-slate-900">mutfak profilin</span></span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </Card>

            <Card id="edit-security" title="Şifre" hint="Değiştirmek istemiyorsan boş bırak.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-password" className={LABEL}>Yeni şifre</label>
                  <input id="edit-password" type="password" autoComplete="new-password" value={formData.password} onChange={set("password")} className={FIELD} />
                </div>
                <div>
                  <label htmlFor="edit-password-confirm" className={LABEL}>Yeni şifre (tekrar)</label>
                  <input id="edit-password-confirm" type="password" autoComplete="new-password" value={formData.confirmPassword} onChange={set("confirmPassword")} className={FIELD} />
                </div>
              </div>
            </Card>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div aria-live="polite" className="min-h-5 text-sm">
                {error && <p className="flex items-start gap-2 text-red-700"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}</p>}
                {success && <p className="flex items-center gap-2 text-emerald-700"><Check className="h-4 w-4" aria-hidden /> Kaydedildi. Mutfağın güncel.</p>}
              </div>
              <button type="submit" disabled={loading || avatarUploading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Kaydediliyor…</> : <><Save className="h-4 w-4" aria-hidden /> Değişiklikleri kaydet</>}
              </button>
            </div>
          </form>

          <BlockedMembersPanel />

          {/* Hesap silme (Core 1.0.67: yayındaki tarifler anonim olarak kalır) */}
          <section aria-labelledby="edit-danger" className="rounded-3xl border border-red-200 bg-white p-5 sm:p-7">
            <h2 id="edit-danger" className="font-heading text-lg font-bold text-red-700">Hesabı sil</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Hesabın, taslakların, sana özel tariflerin, favorilerin ve dolabın kalıcı olarak silinir. Yayındaki tariflerin
              sitede <strong className="font-semibold text-slate-800">Tariften Topluluğu</strong> adıyla anonim olarak kalır;
              yorumların &quot;Eski üye&quot; adıyla anonimleşir. Bu işlem geri alınamaz.
            </p>
            <button type="button" onClick={() => setShowDeleteModal(true)}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50">
              <Trash2 className="h-4 w-4" aria-hidden /> Hesabımı sil
            </button>
          </section>
        </div>
      </div>

      {showDeleteModal && (
        <div role="presentation" className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !deleteLoading) { setShowDeleteModal(false); setDeleteConfirmText(""); } }}>
          <section role="dialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600"><TriangleAlert className="h-5 w-5" aria-hidden /></span>
                <div>
                  <h2 id="delete-title" className="font-heading text-lg font-bold text-slate-900">Hesabı sil</h2>
                  <p className="text-xs text-gray-500">Bu işlem geri alınamaz</p>
                </div>
              </div>
              <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }} disabled={deleteLoading}
                aria-label="Kapat" className="grid h-9 w-9 place-items-center rounded-full text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
              <p>Hesabın ve şu verilerin <strong>kalıcı olarak</strong> silinecek:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-red-700">
                <li>Profil bilgileri ve fotoğrafın</li>
                <li>Taslakların, sana özel ve onay bekleyen tariflerin</li>
                <li>Menülerin, notların, favori ve pişirdiklerim listelerin</li>
                <li>Dolap ve mutfak verilerin</li>
              </ul>
            </div>
            <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs leading-5 text-slate-600">
              <p><strong className="font-semibold text-slate-800">Yayındaki tariflerin</strong> sitede kalır ve yazar olarak <strong className="font-semibold text-slate-800">Tariften Topluluğu</strong> görünür; adın yer almaz.</p>
              <p className="mt-1.5"><strong className="font-semibold text-slate-800">Yorumların</strong> kalır ama anonimleşir: &quot;Eski üye&quot; adıyla, fotoğrafsız ve e-postasız görünür.</p>
            </div>

            <label htmlFor="delete-confirm" className="mb-1.5 block text-sm text-slate-700">
              Onaylamak için <span className="font-semibold text-red-700">{CONFIRM}</span> yaz:
            </label>
            <input id="delete-confirm" type="text" autoComplete="off" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={CONFIRM}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] focus:border-red-300 focus:outline-none focus:ring-4 focus:ring-red-500/10" />

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }} disabled={deleteLoading}
                className="h-12 flex-1 rounded-xl border border-gray-200 font-semibold text-slate-700 transition hover:border-gray-300">
                Vazgeç
              </button>
              <button type="button" onClick={handleDeleteAccount} disabled={deleteConfirmText !== CONFIRM || deleteLoading}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">
                {deleteLoading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Siliniyor…</> : <><Trash2 className="h-4 w-4" aria-hidden /> Sil</>}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
