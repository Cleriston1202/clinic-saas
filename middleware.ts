import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const MISSING_CSS_MAP_PATH = "/_next/static/css/app/styles.css.map";

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/_next/static/css/app/styles.css.map"],
};
