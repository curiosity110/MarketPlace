import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { SB_ACCESS_COOKIE } from "@/lib/supabase/cookies";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request);

  const path = request.nextUrl.pathname;
  if (!path.startsWith("/sell") && !path.startsWith("/admin")) return sessionResponse;

  const token = request.cookies.get(SB_ACCESS_COOKIE)?.value ?? sessionResponse.cookies.get(SB_ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/login", request.url));

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await supabase.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (!email) return NextResponse.redirect(new URL("/login", request.url));

  if (path.startsWith("/admin")) {
    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (dbUser?.role !== "ADMIN") return NextResponse.redirect(new URL("/login", request.url));
  }

  return sessionResponse;
}

export const config = { matcher: ["/sell/:path*", "/admin/:path*"] };
