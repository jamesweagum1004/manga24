type Props = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  responsiveWidths?: number[];
  intrinsicWidth?: number;
  intrinsicHeight?: number;
};

export function ContentImage({
  src,
  alt,
  className = "",
  fill = false,
  priority = false,
  sizes,
  responsiveWidths = [160, 320, 640],
  intrinsicWidth = 320,
  intrinsicHeight = 427
}: Props) {
  const srcSet = responsiveImageSrcSet(src, responsiveWidths);
  const fallbackWidth = Math.min(640, Math.max(320, ...responsiveWidths));

  return (
    // Keep the runtime CDN hostname while letting Bunny Optimizer resize by query string.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimizedImageUrl(src, fallbackWidth)}
      alt={alt}
      width={intrinsicWidth}
      height={intrinsicHeight}
      className={`${fill ? "absolute inset-0 h-full w-full" : ""} ${className}`.trim()}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "low"}
      sizes={sizes}
      srcSet={srcSet}
      decoding="async"
    />
  );
}

export function optimizedImageUrl(src: string, width: number) {
  if (!/^https:\/\//u.test(src) || !Number.isFinite(width) || width <= 0) return src;
  try {
    const url = new URL(src);
    url.searchParams.set("width", String(Math.round(width)));
    url.searchParams.set("quality", "72");
    url.searchParams.set("format", "webp");
    return url.toString();
  } catch {
    return src;
  }
}

function responsiveImageSrcSet(src: string, widths: number[]) {
  if (!/^https:\/\//u.test(src)) return undefined;
  const normalized = [...new Set(widths.map((width) => Math.round(width)).filter((width) => width > 0))].sort((a, b) => a - b);
  return normalized.length > 0
    ? normalized.map((width) => `${optimizedImageUrl(src, width)} ${width}w`).join(", ")
    : undefined;
}
