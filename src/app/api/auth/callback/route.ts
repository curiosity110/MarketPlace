import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCookieOptions, SB_ACCESS_COOKIE, SB_REFRESH_COOKIE } from "@/lib/supabase/cookies";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/browse";

  console.log("Callback code:", code);

  if (!code) {
    console.log("No code in callback");
    return NextResponse.redirect(`${origin}/login`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  const supabase = await createSupabaseServerClient(response);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  console.log("Exchange result:", data);

  if (error) {
    console.log("Exchange error:", error);
    return NextResponse.redirect(`${origin}/login`);
  }

  if (data.session) {
    response.cookies.set(SB_ACCESS_COOKIE, data.session.access_token, getCookieOptions());
    response.cookies.set(SB_REFRESH_COOKIE, data.session.refresh_token, getCookieOptions());
  }

  return response;
}
