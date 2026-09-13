"use client";

import { optimizedImageUrl, responsiveImageSrcSet } from "@/lib/media/thumbnail-url";

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
    // Real, cached thumbnails; the original remains available if generation fails.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
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
      onError={(event) => {
        const image = event.currentTarget;
        if (image.dataset.originalFallback) return;
        image.dataset.originalFallback = "true";
        image.removeAttribute("srcset");
        image.src = src;
      }}
    />
  );
}
