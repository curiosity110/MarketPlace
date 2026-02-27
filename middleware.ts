import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import {
  markSupabaseHealthy,
  markSupabaseUnavailable,
  shouldSkipSupabaseCalls,
} from "@/lib/supabase/circuit-breaker";
import { isLikelySupabaseConnectionError } from "@/lib/supabase/errors";

function buildLoginRedirect(request: NextRequest, error?: string) {
  const loginUrl = new URL("/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (nextPath && nextPath !== "/login") {
    loginUrl.searchParams.set("next", nextPath);
  }
  if (error) {
    loginUrl.searchParams.set("error", error);
  }
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!path.startsWith("/sell") && !path.startsWith("/admin")) return NextResponse.next();

  const supabaseConfig = getSupabasePublicConfig();
  if (!supabaseConfig) {
    return buildLoginRedirect(request, "Configure Supabase URL");
  }

  if (shouldSkipSupabaseCalls()) {
    return buildLoginRedirect(request, "Auth service is unreachable");
  }

  const response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let user: { email?: string | null } | null = null;
  try {
    const authResult = await supabase.auth.getUser();
    user = authResult.data.user;
    markSupabaseHealthy();
  } catch (error) {
    if (isLikelySupabaseConnectionError(error)) {
      markSupabaseUnavailable();
    }
    return buildLoginRedirect(request, "Auth service is unreachable");
  }

  const email = user?.email?.toLowerCase();
  if (!email) return buildLoginRedirect(request);

  if (path.startsWith("/admin")) {
    if (shouldSkipPrismaCalls()) {
      return buildLoginRedirect(request, "Database is unreachable");
    }

    let dbUser: { role: string } | null = null;
    try {
      dbUser = await prisma.user.findUnique({ where: { email }, select: { role: true } });
      markPrismaHealthy();
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        return buildLoginRedirect(request, "Database is unreachable");
      }
      throw error;
    }

    if (
      !dbUser ||
      (dbUser.role !== "ADMIN" && dbUser.role !== "STAFF" && dbUser.role !== "CEO")
    ) {
      return buildLoginRedirect(request);
    }
  }

  return response;
}

export const config = { matcher: ["/sell/:path*", "/admin/:path*"] };
