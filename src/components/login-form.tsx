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
  nextPath?: string;
  locale?: "en" | "mk";
};

function getSafeNextPath(nextPath: string) {
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/browse";
  }
  return nextPath;
}

function getSiteOrigin() {
  const configuredSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredSite && /^https?:\/\//.test(configuredSite)) {
    return configuredSite.replace(/\/+$/, "");
  }
  return window.location.origin;
}

function getRedirectUrl(nextPath: string) {
  const safeNext = getSafeNextPath(nextPath);
  const site = getSiteOrigin();
  return `${site}/api/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

export function LoginForm({
  defaultMode = "login",
  initialError = null,
  nextPath = "/browse",
  locale = "en",
}: Props) {
  const isMk = locale === "mk";
  const text = isMk
    ? {
        missingPassword: "Внеси лозинка за да се најавиш.",
        loginFailed: "Најавата не успеа.",
        confirmEmail:
          "Провери ја е-поштата за потврда на профилот, па потоа најави се.",
        registrationFailed: "Регистрацијата не успеа.",
        magicLinkSent: "Magic линк е испратен. Провери го inbox.",
        magicLinkFailed: "Не може да се испрати magic линк.",
        login: "Најава",
        register: "Регистрација",
        nameOptional: "Име (опционално)",
        namePlaceholder: "Твоето име",
        email: "Е-пошта",
        emailPlaceholder: "you@example.com",
        password: "Лозинка",
        min8: "(мин 8 карактери)",
        registerPasswordPlaceholder: "Креирај безбедна лозинка",
        loginPasswordPlaceholder: "Твојата лозинка",
        wait: "Почекај...",
        createAccount: "Креирај профил",
        sendMagicLink: "Испрати magic линк",
        policies:
          "Со продолжување се согласуваш со правилата и модерацијата на маркетплејсот.",
        adminAccess:
          "Админ пристапот се контролира преку улога во базата.",
        continueBrowsing: "Продолжи со пребарување",
      }
    : {
        missingPassword: "Please enter your password to log in.",
        loginFailed: "Login failed.",
        confirmEmail:
          "Check your email to confirm your account, then log in.",
        registrationFailed: "Registration failed.",
        magicLinkSent: "Magic link sent. Check your inbox.",
        magicLinkFailed: "Unable to send magic link.",
        login: "Login",
        register: "Register",
        nameOptional: "Name (optional)",
        namePlaceholder: "Your name",
        email: "Email",
        emailPlaceholder: "you@example.com",
        password: "Password",
        min8: "(min 8 chars)",
        registerPasswordPlaceholder: "Create a secure password",
        loginPasswordPlaceholder: "Your password",
        wait: "Please wait...",
        createAccount: "Create account",
        sendMagicLink: "Send magic link",
        policies:
          "By continuing you agree to marketplace policies and moderation rules.",
        adminAccess: "Admin access is controlled by role in database.",
        continueBrowsing: "Continue browsing",
      };
  const safeNextPath = getSafeNextPath(nextPath);
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(initialError);

  const isRegister = mode === "register";
  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (isRegister && password.trim().length < 8) return false;
    return true;
  }, [email, password, isRegister]);

  async function loginWithPassword() {
    if (!password.trim()) {
      setMessage(text.missingPassword);
      return;
    }

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
      window.location.href = safeNextPath;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.loginFailed);
    } finally {
      setLoading(false);
    }
  }

  async function registerWithPassword() {
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getRedirectUrl(safeNextPath),
          data: {
            name: name.trim() || undefined,
          },
        },
      });

      if (process.env.NODE_ENV !== "production") {
        console.log("signUp result", {
          hasSession: !!data.session,
          hasUser: !!data.user,
          error: error?.message,
        });
      }

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data.session) {
        setMessage(text.confirmEmail);
        setMode("login");
        return;
      }

      window.location.href = safeNextPath;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.registrationFailed);
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
          emailRedirectTo: getRedirectUrl(safeNextPath),
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage(text.magicLinkSent);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.magicLinkFailed);
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
          {text.login}
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
          {text.register}
        </button>
      </div>

      <div className="space-y-3">
        {isRegister && (
          <label className="space-y-1">
            <span className="text-sm font-medium">{text.nameOptional}</span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={text.namePlaceholder}
            />
          </label>
        )}

        <label className="space-y-1">
          <span className="text-sm font-medium">{text.email}</span>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={text.emailPlaceholder}
            required
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium">
            {text.password} {isRegister ? text.min8 : ""}
          </span>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={
              isRegister
                ? text.registerPasswordPlaceholder
                : text.loginPasswordPlaceholder
            }
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
          {loading ? text.wait : isRegister ? text.createAccount : text.login}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!email.trim() || loading}
          onClick={sendMagicLink}
          className="w-full"
        >
          {text.sendMagicLink}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {text.policies}
      </p>

      {message && (
        <p className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
          {message}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {text.adminAccess}{" "}
        <Link href="/browse" className="text-primary hover:underline">
          {text.continueBrowsing}
        </Link>
      </p>
    </div>
  );
}
