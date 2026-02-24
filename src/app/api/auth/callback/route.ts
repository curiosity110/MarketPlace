import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getCookieOptions, SB_ACCESS_COOKIE, SB_REFRESH_COOKIE } from "@/lib/supabase/cookies";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.verifyOtp({
    type: type as "magiclink",
    token_hash,
  });

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const jar = await cookies();
  jar.set(SB_ACCESS_COOKIE, data.session.access_token, getCookieOptions());
  jar.set(SB_REFRESH_COOKIE, data.session.refresh_token, getCookieOptions());

  return NextResponse.redirect(`${origin}/browse`);
}
