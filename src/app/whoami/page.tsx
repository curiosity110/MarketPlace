import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { isLikelySupabaseConnectionError } from "@/lib/supabase/errors";

export default async function WhoAmI() {
  if (!getSupabasePublicConfig()) {
    return <pre>{JSON.stringify({ error: "Supabase auth is not configured." }, null, 2)}</pre>;
  }

  let payload: unknown = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    payload = data.user ?? null;
  } catch (error) {
    const message = isLikelySupabaseConnectionError(error)
      ? "Supabase host is unreachable. Check NEXT_PUBLIC_SUPABASE_URL."
      : "Unable to fetch current user.";

    payload = { error: message };
  }

  return <pre>{JSON.stringify(payload, null, 2)}</pre>;
}
