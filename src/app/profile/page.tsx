import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { canSell, requireUser } from "@/lib/auth";
import {
  DUMMY_STRIPE_FAIL_CARDS,
  DUMMY_STRIPE_SUCCESS_CARDS,
  validateDummyStripePayment,
} from "@/lib/billing/dummy-stripe";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { normalizePhoneInput, parseStoredPhone, PHONE_COUNTRIES } from "@/lib/phone";

function sanitizeUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 40);
}

function buildFallbackHandle(email: string) {
  const normalized = sanitizeUsername(email.split("@")[0] || "seller");
  return normalized || "seller";
}

function toPublicHandle(username: string) {
  return `@${username}`;
}

function normalizeOptionalText(value: string, maxLength: number) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

async function updateProfile(formData: FormData) {
  "use server";

  const user = await requireUser();
  if (shouldSkipPrismaCalls()) {
    redirect("/profile?error=Database%20is%20temporarily%20unreachable");
  }

  const name = String(formData.get("name") || "").trim();
  const usernameRaw = String(formData.get("username") || "").trim();
  const company = normalizeOptionalText(String(formData.get("company") || ""), 80);
  const address = normalizeOptionalText(String(formData.get("address") || ""), 180);
  const bio = normalizeOptionalText(String(formData.get("bio") || ""), 500);
  const websiteRaw = String(formData.get("website") || "").trim();
  const website = websiteRaw
    ? websiteRaw.startsWith("http://") || websiteRaw.startsWith("https://")
      ? websiteRaw.slice(0, 180)
      : `https://${websiteRaw.slice(0, 170)}`
    : null;
  const sanitizedUsername = usernameRaw ? sanitizeUsername(usernameRaw) : "";
  const username = sanitizedUsername || null;
  if (usernameRaw && sanitizedUsername.length < 3) {
    redirect("/profile?error=Username%20must%20be%20at%20least%203%20characters.");
  }

  const phoneCountry = String(formData.get("phoneCountry") || "MK");
  const phoneRaw = String(formData.get("phone") || "").trim();
  if (!phoneRaw) {
    redirect("/profile?error=Public%20phone%20is%20required.");
  }

  const normalizedPhone = normalizePhoneInput(phoneRaw, phoneCountry);
  if (!normalizedPhone.ok) {
    redirect(`/profile?error=${encodeURIComponent(normalizedPhone.error)}`);
  }

  if (username) {
    try {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username,
          id: { not: user.id },
        },
        select: { id: true },
      });
      markPrismaHealthy();
      if (existingUsername) {
        redirect("/profile?error=This%20username%20is%20already%20in%20use.");
      }
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        redirect("/profile?error=Database%20is%20temporarily%20unreachable");
      }
      throw error;
    }
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || null,
        phone: normalizedPhone.e164,
        username,
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
      redirect("/profile?error=Database%20is%20temporarily%20unreachable");
    }
    throw error;
  }

  revalidatePath("/profile");
  revalidatePath("/sell/analytics");
  revalidatePath("/sell");
  redirect("/profile?saved=1");
}

async function testDummyBillingCard(formData: FormData) {
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

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const error = sp.error;
  const saved = sp.saved === "1";
  const billingSuccess = sp.billing === "success";
  const dbUnavailableError =
    "Database is temporarily unreachable. Please retry in a moment.";
  const dashboardHref = canSell(user.role) ? "/sell/analytics" : "/browse";

  async function fetchProfileData() {
    return Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          username: true,
          company: true,
          website: true,
          bio: true,
          address: true,
        },
      }),
      prisma.listing.findMany({
        where: { sellerId: user.id },
        select: {
          id: true,
          status: true,
          activeUntil: true,
          city: { select: { name: true } },
          images: { select: { id: true } },
        },
      }),
    ]);
  }

  let profileData: Awaited<ReturnType<typeof fetchProfileData>> | null = null;
  try {
    if (!shouldSkipPrismaCalls()) {
      profileData = await fetchProfileData();
      markPrismaHealthy();
    }
  } catch (dbError) {
    if (isPrismaConnectionError(dbError)) {
      markPrismaUnavailable();
      profileData = null;
    } else {
      throw dbError;
    }
  }

  if (!profileData) {
    return (
      <div className="space-y-5">
        <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
          <h1 className="text-4xl font-black">My profile</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Manage your public seller identity and private info from one place.
          </p>
        </section>

        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-4 text-sm text-foreground">
            {error || dbUnavailableError}
          </CardContent>
        </Card>

        <Link href={dashboardHref}>
          <Button variant="outline">Back</Button>
        </Link>
      </div>
    );
  }

  const [userRecord, listings] = profileData;
  const parsedPhone = parseStoredPhone(userRecord?.phone);
  const handleValue =
    userRecord?.username || buildFallbackHandle(userRecord?.email || user.email);
  const sellerHandle = toPublicHandle(handleValue);
  const usingFallbackHandle = !userRecord?.username;

  const cityCounts = listings.reduce<Map<string, number>>((acc, listing) => {
    const key = listing.city.name;
    acc.set(key, (acc.get(key) || 0) + 1);
    return acc;
  }, new Map());
  const primaryCity = [...cityCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const totalPhotos = listings.reduce((sum, listing) => sum + listing.images.length, 0);
  const activeListings = listings.filter((listing) => listing.status === "ACTIVE");
  const payPerListingActive = activeListings.filter((listing) => listing.activeUntil).length;
  const subscriptionActive = activeListings.filter((listing) => !listing.activeUntil).length;

  return (
    <div className="space-y-5">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">My profile</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              One edit saves all private profile info.
            </p>
          </div>
          <Link href={dashboardHref}>
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </div>
      </section>

      {error && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-4 text-sm text-foreground">{error}</CardContent>
        </Card>
      )}
      {saved && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            Profile saved.
          </CardContent>
        </Card>
      )}
      {billingSuccess && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            Dummy Stripe payment passed.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Your seller profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-sm font-semibold">Public handle</p>
              <p className="text-lg font-bold">{sellerHandle}</p>
              {usingFallbackHandle && (
                <p className="text-xs text-muted-foreground">
                  Set a public username to choose your exact handle.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Member since{" "}
                {new Date(userRecord?.createdAt || new Date()).toLocaleDateString()}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-2 py-1">
                  <MapPin size={12} className="text-primary" />
                  {primaryCity || "No city yet"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-2 py-1">
                  {totalPhotos} photos
                </span>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-sm font-semibold">Billing options</p>
              <div className="grid gap-2 text-xs">
                <div className="rounded-lg border border-border/70 bg-card px-2 py-2">
                  <p className="font-semibold">Pay per listing</p>
                  <p className="text-muted-foreground">$4 / 30 days</p>
                  <p className="mt-1">Active now: {payPerListingActive}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-card px-2 py-2">
                  <p className="font-semibold">Subscription</p>
                  <p className="text-muted-foreground">$30 / month unlimited</p>
                  <p className="mt-1">Active now: {subscriptionActive}</p>
                </div>
              </div>
            </div>
          </div>

          <form
            action={updateProfile}
            className="space-y-3 rounded-xl border border-border/70 bg-card p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Full name</span>
                <Input
                  name="name"
                  defaultValue={userRecord?.name || ""}
                  placeholder="Enter your full name"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Public username</span>
                <Input
                  name="username"
                  defaultValue={userRecord?.username || ""}
                  placeholder="your.handle"
                />
                <span className="block text-[11px] text-muted-foreground">
                  3-40 chars, lowercase letters, numbers, dot, dash, underscore.
                </span>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Email</span>
                <Input value={userRecord?.email || user.email} readOnly />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Company (optional)</span>
                <Input
                  name="company"
                  defaultValue={userRecord?.company || ""}
                  placeholder="Company name"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">Website (optional)</span>
                <Input
                  name="website"
                  defaultValue={userRecord?.website || ""}
                  placeholder="https://example.com"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">Address (optional)</span>
                <Input
                  name="address"
                  defaultValue={userRecord?.address || ""}
                  placeholder="Street and area"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">Bio (optional)</span>
                <textarea
                  name="bio"
                  defaultValue={userRecord?.bio || ""}
                  placeholder="Short description about your store or products"
                  className="min-h-24 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Phone country</span>
                <select
                  name="phoneCountry"
                  defaultValue={parsedPhone.countryCode}
                  className="h-10 rounded-xl border border-border bg-input px-3 text-sm"
                >
                  {PHONE_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.label} (+{country.dialCode})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Public phone for all posts
                </span>
                <Input
                  name="phone"
                  defaultValue={parsedPhone.localPhone}
                  placeholder="Enter phone number"
                  required
                />
              </label>
            </div>

            <p className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Saved phone auto-fills new listings. You can optionally set a different number per
              post.
            </p>
            <Button type="submit">Save all profile info</Button>
          </form>

          <div className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">Billing test (dummy Stripe)</p>
              <span className="rounded-full border border-border/70 bg-muted/20 px-2 py-0.5 text-xs font-semibold">
                Safe sandbox
              </span>
            </div>

            <form action={testDummyBillingCard} className="grid gap-3 sm:grid-cols-4">
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">Card number</span>
                <Input
                  name="dummyCardNumber"
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Expiry</span>
                <Input
                  name="dummyCardExp"
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">CVC</span>
                <Input
                  name="dummyCardCvc"
                  placeholder="CVC"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                />
              </label>
              <div className="sm:col-span-4">
                <Button type="submit">Run billing test</Button>
              </div>
            </form>

            <p className="text-xs text-muted-foreground">
              Success cards: {DUMMY_STRIPE_SUCCESS_CARDS.join(", ")}. Fail cards:{" "}
              {DUMMY_STRIPE_FAIL_CARDS.join(", ")}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
