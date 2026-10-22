"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/lib/auth-client";
import Link from "next/link";
import { ArrowLeft, Mail, MailCheck, Send } from "lucide-react";
import AuthShell, { AuthHeading } from "@/components/auth/AuthShell";
import { AuthError, AuthInput, FOCUS, SubmitButton } from "@/components/auth/AuthFields";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !email.trim()) return;
    setLoading(true);
    setErrorMessage("");
    try {
      await requestPasswordReset(email);
      setIsSent(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "İstek gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell panelKicker="Şifre sıfırlama" panelTitle="Hesabına *yeniden* eriş."
      panelText="Şifreni unuttuysan endişelenme. E-posta adresini girerek hızlıca yeni bir şifre oluşturabilirsin."
      lokma={["sarımsak", "limon", "fesleğen"]}>
      {!isSent ? (
        <>
          <AuthHeading title="Şifreni mi unuttun?">
            Kayıtlı e-posta adresini gir, sana sıfırlama bağlantısı gönderelim.
          </AuthHeading>

          {errorMessage && <AuthError>{errorMessage}</AuthError>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthInput label="E-posta adresin" icon={Mail} type="email" name="email" required autoComplete="email"
              inputMode="email" autoCapitalize="none" spellCheck={false} value={email} invalid={!!errorMessage}
              onChange={(e) => setEmail(e.target.value)} placeholder="ornek@tariften.com" />
            <SubmitButton loading={loading} loadingLabel="Gönderiliyor…">
              Bağlantı gönder <Send className="h-4 w-4" aria-hidden />
            </SubmitButton>
          </form>

          <p className="mt-8 text-center">
            <Link href="/login" className={`group inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 ${FOCUS}`}>
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden /> Giriş sayfasına dön
            </Link>
          </p>
        </>
      ) : (
        <div role="status" className="rounded-3xl border border-gray-200 bg-white p-8 text-center">
          <span className="au-ok mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <MailCheck className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Talebin alındı</h1>
          <p className="mb-8 mt-3 text-[15px] leading-relaxed text-slate-500 [overflow-wrap:anywhere]">
            <strong className="font-semibold text-slate-800">{email}</strong> kayıtlı bir adres ise şifre sıfırlama bağlantısı gönderilmeye çalışıldı. Lütfen gelen kutunu ve spam klasörünü kontrol et.
          </p>
          <Link href="/login" className={`inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-dark ${FOCUS}`}>
            Giriş sayfasına dön
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
