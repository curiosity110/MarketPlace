"use client";

import { type FormEvent, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const COOLDOWN_SECONDS = 60;
const devPasswordEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_PASSWORD_LOGIN === "true";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string>();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const sendLink = async (e: FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/api/auth/callback?next=/browse`,
      },
    });

    if (error) {
      const looksRateLimited = /rate|security purposes|wait/i.test(error.message);
      setMessage(
        looksRateLimited
          ? "Too many requests. Please wait a minute before requesting another magic link."
          : error.message,
      );
      if (looksRateLimited) setCooldown(COOLDOWN_SECONDS);
      return;
    }

    setMessage("Check your email for a magic link.");
    setCooldown(COOLDOWN_SECONDS);
  };

  const loginWithPassword = async (e: FormEvent) => {
    e.preventDefault();

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/browse";
  };

  return (
    <Card className="max-w-md">
      <CardContent className="space-y-3">
        <form onSubmit={sendLink} className="space-y-3">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />
          <Button className="w-full" type="submit" disabled={cooldown > 0}>
            {cooldown > 0 ? `Send magic link (${cooldown}s)` : "Send magic link"}
          </Button>
        </form>

        {devPasswordEnabled && (
          <form onSubmit={loginWithPassword} className="space-y-3">
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dev password"
            />
            <Button className="w-full" type="submit" variant="secondary">
              Login with password (dev)
            </Button>
          </form>
        )}

        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}
