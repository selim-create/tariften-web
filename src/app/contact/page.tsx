import type { Metadata } from "next";
import { ArrowUpRight, Mail } from "lucide-react";
import PageIntro from "@/components/account/PageIntro";

export const metadata: Metadata = {
  title: "İletişim & Reklam",
  description: "Öneri, şikayet veya işbirliği teklifleriniz için bize her zaman ulaşabilirsiniz.",
};

export default function ContactPage() {
  return (
    <main className="bg-[#fcfcfc] pb-20">
      <PageIntro crumb="İletişim" kicker="İletişim & Reklam" title="Bize *yazın.*">
        Öneri, şikayet veya işbirliği teklifleriniz için bize her zaman ulaşabilirsiniz.
      </PageIntro>

      <div className="px-4 pt-10 sm:pt-14"><div className="mx-auto max-w-6xl">
        <a href="mailto:iletisim@tariften.com"
          className="ct-card group flex max-w-xl items-center gap-5 rounded-3xl border border-gray-200 bg-white p-6 transition hover:border-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-8">
          <span className="ct-icon grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fdf1ea] text-brand">
            <Mail className="h-6 w-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-heading text-lg font-semibold text-slate-900">E-posta Gönderin</span>
            <span className="mt-0.5 block text-[15px] text-slate-500">En kısa sürede dönüş yapacağız.</span>
            <span className="mt-3 block break-all text-lg font-semibold text-brand group-hover:underline sm:text-xl">iletisim@tariften.com</span>
          </span>
          <ArrowUpRight className="hidden h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-brand sm:block" aria-hidden />
        </a>
      </div></div>
    </main>
  );
}
