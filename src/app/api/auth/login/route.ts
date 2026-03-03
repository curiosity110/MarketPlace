import { NextResponse } from "next/server";
import { getSafeErrorMessage } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  authLog,
  GENERIC_AUTH_ERROR,
  isEmailNotConfirmedError,
  isInvalidCredentialsError,
  isValidEmail,
  jsonWithCookies,
  normalizeEmail,
  parseJsonBody,
} from "@/lib/auth/api-routes";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<LoginBody>(request);
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return NextResponse.json({ ok: false, messageKey: "auth.error.emailRequired" });
  }
  if (!password.trim()) {
    return NextResponse.json({ ok: false, messageKey: "auth.error.passwordRequired" });
  }

  const cookieCarrier = new NextResponse();
  try {
    const supabase = await createSupabaseServerClient(cookieCarrier);
    const result = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    authLog(
      "signInWithPassword",
      {
        hasUser: Boolean(result.data.user),
        hasSession: Boolean(result.data.session),
      },
      result.error ? { message: result.error.message } : null,
    );

    if (result.error) {
      if (isEmailNotConfirmedError(result.error.message)) {
        return jsonWithCookies(cookieCarrier, {
          ok: false,
          messageKey: "auth.signup.checkEmail",
        });
      }
      if (isInvalidCredentialsError(result.error.message)) {
        return jsonWithCookies(cookieCarrier, {
          ok: false,
          messageKey: "auth.error.invalidCredentials",
        });
      }
      return jsonWithCookies(cookieCarrier, GENERIC_AUTH_ERROR);
    }

    return jsonWithCookies(cookieCarrier, {
      ok: true,
      messageKey: "auth.login.success",
    });
  } catch (error) {
    authLog("signInWithPassword", null, {
      message: getSafeErrorMessage(error, "Unexpected sign in failure"),
    });
    return jsonWithCookies(cookieCarrier, GENERIC_AUTH_ERROR);
  }
}
