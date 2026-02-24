import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST() {
  supabaseServer();
  return NextResponse.json({ ok: true });
}
