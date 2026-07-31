import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/")) {
    return notFound();
  }

  if (request.nextUrl.pathname === "/manga1004") {
    return nextWithLocale(request);
  }

  if (request.nextUrl.pathname.startsWith("/manga1004/")) {
    const session = request.cookies.get("manga24_admin_session")?.value;
    if (!(await hasValidSession(session))) {
      return notFound();
    }
  }

  return nextWithLocale(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"]
};

function nextWithLocale(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const locale = request.nextUrl.pathname.split("/")[1];
  requestHeaders.set("x-manga-locale", locale === "es" ? "es" : "en");
  return NextResponse.next({ request: { headers: requestHeaders } });
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
