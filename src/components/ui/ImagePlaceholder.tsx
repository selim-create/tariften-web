interface ImagePlaceholderProps {
  title?: string;
  variant?: 'card' | 'detail';
  className?: string;
}

/**
 * Quiet stand-in for content without a photo yet. Same cream surface and
 * brand rule as the recipe cover, so lists look deliberate, not broken.
 * States plainly that the photo is pending; no jokes, no icons.
 */
export function ImagePlaceholder({
  title = "",
  variant = 'card',
  className = ''
}: ImagePlaceholderProps) {
  if (variant === 'detail') {
    return (
      <div className={`relative h-full w-full bg-[#f6efe8] text-[#2a211c] ${className}`}>
        <div className="absolute inset-3 rounded-[20px] border border-[#e6dacd] sm:inset-4" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-8 sm:p-10">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#db4c3f]">Tariften</span>
          <div>
            <span className="mb-5 block h-[3px] w-10 rounded-full bg-[#db4c3f]" aria-hidden />
            {title && <p className="max-w-[18ch] font-heading text-[28px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[36px]"
              dangerouslySetInnerHTML={{ __html: title }} />}
          </div>
          <p className="text-xs text-[#9a8b7e]">Görsel hazırlanıyor</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full flex-col items-start justify-end bg-[#f6efe8] p-4 ${className}`}>
      <span className="mb-2 block h-[2px] w-6 rounded-full bg-[#db4c3f]" aria-hidden />
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a8b7e]">Görsel hazırlanıyor</span>
      {title && <span className="sr-only" dangerouslySetInnerHTML={{ __html: title }} />}
    </div>
  );
}
