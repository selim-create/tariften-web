"use client";

import Link from "next/link";
import Image from "next/image";
import {
  FaApple,
  FaFacebookF,
  FaInstagram,
  FaPinterest,
  FaTiktok,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa6";
import NewsletterForm from "@/components/newsletter/NewsletterForm";

const socialLinks = [
  { href: "https://www.instagram.com/tariftencom/", label: "Instagram", icon: FaInstagram },
  { href: "https://www.facebook.com/tariften", label: "Facebook", icon: FaFacebookF },
  { href: "https://x.com/tariften", label: "X", icon: FaTwitter },
  { href: "https://www.youtube.com/@tariften", label: "YouTube", icon: FaYoutube },
  { href: "https://www.tiktok.com/@tariftencom", label: "TikTok", icon: FaTiktok },
  { href: "https://tr.pinterest.com/tariftencom/", label: "Pinterest", icon: FaPinterest },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-[#eee7e3] bg-[#fbfaf8] text-slate-800">
      <div className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        <div className="overflow-hidden rounded-[32px] border border-[#eaded9] bg-white shadow-[0_24px_80px_rgba(100,60,45,0.07)]">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative overflow-hidden border-b border-[#eee6e2] px-6 py-8 md:px-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
              <div className="absolute -right-14 -top-20 h-52 w-52 rounded-full bg-[#db4c3f]/8 blur-3xl" />
              <div className="relative">
                <Link href="/" className="inline-flex items-center">
                  <Image src="/logo.svg" alt="Tariften" width={165} height={54} className="h-auto w-[150px] md:w-[165px]" />
                </Link>
                <h2 className="mt-7 max-w-xl font-heading text-3xl font-bold leading-tight text-slate-900 md:text-[34px]">
                  Bugün ne pişirsem sorusunu birlikte kolaylaştıralım.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
                  Tarifler, menüler ve akıllı mutfak araçlarıyla günlük karar yükünü azaltan pratik bir mutfak deneyimi.
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {socialLinks.map(({ href, label, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:-translate-y-0.5 hover:border-[#db4c3f] hover:bg-[#db4c3f] hover:text-white"
                    >
                      <Icon size={16} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-8 md:px-8 lg:px-10 lg:py-10">
              <NewsletterForm source="tariften_footer" />
            </div>
          </div>

          <div className="border-t border-[#eee6e2] px-6 py-8 md:px-8 lg:px-10">
            <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr]">
              <div>
                <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Keşfet</p>
                <ul className="space-y-3 text-sm font-medium text-slate-600">
                  <li><Link href="/recipes" className="transition hover:text-[#db4c3f]">Tarifler</Link></li>
                  <li><Link href="/menus" className="transition hover:text-[#db4c3f]">Menüler</Link></li>
                  <li><Link href="/pantry" className="transition hover:text-[#db4c3f]">Dolap Asistanı</Link></li>
                  <li><Link href="/cookbook" className="transition hover:text-[#db4c3f]">Tarif Defterim</Link></li>
                </ul>
              </div>

              <div>
                <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Tariften</p>
                <ul className="space-y-3 text-sm font-medium text-slate-600">
                  <li><Link href="/about" className="transition hover:text-[#db4c3f]">Hakkımızda</Link></li>
                  <li><Link href="/contact" className="transition hover:text-[#db4c3f]">İletişim & Reklam</Link></li>
                  <li><Link href="/blog" className="transition hover:text-[#db4c3f]">İçerikler</Link></li>
                  <li><Link href="/register" className="transition hover:text-[#db4c3f]">Ücretsiz Kayıt Ol</Link></li>
                </ul>
              </div>

              <div>
                <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Cebinde de Tariften</p>
                <p className="max-w-md text-sm leading-6 text-slate-500">Dolabın, tariflerin ve mutfak asistanın uygulamada da yanında.</p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <a
                    href="https://apps.apple.com/my/app/tariften-mutfak-asistan%C4%B1/id6760183583"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-3 rounded-xl bg-slate-950 px-4 py-2.5 text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    <FaApple className="text-xl" />
                    <span className="leading-tight"><span className="block text-[8px] uppercase tracking-wide text-white/60">App Store</span><span className="text-xs font-bold">İndir</span></span>
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.tariften.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-300"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-md bg-[#db4c3f] text-[10px] font-black text-white">▶</span>
                    <span className="leading-tight"><span className="block text-[8px] uppercase tracking-wide text-slate-400">Google Play</span><span className="text-xs font-bold">İndir</span></span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-[#eee6e2] px-6 py-5 text-[11px] text-slate-400 md:flex-row md:items-center md:justify-between md:px-8 lg:px-10">
            <p>© {currentYear} Tariften. Tüm hakları saklıdır.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/terms" className="transition hover:text-slate-700">Kullanım Koşulları</Link>
              <Link href="/privacy" className="transition hover:text-slate-700">Gizlilik Politikası</Link>
              <Link href="/kvkk" className="transition hover:text-slate-700">KVKK</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
