import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(next: string | null) {
  if (!next) return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

function isEmailOtpType(value: string | null): value is EmailOtpType {
  if (!value) return false;
  return (
    value === "signup" ||
    value === "magiclink" ||
    value === "invite" ||
    value === "recovery" ||
    value === "email_change" ||
    value === "email"
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpTypeRaw = url.searchParams.get("type");
  const next = getSafeNextPath(url.searchParams.get("next"));

  const response = NextResponse.redirect(new URL(next, url.origin));
  try {
    const supabase = await createSupabaseServerClient(response);

    if (code) {
      const result = await supabase.auth.exchangeCodeForSession(code);
      if (result.error) {
        const loginUrl = new URL("/login", url.origin);
        loginUrl.searchParams.set("error", "auth.error.callbackFailed");
        loginUrl.searchParams.set("next", next);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    if (tokenHash && isEmailOtpType(otpTypeRaw)) {
      const result = await supabase.auth.verifyOtp({
        type: otpTypeRaw,
        token_hash: tokenHash,
      });
      if (result.error) {
        const loginUrl = new URL("/login", url.origin);
        loginUrl.searchParams.set("error", "auth.error.callbackFailed");
        loginUrl.searchParams.set("next", next);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "auth.error.invalidLink");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error("[AUTH] callback", error);
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "auth.error.callbackFailed");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }
}
