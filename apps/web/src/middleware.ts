import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login"];

const ROLE_PREFIXES: Record<string, string[]> = {
  STUDENT: ["/student"],
  TEACHER: ["/teacher"],
  COORDINATOR: ["/coordinator", "/teacher", "/student"],
  ADMIN: ["/coordinator", "/teacher", "/student"],
};

const ROLE_HOME: Record<string, string> = {
  STUDENT: "/student",
  TEACHER: "/teacher",
  COORDINATOR: "/coordinator",
  ADMIN: "/coordinator",
};

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const accessToken =
    req.cookies.get("gosf_access_token")?.value ??
    req.headers.get("x-access-token") ??
    null;

  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = parseJwtPayload(accessToken);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const exp = payload.exp as number;
  if (exp * 1000 < Date.now()) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = payload.role as string;
  const allowed = ROLE_PREFIXES[role] ?? [];
  const canAccess = allowed.some((prefix) => pathname.startsWith(prefix));

  if (!canAccess) {
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
