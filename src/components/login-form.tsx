"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const loginWithPassword = async () => {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return setMessage(error.message);

    window.location.href = "/browse";
  };

  const sendMagicLink = async () => {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/browse`,
      },
    });

    if (error) return setMessage(error.message);

    setMessage("Check your email for the magic link.");
  };

  return (
    <div className="space-y-2">
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="password (for password login)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="flex gap-2">
        <button onClick={loginWithPassword}>Login with Password</button>
        <button onClick={sendMagicLink}>Send Magic Link</button>
      </div>

      {message && <p>{message}</p>}
    </div>
  );
}
