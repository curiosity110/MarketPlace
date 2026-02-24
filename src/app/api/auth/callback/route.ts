import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (token_hash && type) {
    const supabase = supabaseServer();
    const { data } = await supabase.auth.verifyOtp({ type: type as "magiclink", token_hash });
    const jar = await cookies();
    if (data.session?.access_token) {
      jar.set("sb-access-token", data.session.access_token, { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
      jar.set("sb-refresh-token", data.session.refresh_token, { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
    }
  }
  return NextResponse.redirect(`${origin}/`);
}
