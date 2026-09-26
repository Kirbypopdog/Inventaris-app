import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "./database.types";

const PUBLIC_PATHS = new Set(["/login"]);

/**
 * Refreshes the Supabase session cookie on every request and redirects based on
 * whether someone is logged in. This is only an optimistic check: pages verify
 * membership again (src/lib/auth/session.ts) and the database enforces RLS.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const env = getPublicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // Verifies the JWT and refreshes the session when needed. Must run before any redirect.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const isPublicPath = PUBLIC_PATHS.has(request.nextUrl.pathname);

  if (!isLoggedIn && !isPublicPath) {
    return redirectKeepingSession(request, "/login", response);
  }
  if (isLoggedIn && isPublicPath) {
    return redirectKeepingSession(request, "/", response);
  }
  return response;
}

/** A redirect that keeps the refreshed session cookies and cache headers. */
function redirectKeepingSession(
  request: NextRequest,
  pathname: string,
  from: NextResponse,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) {
      redirect.headers.set(header, value);
    }
  }
  return redirect;
}
