import type { HipostaNewsletterOption, NewsletterSourceId } from '@/lib/hiposta-newsletters';

export type NewsletterSubscribeResult = {
  success: boolean;
  message: string;
  status?: string;
  deliveryAvailable?: boolean;
  count?: number;
  code?: string;
};

export async function getNewsletterOptions(): Promise<HipostaNewsletterOption[]> {
  try {
    const response = await fetch('/api/newsletters/options', { cache: 'no-store' });
    if (!response.ok) return [];
    const result = await response.json() as { options?: HipostaNewsletterOption[] };
    return Array.isArray(result.options) ? result.options : [];
  } catch {
    return [];
  }
}

export async function subscribeNewsletters(input: {
  email: string;
  newsletters: string[];
  source: NewsletterSourceId;
  website?: string;
}): Promise<NewsletterSubscribeResult> {
  try {
    const response = await fetch('/api/newsletters/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: input.email,
        newsletters: input.newsletters,
        consent: true,
        source: input.source,
        website: input.website || '',
      }),
    });

    const result = await response.json().catch(() => ({})) as NewsletterSubscribeResult;
    return {
      success: response.ok && result.success === true,
      message: result.message || (response.ok ? 'Seçimin kaydedildi.' : 'Bülten aboneliği tamamlanamadı.'),
      status: result.status,
      deliveryAvailable: result.deliveryAvailable,
      count: result.count,
      code: result.code,
    };
  } catch {
    return {
      success: false,
      message: 'Bülten servisine şu anda ulaşılamıyor.',
      code: 'network_error',
    };
  }
}

export async function subscribeToPrimaryTariftenNewsletters(email: string, source: NewsletterSourceId) {
  const options = await getNewsletterOptions();
  const newsletters = options.filter((option) => option.isPrimary).map((option) => option.slug);
  if (newsletters.length === 0) {
    return { success: false, message: 'Tariften bültenleri şu anda aboneliğe açık değil.', code: 'newsletter_unavailable' } satisfies NewsletterSubscribeResult;
  }
  return subscribeNewsletters({ email, newsletters, source });
}
