import { NextResponse } from 'next/server';
import { HIPOSTA_CORE_API_URL, type HipostaNewsletterOption } from '@/lib/hiposta-newsletters';

type CatalogPublication = {
  slug?: unknown;
  name?: unknown;
  logo_url?: unknown;
  brand_color?: unknown;
  foreground_color?: unknown;
  monogram?: unknown;
};

type CatalogNewsletter = {
  slug?: unknown;
  name?: unknown;
  publication_slug?: unknown;
  publication_name?: unknown;
  description?: unknown;
  cadence?: unknown;
  accent_color?: unknown;
};

export async function GET() {
  try {
    const response = await fetch(`${HIPOSTA_CORE_API_URL}/catalog`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, options: [], code: 'catalog_unavailable' }, { status: 503 });
    }

    const payload = (await response.json()) as {
      data?: {
        newsletters?: CatalogNewsletter[];
        publications?: CatalogPublication[];
      };
    };

    const rows = Array.isArray(payload.data?.newsletters) ? payload.data.newsletters : [];
    const publications = Array.isArray(payload.data?.publications) ? payload.data.publications : [];
    const publicationMap = new Map(
      publications
        .filter((publication) => typeof publication.slug === 'string')
        .map((publication) => [publication.slug as string, publication])
    );

    const options: HipostaNewsletterOption[] = rows
      .filter((row) => typeof row.slug === 'string' && typeof row.publication_slug === 'string')
      .map((row) => {
        const publicationSlug = row.publication_slug as string;
        const publication = publicationMap.get(publicationSlug);
        return {
          slug: row.slug as string,
          name: typeof row.name === 'string' ? row.name : row.slug as string,
          publicationSlug,
          publicationName: typeof row.publication_name === 'string'
            ? row.publication_name
            : typeof publication?.name === 'string'
              ? publication.name
              : publicationSlug,
          publicationLogoUrl: typeof publication?.logo_url === 'string' ? publication.logo_url : null,
          publicationBrandColor: typeof publication?.brand_color === 'string' ? publication.brand_color : '#173bdc',
          publicationForegroundColor: typeof publication?.foreground_color === 'string' ? publication.foreground_color : '#ffffff',
          publicationMonogram: typeof publication?.monogram === 'string' ? publication.monogram : publicationSlug.slice(0, 2).toUpperCase(),
          description: typeof row.description === 'string' ? row.description : '',
          cadence: typeof row.cadence === 'string' ? row.cadence : '',
          accentColor: typeof row.accent_color === 'string' ? row.accent_color : '#173bdc',
          isPrimary: publicationSlug === 'tariften',
        };
      });

    return NextResponse.json(
      { success: true, options },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
    );
  } catch {
    return NextResponse.json({ success: false, options: [], code: 'catalog_unavailable' }, { status: 503 });
  }
}
