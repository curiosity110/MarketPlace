import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function WhoAmI() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return <pre>{JSON.stringify(data.user ?? null, null, 2)}</pre>;
}
