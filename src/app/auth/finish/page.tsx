"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function FinishAuth() {
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();

    const run = async () => {
      const hash = window.location.hash;
      if (!hash) return;

      const params = new URLSearchParams(hash.slice(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) return;

      await supabase.auth.setSession({ access_token, refresh_token });
      router.replace("/browse");
    };

    run();
  }, [router]);

  return <div className="p-6">Completing login...</div>;
}
