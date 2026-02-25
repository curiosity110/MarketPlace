"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const loginWithPassword = async () => {
    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/browse";
  };

  const loginWithMagicLink = async () => {
    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/browse`,
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Check your email for the magic link.");
  };

  return (
    <div>
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="password (optional for magic link)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={loginWithPassword}>Login with Password</button>

      <button onClick={loginWithMagicLink}>Send Magic Link</button>

      {message && <p>{message}</p>}
    </div>
  );
}
