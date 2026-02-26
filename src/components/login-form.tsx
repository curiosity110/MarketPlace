"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "login" | "register";

type Props = {
  defaultMode?: Mode;
  initialError?: string | null;
};

function getRedirectUrl() {
  return `${window.location.origin}/api/auth/callback?next=/browse`;
}

export function LoginForm({ defaultMode = "login", initialError = null }: Props) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(initialError);

  const isRegister = mode === "register";
  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (!password.trim()) return false;
    if (isRegister && password.trim().length < 8) return false;
    return true;
  }, [email, password, isRegister]);

  async function loginWithPassword() {
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }
      window.location.href = "/browse";
    } finally {
      setLoading(false);
    }
  }

  async function registerWithPassword() {
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getRedirectUrl(),
          data: {
            name: name.trim() || undefined,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage(
        "Account created. Check your email and confirm your address before login.",
      );
      setMode("login");
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink() {
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: getRedirectUrl(),
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Magic link sent. Check your inbox.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            mode === "login"
              ? "bg-white text-foreground shadow-sm dark:bg-card"
              : "text-muted-foreground"
          }`}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            mode === "register"
              ? "bg-white text-foreground shadow-sm dark:bg-card"
              : "text-muted-foreground"
          }`}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>

      <div className="space-y-3">
        {isRegister && (
          <label className="space-y-1">
            <span className="text-sm font-medium">Name (optional)</span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
            />
          </label>
        )}

        <label className="space-y-1">
          <span className="text-sm font-medium">Email</span>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium">
            Password {isRegister ? "(min 8 chars)" : ""}
          </span>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={isRegister ? "Create a secure password" : "Your password"}
            required
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          disabled={!canSubmit || loading}
          onClick={isRegister ? registerWithPassword : loginWithPassword}
          className="w-full"
        >
          {loading ? "Please wait..." : isRegister ? "Create account" : "Login"}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!email.trim() || loading}
          onClick={sendMagicLink}
          className="w-full"
        >
          Send magic link
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        By continuing you agree to marketplace policies and moderation rules.
      </p>

      {message && (
        <p className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
          {message}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Admin access is controlled by role in database.{" "}
        <Link href="/browse" className="text-primary hover:underline">
          Continue browsing
        </Link>
      </p>
    </div>
  );
}
