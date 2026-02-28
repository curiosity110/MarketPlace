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
  const loginWithNext = new URL("/login", url.origin);
  loginWithNext.searchParams.set("next", next);

  if (errorDescription) {
    loginWithNext.searchParams.set("error", errorDescription);
    return NextResponse.redirect(
      loginWithNext,
    );
  }

  if (!code) {
    loginWithNext.searchParams.set("error", "Missing auth code");
    return NextResponse.redirect(loginWithNext);
  }

  const response = NextResponse.redirect(new URL(next, url.origin));
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient(response);
  } catch {
    loginWithNext.searchParams.set("error", "Auth service is not configured");
    return NextResponse.redirect(
      loginWithNext,
    );
  }

  let error: { message: string } | null = null;
  try {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } catch (exchangeError) {
    if (isLikelySupabaseConnectionError(exchangeError)) {
      loginWithNext.searchParams.set("error", "Auth service is unreachable");
      return NextResponse.redirect(
        loginWithNext,
      );
    }
    loginWithNext.searchParams.set("error", "Failed to complete login");
    return NextResponse.redirect(
      loginWithNext,
    );
  }

  if (error) {
    loginWithNext.searchParams.set("error", error.message);
    return NextResponse.redirect(
      loginWithNext,
    );
  }

  return response;
}
