import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSafeErrorMessage } from "@/lib/supabase/errors";

function getSafeNextPath(next: string | null) {
  if (!next) return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeNextPath(url.searchParams.get("next"));

  if (!code) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "Missing auth code");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(new URL(next, url.origin));
  try {
    const supabase = await createSupabaseServerClient(response);
    const result = await supabase.auth.exchangeCodeForSession(code);
    if (result.error) {
      const loginUrl = new URL("/login", url.origin);
      loginUrl.searchParams.set("error", result.error.message);
      loginUrl.searchParams.set("next", next);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  } catch (error) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set(
      "error",
      getSafeErrorMessage(error, "Failed to complete authentication."),
    );
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }
}
