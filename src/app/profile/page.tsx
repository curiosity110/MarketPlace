import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { canSell, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { normalizePhoneInput, parseStoredPhone, PHONE_COUNTRIES } from "@/lib/phone";

function normalizeHandlePart(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return normalized || "seller";
}

async function updateProfile(formData: FormData) {
  "use server";

  const user = await requireUser();
  if (shouldSkipPrismaCalls()) {
    redirect("/profile?error=Database%20is%20temporarily%20unreachable");
  }

  const name = String(formData.get("name") || "").trim();
  const phoneCountry = String(formData.get("phoneCountry") || "MK");
  const phoneRaw = String(formData.get("phone") || "").trim();
  if (!phoneRaw) {
    redirect("/profile?error=Public%20phone%20is%20required.");
  }

  const normalizedPhone = normalizePhoneInput(phoneRaw, phoneCountry);
  if (!normalizedPhone.ok) {
    redirect(`/profile?error=${encodeURIComponent(normalizedPhone.error)}`);
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || null,
        phone: normalizedPhone.e164,
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

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const error = sp.error;
  const saved = sp.saved === "1";
  const dbUnavailableError =
    "Database is temporarily unreachable. Please retry in a moment.";
  const dashboardHref = canSell(user.role) ? "/sell/analytics" : "/browse";

  async function fetchProfileData() {
    return Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, name: true, email: true, phone: true, createdAt: true },
      }),
      prisma.listing.findMany({
        where: { sellerId: user.id },
        select: {
          id: true,
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
  const emailPrefix = (userRecord?.email || user.email).split("@")[0] || "seller";
  const handleSeed = userRecord?.name?.trim() || emailPrefix;
  const sellerHandle = `@${normalizeHandlePart(handleSeed)}.${user.id.slice(-4)}`;

  const cityCounts = listings.reduce<Map<string, number>>((acc, listing) => {
    const key = listing.city.name;
    acc.set(key, (acc.get(key) || 0) + 1);
    return acc;
  }, new Map());
  const primaryCity = [...cityCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const totalPhotos = listings.reduce((sum, listing) => sum + listing.images.length, 0);

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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Your seller profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
            <p className="text-sm font-semibold">Full handle</p>
            <p className="text-lg font-bold">{sellerHandle}</p>
            <p className="text-xs text-muted-foreground">
              Member since {new Date(userRecord?.createdAt || new Date()).toLocaleDateString()}
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

          <form action={updateProfile} className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
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
                <span className="text-xs font-medium text-muted-foreground">Email</span>
                <Input value={userRecord?.email || user.email} readOnly />
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
        </CardContent>
      </Card>
    </div>
  );
}
