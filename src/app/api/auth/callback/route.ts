import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isLikelySupabaseConnectionError } from "@/lib/supabase/errors";

function getSafeNextPath(next: string | null) {
  if (!next) return "/browse";
  if (!next.startsWith("/") || next.startsWith("//")) return "/browse";
  return next;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeNextPath(url.searchParams.get("next"));
  const errorDescription = url.searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription)}`, url.origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=Missing%20auth%20code", url.origin));
  }

  const response = NextResponse.redirect(new URL(next, url.origin));
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient(response);
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=Auth%20service%20is%20not%20configured", url.origin),
    );
  }

  let error: { message: string } | null = null;
  try {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } catch (exchangeError) {
    if (isLikelySupabaseConnectionError(exchangeError)) {
      return NextResponse.redirect(
        new URL("/login?error=Auth%20service%20is%20unreachable", url.origin),
      );
    }
    return NextResponse.redirect(
      new URL("/login?error=Failed%20to%20complete%20login", url.origin),
    );
  }

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  return response;
}
