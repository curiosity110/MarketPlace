import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

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
  const isProd = process.env.NODE_ENV === "production";

  jar.set("sb-access-token", data.session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
  });

  jar.set("sb-refresh-token", data.session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
  });

  return NextResponse.redirect(`${origin}/browse`);
}
