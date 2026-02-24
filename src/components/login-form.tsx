"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string>();

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
      // options: { emailRedirectTo: `${location.origin}/auth/finish` },
    });
    setMessage(error ? error.message : "Check your email for a magic link.");
  };

  return (
    <form onSubmit={sendLink} className="space-y-3 max-w-md">
      <input
        className="w-full rounded border p-2"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@example.com"
      />
      <button className="rounded border px-3 py-2" type="submit">
        Send magic link
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}
