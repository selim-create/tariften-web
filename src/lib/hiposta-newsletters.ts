export const HIPOSTA_CORE_API_URL = (
  process.env.HIPOSTA_CORE_API_URL || 'https://api.hiposta.com/wp-json/hiposta/v1'
).replace(/\/+$/, '');

export const TARIFTEN_PUBLISHER = 'tariften';

export const NEWSLETTER_SOURCE_IDS = [
  'tariften_footer',
  'tariften_registration',
  'tariften_blog_inline',
  'tariften_recipe_inline',
  'tariften_menu_inline',
] as const;

export type NewsletterSourceId = (typeof NEWSLETTER_SOURCE_IDS)[number];

export interface HipostaNewsletterOption {
  slug: string;
  name: string;
  publicationSlug: string;
  publicationName: string;
  publicationLogoUrl: string | null;
  publicationBrandColor: string;
  publicationForegroundColor: string;
  publicationMonogram: string;
  description: string;
  cadence: string;
  accentColor: string;
  isPrimary: boolean;
}

export function isNewsletterSourceId(value: string): value is NewsletterSourceId {
  return (NEWSLETTER_SOURCE_IDS as readonly string[]).includes(value);
}
