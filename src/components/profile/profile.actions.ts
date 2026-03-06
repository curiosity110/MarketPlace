import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  DUMMY_STRIPE_FAIL_CARDS,
  DUMMY_STRIPE_SUCCESS_CARDS,
  validateDummyStripePayment,
} from "@/lib/billing/dummy-stripe";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { markPrismaHealthy, markPrismaUnavailable, shouldSkipPrismaCalls } from "@/lib/prisma-circuit-breaker";
import { normalizePhoneInput } from "@/lib/phone";
import { normalizeOptionalText } from "@/components/profile/profile-page.utils";

export async function updateProfile(formData: FormData) {
  "use server";

  const locale = String(formData.get("locale") || "en") === "mk" ? "mk" : "en";
  const errors =
    locale === "mk"
      ? {
          dbUnavailable: "Базата е привремено недостапна.",
          phoneRequired: "Јавен телефон е задолжителен.",
        }
      : {
          dbUnavailable: "Database is temporarily unreachable",
          phoneRequired: "Public phone is required.",
        };

  const user = await requireUser();
  if (shouldSkipPrismaCalls()) {
    redirect(`/profile?error=${encodeURIComponent(errors.dbUnavailable)}`);
  }

  const name = String(formData.get("name") || "").trim();
  const company = normalizeOptionalText(String(formData.get("company") || ""), 80);
  const address = normalizeOptionalText(String(formData.get("address") || ""), 180);
  const bio = normalizeOptionalText(String(formData.get("bio") || ""), 500);
  const websiteRaw = String(formData.get("website") || "").trim();
  const website = websiteRaw
    ? websiteRaw.startsWith("http://") || websiteRaw.startsWith("https://")
      ? websiteRaw.slice(0, 180)
      : `https://${websiteRaw.slice(0, 170)}`
    : null;

  const phoneCountry = String(formData.get("phoneCountry") || "MK");
  const phoneRaw = String(formData.get("phone") || "").trim();
  if (!phoneRaw) {
    redirect(`/profile?error=${encodeURIComponent(errors.phoneRequired)}`);
  }

  const normalizedPhone = normalizePhoneInput(phoneRaw, phoneCountry, locale);
  if (!normalizedPhone.ok) {
    redirect(`/profile?error=${encodeURIComponent(normalizedPhone.error)}`);
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || null,
        phone: normalizedPhone.e164,
        company,
        website,
        bio,
        address,
      },
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect(`/profile?error=${encodeURIComponent(errors.dbUnavailable)}`);
    }
    throw error;
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/sell");
  redirect("/profile?saved=1");
}

export async function testDummyBillingCard(formData: FormData) {
  "use server";

  await requireUser();

  const cardNumberRaw = String(formData.get("dummyCardNumber") || "");
  const cardExpRaw = String(formData.get("dummyCardExp") || "");
  const cardCvcRaw = String(formData.get("dummyCardCvc") || "");
  const result = validateDummyStripePayment({
    cardNumberRaw,
    cardExpRaw,
    cardCvcRaw,
  });

  if (!result.ok) {
    redirect(`/profile?error=${encodeURIComponent(result.error)}&billing=fail`);
  }

  redirect("/profile?billing=success");
}

export { DUMMY_STRIPE_FAIL_CARDS, DUMMY_STRIPE_SUCCESS_CARDS };
