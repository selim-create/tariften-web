import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Kullanıcının giriş yapıp yapmadığını anlamak için cookie'ye bakıyoruz
  const token = request.cookies.get('tariften_token')?.value;

  // 2. Mevcut gidilen yol
  const path = request.nextUrl.pathname;

  // 3. Korunan Rotalar (Sadece üyeler girebilir)
  // Dashboard, Ayarlar ve Tarif Defterim gibi kişisel alanlar
  const protectedRoutes = ['/profile', '/profile/edit', '/cookbook'];

  // Yolun korunan rotalar listesinde olup olmadığını veya bir alt yolu olup olmadığını kontrol et
  const isProtected = protectedRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );

  // KURAL 1: Eğer sayfa korumalıysa ve token yoksa -> Login'e yönlendir
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    // Kullanıcı giriş yaptıktan sonra kaldığı yere dönebilmesi için callbackUrl ekle
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // KURAL 2: Zaten giriş yapmışsa ve Login/Register sayfalarına girmeye çalışıyorsa -> Profil'e yönlendir
  if (token && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // Diğer tüm durumlar için isteğe devam et
  return NextResponse.next();
}

// Middleware'in çalışacağı adresleri belirliyoruz
// Bu matcher, gereksiz yere statik dosyalar (resimler, favicon vb.) için middleware'in çalışmasını engeller
export const config = {
  matcher: [
    /*
     * Aşağıdakilerle başlayanlar HARİÇ tüm request yolları:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public klasöründeki dosyalar (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
};