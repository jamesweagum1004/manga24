export function imageCdnUrl(objectKey: string, baseUrl: string, storedUrl?: string | null) {
  if (!baseUrl) {
    if (storedUrl) return storedUrl;
    throw new Error("NEXT_PUBLIC_IMAGE_CDN_URL is not configured.");
  }
  validateImageCdnUrl(baseUrl);
  return new URL(encodeObjectKey(objectKey), ensureTrailingSlash(baseUrl)).toString();
}

export function isImageCdnUrl(value: string | null | undefined, baseUrl: string) {
  if (!value || !baseUrl) return false;
  try {
    return new URL(value).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}

export function validateImageCdnUrl(baseUrl: string) {
  const image = new URL(baseUrl);
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://manga24.net");
  if (image.protocol !== "https:" || image.pathname !== "/" || image.search || image.hash) throw new Error("NEXT_PUBLIC_IMAGE_CDN_URL must be an HTTPS origin without a path.");
  if (image.origin === site.origin || image.hostname === site.hostname || image.hostname.endsWith(`.${site.hostname}`)) throw new Error("The image CDN must use a domain independent from the main site domain.");
  return image.origin;
}

function encodeObjectKey(value: string) {
  return value.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}
