'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import NewsletterForm from '@/components/newsletter/NewsletterForm';
import type { NewsletterSourceId } from '@/lib/hiposta-newsletters';

type Props = {
  source: NewsletterSourceId;
  targetHeading: string;
  title: string;
  description: string;
  className?: string;
};

export default function InlineNewsletterPlacement({
  source,
  targetHeading,
  title,
  description,
  className = '',
}: Props) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const headings = Array.from(document.querySelectorAll<HTMLElement>('h2, h3, h4'));
    const heading = headings.find((item) => item.textContent?.trim() === targetHeading);
    if (!heading) return;

    const target = heading.parentElement?.parentElement;
    if (!target?.parentElement) return;

    const slot = document.createElement('div');
    slot.dataset.newsletterPlacement = source;
    slot.className = `print:hidden ${className}`.trim();
    target.parentElement.insertBefore(slot, target);
    setHost(slot);

    return () => {
      setHost(null);
      slot.remove();
    };
  }, [source, targetHeading, className]);

  if (!host) return null;

  return createPortal(
    <NewsletterForm
      source={source}
      variant="horizontal"
      title={title}
      description={description}
    />,
    host,
  );
}
