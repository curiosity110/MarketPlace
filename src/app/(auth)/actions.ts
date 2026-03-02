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

function isInvalidCredentialsError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("invalid login credentials") ||
    lower.includes("email not confirmed") ||
    lower.includes("invalid email or password")
  );
}

async function resolveSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (origin) return origin.replace(/\/+$/, "");

  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`.replace(/\/+$/, "");

  return "http://localhost:3000";
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
): Promise<AuthActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const site = await resolveSiteUrl();
    const result = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: {
        emailRedirectTo: `${site}/api/auth/callback`,
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
  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    authLog("signInWithPassword", result.data, result.error);

    if (result.error) {
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
): Promise<AuthActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const site = await resolveSiteUrl();
    const result = await supabase.auth.signInWithOtp({
      email: normalizeEmail(email),
      options: {
        emailRedirectTo: `${site}/api/auth/callback`,
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
