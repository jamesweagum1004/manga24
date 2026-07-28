import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const credentialsConfigured = Boolean(username && password);

  if (!credentialsConfigured) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Admin credentials are not configured.", { status: 403 });
    }

    return NextResponse.next();
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) {
    return unauthorized();
  }

  const decoded = decodeBasicAuth(authorization);
  if (!decoded || decoded.username !== username || decoded.password !== password) {
    return unauthorized();
  }

  return NextResponse.next();
}

function decodeBasicAuth(authorization: string) {
  try {
    const decoded = atob(authorization.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1)
    };
  } catch {
    return null;
  }
}

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Manga24 Admin", charset="UTF-8"'
    }
  });
}

export const config = {
  matcher: ["/admin/:path*"]
};
