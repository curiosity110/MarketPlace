"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSafeErrorMessage } from "@/lib/supabase/errors";

export type AuthActionResult = {
  ok: boolean;
  messageKey: string;
};

const GENERIC_ERROR: AuthActionResult = {
  ok: false,
  messageKey: "auth.error.generic",
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getSafeNextPath(nextPath: string | null | undefined) {
  if (!nextPath) return "/dashboard";
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return "/dashboard";
  return nextPath;
}

function normalizeSiteUrl(rawUrl: string | null | undefined) {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function isInvalidCredentialsError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid email or password")
  );
}

function isEmailNotConfirmedError(message: string) {
  return message.toLowerCase().includes("email not confirmed");
}

async function resolveSiteUrl() {
  const requestHeaders = await headers();
  const origin = normalizeSiteUrl(requestHeaders.get("origin"));
  if (origin) return origin;

  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = (forwardedHost?.split(",")[0] || requestHeaders.get("host") || "").trim();
  if (host) {
    const forwardedProto = requestHeaders.get("x-forwarded-proto");
    const protoCandidate = (forwardedProto?.split(",")[0] || "").trim().toLowerCase();
    const proto = protoCandidate === "https" ? "https" : "http";
    const derived = normalizeSiteUrl(`${proto}://${host}`);
    if (derived) return derived;
  }

  const configured = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured) return configured;

  return "http://localhost:3000";
}

function buildAuthCallbackUrl(siteUrl: string, nextPath: string | null | undefined) {
  const url = new URL("/api/auth/callback", siteUrl);
  url.searchParams.set("next", getSafeNextPath(nextPath));
  return url.toString();
}

function authLog(name: string, data: unknown, error: { message: string } | null) {
  console.log("[AUTH]", name, {
    data,
    error: error?.message,
  });
}

export async function signUpWithPassword(
  email: string,
  password: string,
  name?: string,
  nextPath?: string,
): Promise<AuthActionResult> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return { ok: false, messageKey: "auth.error.emailRequired" };
  }
  if (!password || password.trim().length < 8) {
    return { ok: false, messageKey: "auth.error.passwordTooShort" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const site = await resolveSiteUrl();
    const result = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(site, nextPath),
        data: {
          name: name?.trim() || undefined,
        },
      },
    });

    authLog("signUpWithPassword", result.data, result.error);

    if (result.error) return GENERIC_ERROR;
    if (result.data.session) {
      return { ok: true, messageKey: "auth.signup.successSignedIn" };
    }

    // If confirm-email is disabled, this fallback signs in immediately.
    const signInFallback = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    authLog(
      "signUpWithPassword.fallbackSignIn",
      signInFallback.data,
      signInFallback.error,
    );
    if (!signInFallback.error && signInFallback.data.session) {
      return { ok: true, messageKey: "auth.signup.successSignedIn" };
    }

    return { ok: true, messageKey: "auth.signup.checkEmail" };
  } catch (error) {
    authLog("signUpWithPassword", null, {
      message: getSafeErrorMessage(error, "Unexpected sign up failure"),
    });
    return GENERIC_ERROR;
  }
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return { ok: false, messageKey: "auth.error.emailRequired" };
  }
  if (!password || !password.trim()) {
    return { ok: false, messageKey: "auth.error.passwordRequired" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    authLog("signInWithPassword", result.data, result.error);

    if (result.error) {
      if (isEmailNotConfirmedError(result.error.message)) {
        return { ok: false, messageKey: "auth.signup.checkEmail" };
      }
      if (isInvalidCredentialsError(result.error.message)) {
        return { ok: false, messageKey: "auth.error.invalidCredentials" };
      }
      return GENERIC_ERROR;
    }

    return { ok: true, messageKey: "auth.login.success" };
  } catch (error) {
    authLog("signInWithPassword", null, {
      message: getSafeErrorMessage(error, "Unexpected sign in failure"),
    });
    return GENERIC_ERROR;
  }
}

export async function signInWithMagicLink(
  email: string,
  nextPath?: string,
): Promise<AuthActionResult> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return { ok: false, messageKey: "auth.error.emailRequired" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const site = await resolveSiteUrl();
    const result = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(site, nextPath),
      },
    });

    authLog("signInWithMagicLink", result.data, result.error);

    if (result.error) return GENERIC_ERROR;
    return { ok: true, messageKey: "auth.magic.sent" };
  } catch (error) {
    authLog("signInWithMagicLink", null, {
      message: getSafeErrorMessage(error, "Unexpected magic link failure"),
    });
    return GENERIC_ERROR;
  }
}

export async function signOut() {
  let error: { message: string } | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.signOut();
    error = result.error;
  } catch (unknownError) {
    error = {
      message: getSafeErrorMessage(unknownError, "Unexpected sign out failure"),
    };
  }

  authLog("signOut", null, error);
  redirect("/browse");
}
