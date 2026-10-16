import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Preserve the project's existing allowed OAuth/email redirect destinations.
  // PKCE codes must be exchanged before a protected Server Component renders.
  const code = request.nextUrl.searchParams.get("code");
  if (code && ["/dashboard", "/auth/confirmed"].includes(request.nextUrl.pathname)) {
    const callback = new URL("/auth/callback", request.url);
    callback.searchParams.set("code", code);
    if (request.nextUrl.pathname === "/auth/confirmed") callback.searchParams.set("next", "/auth/confirmed");
    const redirect = NextResponse.redirect(callback);
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }
  // Let the callback exchange its code before any session refresh. Refreshing an
  // expired session can clear the PKCE verifier needed for password recovery.
  if (request.nextUrl.pathname === "/auth/callback") {
    const response = NextResponse.next({ request });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  // Validate/refresh before rendering. Every protected loader also verifies its user.
  await supabase.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*", "/auth/:path*"],
};
