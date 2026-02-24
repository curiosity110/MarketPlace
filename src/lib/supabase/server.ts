import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { SB_ACCESS_COOKIE } from "@/lib/supabase/cookies";

export const supabaseServer = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function getAccessToken() {
  return (await cookies()).get(SB_ACCESS_COOKIE)?.value;
}
