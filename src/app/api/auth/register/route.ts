import { NextResponse } from "next/server";
import { getSafeErrorMessage } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  authLog,
  buildAuthCallbackUrl,
  GENERIC_AUTH_ERROR,
  isEmailNotConfirmedError,
  isInvalidCredentialsError,
  isUserAlreadyRegisteredError,
  isValidEmail,
  jsonWithCookies,
  normalizeEmail,
  parseJsonBody,
  resolveSiteUrlFromRequest,
} from "@/lib/auth/api-routes";

type RegisterBody = {
  email?: string;
  password?: string;
  name?: string;
  nextPath?: string;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<RegisterBody>(request);
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name : "";
  const nextPath = typeof body.nextPath === "string" ? body.nextPath : undefined;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return NextResponse.json({ ok: false, messageKey: "auth.error.emailRequired" });
  }
  if (!password || password.trim().length < 8) {
    return NextResponse.json({ ok: false, messageKey: "auth.error.passwordTooShort" });
  }

  const cookieCarrier = new NextResponse();
  try {
    const supabase = await createSupabaseServerClient(cookieCarrier);
    const site = resolveSiteUrlFromRequest(request);
    const result = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(site, nextPath),
        data: {
          name: name.trim() || undefined,
        },
      },
    });

    authLog(
      "signUpWithPassword",
      {
        hasUser: Boolean(result.data.user),
        hasSession: Boolean(result.data.session),
      },
      result.error ? { message: result.error.message } : null,
    );

    if (result.error) {
      if (isUserAlreadyRegisteredError(result.error.message)) {
        const existingAccountSignIn = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        authLog(
          "signUpWithPassword.existingUserSignIn",
          {
            hasUser: Boolean(existingAccountSignIn.data.user),
            hasSession: Boolean(existingAccountSignIn.data.session),
          },
          existingAccountSignIn.error
            ? { message: existingAccountSignIn.error.message }
            : null,
        );

        if (!existingAccountSignIn.error && existingAccountSignIn.data.session) {
          return jsonWithCookies(cookieCarrier, {
            ok: true,
            messageKey: "auth.signup.successSignedIn",
          });
        }

        if (
          existingAccountSignIn.error &&
          isEmailNotConfirmedError(existingAccountSignIn.error.message)
        ) {
          return jsonWithCookies(cookieCarrier, {
            ok: false,
            messageKey: "auth.signup.checkEmail",
          });
        }

        if (
          existingAccountSignIn.error &&
          isInvalidCredentialsError(existingAccountSignIn.error.message)
        ) {
          return jsonWithCookies(cookieCarrier, {
            ok: false,
            messageKey: "auth.error.invalidCredentials",
          });
        }

        return jsonWithCookies(cookieCarrier, {
          ok: false,
          messageKey: "auth.signup.checkEmail",
        });
      }

      return jsonWithCookies(cookieCarrier, GENERIC_AUTH_ERROR);
    }
    if (result.data.session) {
      return jsonWithCookies(cookieCarrier, {
        ok: true,
        messageKey: "auth.signup.successSignedIn",
      });
    }

    const signInFallback = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    authLog(
      "signUpWithPassword.fallbackSignIn",
      {
        hasUser: Boolean(signInFallback.data.user),
        hasSession: Boolean(signInFallback.data.session),
      },
      signInFallback.error ? { message: signInFallback.error.message } : null,
    );

    if (!signInFallback.error && signInFallback.data.session) {
      return jsonWithCookies(cookieCarrier, {
        ok: true,
        messageKey: "auth.signup.successSignedIn",
      });
    }

    return jsonWithCookies(cookieCarrier, {
      ok: true,
      messageKey: "auth.signup.checkEmail",
    });
  } catch (error) {
    authLog("signUpWithPassword", null, {
      message: getSafeErrorMessage(error, "Unexpected sign up failure"),
    });
    return jsonWithCookies(cookieCarrier, GENERIC_AUTH_ERROR);
  }
}
