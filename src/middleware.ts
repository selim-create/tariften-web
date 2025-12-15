import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// DÜZELTME: "export function middleware" yerine "export default function middleware" kullanıyoruz.
export function middleware(request: NextRequest) {
  // 1. Kullanıcının giriş yapıp yapmadığını anlamak için cookie'ye bakıyoruz
  const token = request.cookies.get('tariften_token')?.value;

  // 2. Mevcut gidilen yol
  const path = request.nextUrl.pathname;

  // 3. Korunan Rotalar (Sadece üyeler girebilir)
  // NOT: Dolap (/pantry) ve Pilot (/pilot) artık herkese açık (Misafir Modu)
  
  // Kesin eşleşmesi gereken korumalı yollar (Dashboard ve Ayarlar)
  const exactProtectedRoutes = ['/profile', '/profile/edit'];
  
  // Alt yollarıyla birlikte korunanlar (Tarif Defterim)
  const prefixProtectedRoutes = ['/cookbook'];

  // 4. Kontrol Mantığı
  const isExactProtected = exactProtectedRoutes.includes(path);
  const isPrefixProtected = prefixProtectedRoutes.some(route => path.startsWith(route));

  // Eğer sayfa korumalıysa ve token yoksa -> Login'e at
  if ((isExactProtected || isPrefixProtected) && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // KURAL 2: Zaten giriş yapmışsa ve Login/Register'a girmeye çalışıyorsa -> Profil'e at
  if (token && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  return NextResponse.next();
}

// Middleware'in çalışacağı adresleri belirliyoruz
export const config = {
  matcher: [
    '/pantry/:path*', 
    '/profile/:path*', 
    '/cookbook/:path*', 
    '/pilot/:path*',
    '/login', 
    '/register'
  ],
};