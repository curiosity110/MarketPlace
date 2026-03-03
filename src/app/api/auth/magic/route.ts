import { NextResponse } from "next/server";
import { getSafeErrorMessage } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  authLog,
  buildAuthCallbackUrl,
  GENERIC_AUTH_ERROR,
  isValidEmail,
  jsonWithCookies,
  normalizeEmail,
  parseJsonBody,
  resolveSiteUrlFromRequest,
} from "@/lib/auth/api-routes";

type MagicBody = {
  email?: string;
  nextPath?: string;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<MagicBody>(request);
  const email = typeof body.email === "string" ? body.email : "";
  const nextPath = typeof body.nextPath === "string" ? body.nextPath : undefined;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return NextResponse.json({ ok: false, messageKey: "auth.error.emailRequired" });
  }

  const cookieCarrier = new NextResponse();
  try {
    const supabase = await createSupabaseServerClient(cookieCarrier);
    const site = resolveSiteUrlFromRequest(request);
    const result = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(site, nextPath),
      },
    });

    authLog(
      "signInWithMagicLink",
      {
        hasUser: Boolean(result.data.user),
        hasSession: Boolean(result.data.session),
      },
      result.error ? { message: result.error.message } : null,
    );

    if (result.error) {
      return jsonWithCookies(cookieCarrier, GENERIC_AUTH_ERROR);
    }

    return jsonWithCookies(cookieCarrier, {
      ok: true,
      messageKey: "auth.magic.sent",
    });
  } catch (error) {
    authLog("signInWithMagicLink", null, {
      message: getSafeErrorMessage(error, "Unexpected magic link failure"),
    });
    return jsonWithCookies(cookieCarrier, GENERIC_AUTH_ERROR);
  }
}
