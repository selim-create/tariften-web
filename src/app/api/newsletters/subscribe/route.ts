import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
import {
  HIPOSTA_CORE_API_URL,
  TARIFTEN_PUBLISHER,
  isNewsletterSourceId,
} from '@/lib/hiposta-newsletters';

type SubscribeBody = {
  email?: unknown;
  newsletters?: unknown;
  consent?: unknown;
  source?: unknown;
  website?: unknown;
};

type CatalogNewsletter = { slug?: unknown };

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const candidate = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim() || '';
  if (candidate && isIP(candidate)) return candidate;
  if (process.env.NODE_ENV !== 'production') return '127.0.0.1';
  return null;
}

async function activeNewsletterSlugs(): Promise<Set<string> | null> {
  try {
    const response = await fetch(`${HIPOSTA_CORE_API_URL}/newsletters`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: CatalogNewsletter[] };
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return new Set(rows.map((row) => typeof row.slug === 'string' ? row.slug : '').filter(Boolean));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: SubscribeBody;

  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ success: false, code: 'invalid_request' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const source = typeof body.source === 'string' ? body.source.trim() : '';
  const consent = body.consent === true;
  const honeypot = typeof body.website === 'string' ? body.website.trim() : '';
  const requested = Array.isArray(body.newsletters)
    ? [...new Set(body.newsletters.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean))]
    : [];

  if (honeypot !== '') {
    return NextResponse.json({ success: true, status: 'accepted' }, { status: 202 });
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ success: false, code: 'invalid_email', message: 'Geçerli bir e-posta adresi girin.' }, { status: 400 });
  }

  if (!consent) {
    return NextResponse.json({ success: false, code: 'consent_required', message: 'Bülten aboneliği için onay vermelisiniz.' }, { status: 400 });
  }

  if (!isNewsletterSourceId(source)) {
    return NextResponse.json({ success: false, code: 'invalid_source' }, { status: 400 });
  }

  if (requested.length === 0 || requested.length > 25) {
    return NextResponse.json({ success: false, code: 'invalid_newsletters' }, { status: 400 });
  }

  const activeSlugs = await activeNewsletterSlugs();
  if (!activeSlugs) {
    return NextResponse.json(
      { success: false, code: 'catalog_unavailable', message: 'Bülten seçenekleri şu anda doğrulanamıyor. Lütfen tekrar deneyin.' },
      { status: 503 }
    );
  }

  if (requested.some((slug) => !activeSlugs.has(slug))) {
    return NextResponse.json(
      { success: false, code: 'newsletter_unavailable', message: 'Seçtiğiniz bültenlerden biri şu anda aboneliğe açık değil.' },
      { status: 400 }
    );
  }

  const token = process.env.HIPOSTA_PUBLISHER_TARIFTEN_TOKEN?.trim() || '';
  if (!token) {
    return NextResponse.json(
      { success: false, code: 'integration_not_configured', message: 'Bülten aboneliği şu anda kullanılamıyor.' },
      { status: 503 }
    );
  }

  const ip = clientIp(request);
  if (!ip) {
    return NextResponse.json(
      { success: false, code: 'client_context_unavailable', message: 'Bülten aboneliği şu anda tamamlanamıyor.' },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(`${HIPOSTA_CORE_API_URL}/subscriptions/batch`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Hiposta-Publisher': TARIFTEN_PUBLISHER,
        'X-Hiposta-Client-IP': ip,
        'X-Hiposta-Client-User-Agent': request.headers.get('user-agent') || 'Tariften Web',
      },
      body: JSON.stringify({
        email,
        newsletters: requested,
        consent: true,
        consent_version: 'tariften-newsletter-v1',
        source,
        locale: 'tr',
      }),
      cache: 'no-store',
    });

    const result = await response.json().catch(() => ({})) as Record<string, unknown>;

    if (response.status === 503 && result.code === 'delivery_unavailable' && result.accepted === true) {
      return NextResponse.json(
        {
          success: true,
          status: 'saved_pending_delivery',
          deliveryAvailable: false,
          count: typeof result.count === 'number' ? result.count : requested.length,
          message: 'Seçimin kaydedildi. Doğrulama e-postası gönderimi yakında etkinleşecek.',
        },
        { status: 202 }
      );
    }

    if (!response.ok) {
      const code = typeof result.code === 'string' ? result.code : 'subscription_failed';
      const status = response.status >= 400 && response.status < 600 ? response.status : 502;
      const message = code === 'newsletter_unavailable'
        ? 'Seçtiğiniz bültenlerden biri şu anda aboneliğe açık değil.'
        : code === 'rate_limited'
          ? 'Çok fazla deneme yapıldı. Lütfen kısa süre sonra tekrar deneyin.'
          : 'Bülten aboneliği tamamlanamadı. Lütfen tekrar deneyin.';
      return NextResponse.json({ success: false, code, message }, { status });
    }

    return NextResponse.json(
      {
        success: true,
        status: typeof result.status === 'string' ? result.status : 'confirmation_required',
        deliveryAvailable: true,
        count: typeof result.count === 'number' ? result.count : requested.length,
        message: 'Seçimlerin kaydedildi. Aboneliğini tamamlamak için e-postandaki doğrulama bağlantısını kullan.',
      },
      { status: 202 }
    );
  } catch {
    return NextResponse.json(
      { success: false, code: 'network_error', message: 'Bülten servisine şu anda ulaşılamıyor. Lütfen tekrar deneyin.' },
      { status: 503 }
    );
  }
}
