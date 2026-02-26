import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const url = new URL(request.url);

  const response = NextResponse.redirect(new URL("/browse", url.origin));
  const supabase = await createSupabaseServerClient(response);

  await supabase.auth.signOut();

  return response;
}
