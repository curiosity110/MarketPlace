import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getCookieOptions, SB_ACCESS_COOKIE, SB_REFRESH_COOKIE } from "@/lib/supabase/cookies";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/browse";

  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const jar = await cookies();
  jar.set(SB_ACCESS_COOKIE, data.session.access_token, getCookieOptions());
  jar.set(SB_REFRESH_COOKIE, data.session.refresh_token, getCookieOptions());

  return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/browse", url.origin));
}
