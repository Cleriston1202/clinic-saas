import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";

const MISSING_CSS_MAP_PATH = "/_next/static/css/app/styles.css.map";
const PUBLIC_PATHS = ["/login", "/register"];
const PRIVATE_PREFIXES = ["/dashboard", "/patients", "/doctors", "/appointments", "/settings"];

function isPrivatePath(pathname: string) {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

async function fetchCurrentClinicId(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const authHeaders = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
  };

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: authHeaders });
  if (!userRes.ok) return null;
  const userPayload = (await userRes.json()) as { id?: string };
  if (!userPayload.id) return null;

  const membersRes = await fetch(
    `${supabaseUrl}/rest/v1/clinic_members?select=clinic_id&user_id=eq.${userPayload.id}&limit=1`,
    { headers: authHeaders },
  );
  if (membersRes.ok) {
    const members = (await membersRes.json()) as Array<{ clinic_id?: string }>;
    if (members[0]?.clinic_id) return members[0].clinic_id;
  }

  const legacyRes = await fetch(`${supabaseUrl}/rest/v1/users?select=clinic_id&id=eq.${userPayload.id}&limit=1`, {
    headers: authHeaders,
  });
  if (!legacyRes.ok) return null;
  const profiles = (await legacyRes.json()) as Array<{ clinic_id?: string | null }>;
  return profiles[0]?.clinic_id ?? null;
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === MISSING_CSS_MAP_PATH) {
    // Return an empty source map to avoid noisy 404 logs in development.
    return new NextResponse(
      JSON.stringify({
        version: 3,
        file: "styles.css",
        sources: [],
        names: [],
        mappings: "",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  if (!isPrivatePath(request.nextUrl.pathname) && !isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return handleAuthRouting(request);
}

async function handleAuthRouting(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token && isPrivatePath(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!token) {
    return NextResponse.next();
  }

  const clinicId = await fetchCurrentClinicId(decodeURIComponent(token));

  if (!clinicId && pathname !== "/settings" && isPrivatePath(pathname)) {
    return NextResponse.redirect(new URL("/settings", request.url));
  }

  if (clinicId && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/_next/static/css/app/styles.css.map",
    "/dashboard/:path*",
    "/patients/:path*",
    "/doctors/:path*",
    "/appointments/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
