# Menü oluştururken React #441 — 2026-10-15 düzeltmesi

## Gözlem
Tariften Core 1.0.11 ile "Sonbahar Sebzeleriyle Hafif Akşam Menüsü" üretimi sırasında menü sihirbazı **3/8 tarif hazır** durumunu gösterdi; aynı ekranda `Minified React error #441` metni vardı. İkinci ekran görüntüsünde aynı isimli menü sekiz tarifle tamamlanmış ve doğru kategorilerde görünüyordu (İçecek: Rezene Çayı). Kullanıcı menüye erişebildi; fakat hata metni yanlış alarm ve gereksiz tekrar riski yaratıyor.

React resmî decoder: https://react.dev/errors/441 — "An error occurred in the Server Components render"; üretim hatasında ayrıntı gizlenir. **Bu kod tek başına kesin altta yatan istisnayı kanıtlamaz.** Vercel Runtime Errors sorgusunda erişim reddi (403) alındığı için production stack/digest henüz edinilemedi.

## Repo incelemesi
`src/lib/api.ts` dosyasının tepesinde `"use server"` vardı; menü planı, job status ve her tarif adımı bu dosyadan client'a import ediliyordu. Dolayısıyla menü REST çağrıları normal fetch değil, **Next.js Server Action (RSC) üzerinden dolaylı olarak** çalışıyordu. Bu, uzun WordPress API çağrılarına fazladan Vercel/RSC taşıma bağımlılığı ekler ve `#441` gibi genel RSC hatalarıyla ilişkili olabilir.

## Uygulanan düzeltme
- Yeni `src/lib/menu-jobs-client.ts`: yalnızca JSON API tüketen, tipli frontend çağrıları. Eski server action export'ları `src/lib/api.ts` içinden çıkarıldı.
- Yeni `src/app/api/menu-jobs/[...route]/route.ts`: yalnızca **GET find/status** ve **POST generate/advance/retry** uçlarına izin veren, JSON döndüren, `Authorization` bearer'ı WordPress'e ileten, kimlik/owner korumasını WordPress'te bırakan dar kapsamlı transport.
- URL'den serbest adres/route alınmaz. Menü istek kimliği, guest_count ve concept doğrulanır; bearer olmadan çağrı reddedilir. 55s transport timeout, 60s Vercel maxDuration. Sunucu izlerinde kullanıcı token'ı, yemek içeriği ve anahtar saklanmaz.
- HTML 502/504 yanıtları React/RSC exception olarak değil, basit JSON hata nesnesi ve güvenli `traceId` olarak döner; istemci kullanıcıya açıklayıcı metin sunar.
- Yanıt kaybolursa **mevcut job ID'nin WordPress durumunu** okuyup, tamamlanmış tarif sayısı artmışsa kaldığı yerden otomatik devam edilir. Değişmemişse güvenli manuel devam mesajı gösterilir. Yeni menü başlatılmaz; mevcut `request_id` korunur.
- React'in minified internal mesajı doğrudan kullanıcıya gösterilmez.
- Yeni ücretli AI çağrısı, maliyet kuralı veya Core değişikliği yok. Core 1.0.11 ve menü/recipe modeli seçimleri aynı kalır.

## Doğrulama ve yayın
GitHub Actions'ta Node 24, `npm ci`, production audit, TypeScript ve Next production build kontrolü. Vercel Preview ve gerçek üretim akışı sonradan denenmeli. Bu düzeltme `#441` kök nedeninin **tam teşhisi değil**, yüksek riskli Server Action bağımlılığının kaldırılması ve hatasız durum kurtarma sağlanmasıdır.

Frontend PR manuel merge → Vercel READY doğrula; Core deploy gerekmez. Aynı menüyü tekrar oluşturma: mevcut menü yayımlanmış ve kayıtlıdır. Sonraki gerçek testte yeni içerik üretmek yerine önce en az masraflı canary/iyileştirme senaryosu tercih edilir.
