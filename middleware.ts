import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const legacyRedirect = redirectLegacyWordPressPath(request);
  if (legacyRedirect) {
    return legacyRedirect;
  }

  if (request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/")) {
    return notFound();
  }

  if (request.nextUrl.pathname === "/manga1004") {
    return nextWithLocale(request, true);
  }

  if (request.nextUrl.pathname.startsWith("/manga1004/")) {
    const session = request.cookies.get("manga24_admin_session")?.value;
    if (!(await hasValidSession(session))) {
      return notFound();
    }
    return nextWithLocale(request, true);
  }

  return nextWithLocale(request, isPrivatePath(request.nextUrl.pathname));
}

export const config = {
  // The import endpoint authenticates its own Bearer token and accepts large
  // multipart bodies. Excluding it prevents middleware from cloning the upload.
  matcher: ["/((?!api/internal/import|_next/static|_next/image|favicon.ico|uploads/).*)"]
};

function nextWithLocale(request: NextRequest, forceNoIndex = false) {
  const requestHeaders = new Headers(request.headers);
  const locale = request.nextUrl.pathname.split("/")[1];
  requestHeaders.set("x-manga-locale", ["en", "es", "fr", "de", "pt"].includes(locale) ? locale : "en");
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (forceNoIndex || !isProductionHostname(request)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

const legacyWordPressPrefixes = [
  "/manga/",
  "/manga-genre/",
  "/manga-tag/",
  "/manga-author/",
  "/manga-artist/",
  "/wp-admin",
  "/wp-content/",
  "/wp-includes/",
  "/wp-json/",
  "/wp-login.php",
  "/author/",
  "/category/"
];

function redirectLegacyWordPressPath(request: NextRequest) {
  if (!legacyWordPressPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    return null;
  }

  const destination = new URL(request.nextUrl.pathname, "https://ko.manga24.net");
  destination.search = request.nextUrl.search;
  return NextResponse.redirect(destination, 301);
}

function isProductionHostname(request: NextRequest) {
  const hostname = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(":")[0]
    .toLowerCase();

  return hostname === "manga24.net" || hostname === "www.manga24.net";
}

function isPrivatePath(pathname: string) {
  return pathname.startsWith("/api/") || pathname === "/en/report" || pathname === "/es/report";
}

function notFound() {
  return new NextResponse("Not Found", {
    status: 404,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}

async function hasValidSession(value: string | undefined) {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;

  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = toBase64Url(new Uint8Array(digest));
  if (!constantTimeEqual(expected, signature)) return false;

  try {
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { expiresAt?: number };
    return typeof session.expiresAt === "number" && session.expiresAt > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}
