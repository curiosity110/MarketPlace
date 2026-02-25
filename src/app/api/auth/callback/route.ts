import { NextResponse } from "next/server";
import { getCookieOptions, SB_ACCESS_COOKIE, SB_REFRESH_COOKIE } from "@/lib/supabase/cookies";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/browse";

  console.log("Auth callback code:", code);

  if (!code) {
    console.log("No code in callback");
    return NextResponse.redirect(`${origin}/login`);
  }

  const redirectUrl = `${origin}${next.startsWith("/") ? next : "/browse"}`;
  const response = NextResponse.redirect(redirectUrl);
  const supabase = await createSupabaseServerClient(response);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  console.log("Exchange result:", data);
  console.log("Exchange error:", error);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const options = getCookieOptions();
  response.cookies.set(SB_ACCESS_COOKIE, data.session.access_token, options);
  response.cookies.set(SB_REFRESH_COOKIE, data.session.refresh_token, options);

  return response;
}
