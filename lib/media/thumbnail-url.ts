export const thumbnailWidths = [160, 320, 640, 920, 1280] as const;

export function optimizedImageUrl(src: string, width: number) {
  if (!src.startsWith("https://") || !Number.isFinite(width) || width <= 0) return src;
  const size = thumbnailWidths.find((value) => value >= width) ?? 1280;
  return `/media/thumbnail?src=${encodeURIComponent(src)}&w=${size}`;
}

export function responsiveImageSrcSet(src: string, widths: number[]) {
  if (!src.startsWith("https://")) return undefined;
  const sizes = [...new Set(widths.filter((w) => Number.isFinite(w) && w > 0)
    .map((w) => thumbnailWidths.find((size) => size >= w) ?? 1280))].sort((a, b) => a - b);
  return sizes.map((w) => `${optimizedImageUrl(src, w)} ${w}w`).join(", ") || undefined;
}
