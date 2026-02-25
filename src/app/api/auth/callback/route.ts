import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/browse";

  if (!code) return NextResponse.redirect(new URL("/login", url.origin));

  const response = NextResponse.redirect(new URL(next, url.origin));
  const supabase = await createSupabaseServerClient(response);

  return response;
}
