import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!path.startsWith("/sell") && !path.startsWith("/admin")) return NextResponse.next();

  const response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase();
  if (!email) return NextResponse.redirect(new URL("/login", request.url));

  if (path.startsWith("/admin")) {
    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (dbUser?.role !== "ADMIN") return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = { matcher: ["/sell/:path*", "/admin/:path*"] };
