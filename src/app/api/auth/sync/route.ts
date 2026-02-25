import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  await createSupabaseServerClient();
  return NextResponse.json({ ok: true });
}
