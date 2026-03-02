"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { signInWithMagicLink, signInWithPassword, signUpWithPassword } from "@/app/(auth)/actions";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "login" | "register";

type Props = {
  defaultMode?: Mode;
  initialError?: string | null;
  nextPath?: string;
  locale?: Locale;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getSafeNextPath(nextPath: string) {
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }
  return nextPath;
}

export function LoginForm({
  defaultMode = "login",
  initialError = null,
  nextPath = "/dashboard",
  locale = "mk",
}: Props) {
  const isMk = locale === "mk";
  const text = isMk
    ? {
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
  const [loadingAction, setLoadingAction] = useState<
    "login" | "register" | "magic" | null
  >(null);
  const [message, setMessage] = useState<string | null>(initialError);

  const isRegister = mode === "register";
  const canSubmit = useMemo(() => {
    if (!email.trim() || !isValidEmail(email)) return false;
    if (isRegister && password.trim().length < 8) return false;
    return true;
  }, [email, password, isRegister]);

  async function onLogin() {
    if (!email.trim() || !isValidEmail(email)) {
      setMessage(t(locale, "auth.error.emailRequired"));
      return;
    }
    if (!password.trim()) {
      setMessage(t(locale, "auth.error.passwordRequired"));
      return;
    }

    setLoadingAction("login");
    setMessage(null);
    try {
      const result = await signInWithPassword(email.trim(), password);
      setMessage(t(locale, result.messageKey));
      if (result.ok) {
        window.location.href = safeNextPath;
      }
    } catch {
      setMessage(t(locale, "auth.error.generic"));
    } finally {
      setLoadingAction(null);
    }
  }

  async function onRegister() {
    if (!email.trim() || !isValidEmail(email)) {
      setMessage(t(locale, "auth.error.emailRequired"));
      return;
    }
    if (!password || password.trim().length < 8) {
      setMessage(t(locale, "auth.error.passwordTooShort"));
      return;
    }

    setLoadingAction("register");
    setMessage(null);
    try {
      const result = await signUpWithPassword(email.trim(), password, name);
      setMessage(t(locale, result.messageKey));
      if (result.ok && result.messageKey === "auth.signup.successSignedIn") {
        window.location.href = safeNextPath;
      }
      if (result.ok && result.messageKey === "auth.signup.checkEmail") {
        setMode("login");
      }
    } catch {
      setMessage(t(locale, "auth.error.generic"));
    } finally {
      setLoadingAction(null);
    }
  }

  async function onSendMagicLink() {
    if (!email.trim() || !isValidEmail(email)) {
      setMessage(t(locale, "auth.error.emailRequired"));
      return;
    }

    setLoadingAction("magic");
    setMessage(null);
    try {
      const result = await signInWithMagicLink(email.trim());
      setMessage(t(locale, result.messageKey));
    } catch {
      setMessage(t(locale, "auth.error.generic"));
    } finally {
      setLoadingAction(null);
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
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          disabled={!canSubmit || loadingAction !== null}
          onClick={isRegister ? onRegister : onLogin}
          className="w-full"
        >
          {loadingAction === "login" || loadingAction === "register"
            ? text.wait
            : isRegister
              ? text.createAccount
              : text.login}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!email.trim() || loadingAction !== null}
          onClick={onSendMagicLink}
          className="w-full"
        >
          {loadingAction === "magic" ? text.wait : text.sendMagicLink}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{text.policies}</p>

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
