import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isLikelySupabaseConnectionError } from "@/lib/supabase/errors";

export async function POST(request: Request) {
  const url = new URL(request.url);

  const response = NextResponse.redirect(new URL("/browse", url.origin));
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient(response);
  } catch {
    return response;
  }

  try {
    await supabase.auth.signOut();
  } catch (error) {
    if (!isLikelySupabaseConnectionError(error)) {
      throw error;
    }
  }

  return response;
}
