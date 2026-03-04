import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ListingCard } from "@/components/listing-card";
import { SavedSearchesList } from "@/components/saved-searches-list";
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
import { listingCardSelect } from "@/lib/listing-card-select";
import { normalizePhoneInput, parseStoredPhone, PHONE_COUNTRIES } from "@/lib/phone";
import { getServerLocale } from "@/lib/i18n";

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

function toSavedSearchHref(queryJson: string) {
  try {
    const parsed = JSON.parse(queryJson) as Record<string, unknown>;
    const params = new URLSearchParams();
    Object.entries(parsed).forEach(([key, value]) => {
      const safeKey = key.trim();
      const safeValue = String(value ?? "").trim();
      if (!safeKey || !safeValue) return;
      params.set(safeKey, safeValue);
    });
    const query = params.toString();
    return query ? `/browse?${query}` : "/browse";
  } catch {
    return "/browse";
  }
}

async function updateProfile(formData: FormData) {
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
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const text = isMk
    ? {
        dbUnavailable: "Базата е привремено недостапна. Обиди се повторно наскоро.",
        myProfile: "Мој профил",
        manageAllInfo:
          "Управувај со јавниот идентитет и приватните податоци на едно место.",
        back: "Назад",
        backToDashboard: "Назад кон табла",
        profileSaved: "Профилот е зачуван.",
        billingPassed: "Dummy Stripe плаќањето е успешно.",
        profileSettings: "Подесувања на профил",
        profileSettingsDesc:
          "Чувај ги сите информации за продавач и јавниот телефон на едно место.",
        publicHandle: "Профил @име",
        setUsernameHint: "Ова @име е врзано со твојот профил.",
        memberSince: "Член од",
        listings: "Огласи",
        active: "Активни",
        fullName: "Целосно име",
        fullNamePlaceholder: "Внеси целосно име",
        email: "Е-пошта",
        phoneCountry: "Држава за телефон",
        publicPhone: "Јавен телефон за сите огласи",
        phonePlaceholder: "Внеси телефонски број",
        companyOptional: "Компанија (опционално)",
        companyPlaceholder: "Име на компанија",
        websiteOptional: "Веб сајт (опционално)",
        addressOptional: "Адреса (опционално)",
        addressPlaceholder: "Улица и област",
        bioOptional: "Био (опционално)",
        bioPlaceholder: "Краток опис за твојата продавница или производи",
        phoneSavedHint:
          "Зачуваниот јавен телефон се користи по дифолт за нови огласи.",
        saveProfile: "Зачувај профил",
        postingAndSubscription: "Објавување и претплата",
        postingAndSubscriptionDesc:
          "Започни од тука, потоа заврши плаќање при објава на оглас.",
        payPerListing: "Плаќање по оглас",
        listing30: "Оглас 30 дена",
        activeWithPlan: "Активни со овој план",
        postWith4: "Објави со $4 план",
        subscription: "Претплата",
        monthlyUnlimited: "Месечно неограничено",
        activeWithSubscription: "Активни со претплата",
        nextExpiry: "Следно истекување",
        subscriptionState: "Претплата активна",
        subscriptionStateHint:
          "Огласите со претплата остануваат активни додека е вклучена претплатата.",
        noActiveCycle: "Сѐ уште нема активен циклус.",
        startSubscriptionFlow: "Почни тек на претплата",
        dummyStripeOptional: "Dummy Stripe тест картичка (опционално)",
        cardNumber: "Број на картичка",
        expiry: "Важи до",
        cvc: "CVC",
        runBillingTest: "Пушти billing тест",
        successCards: "Успешни картички",
        failCards: "Неуспешни картички",
        favorites: "Омилени",
        favoritesDesc: "Огласи кои ги зачува за подоцна.",
        noFavorites: "Сè уште немаш омилени огласи.",
        savedSearches: "Зачувани пребарувања",
        savedSearchesDesc: "Брзо отвори ги филтрите што ги користиш најчесто.",
        noSavedSearches: "Сè уште немаш зачувани пребарувања.",
      }
    : {
        dbUnavailable: "Database is temporarily unreachable. Please retry in a moment.",
        myProfile: "My profile",
        manageAllInfo:
          "Manage your public seller identity and private info from one place.",
        back: "Back",
        backToDashboard: "Back to dashboard",
        profileSaved: "Profile saved.",
        billingPassed: "Dummy Stripe payment passed.",
        profileSettings: "Profile settings",
        profileSettingsDesc:
          "Keep all your seller info and public phone in one place.",
        publicHandle: "Profile @handle",
        setUsernameHint: "This @handle is tied to your account.",
        memberSince: "Member since",
        listings: "Listings",
        active: "Active",
        fullName: "Full name",
        fullNamePlaceholder: "Enter your full name",
        email: "Email",
        phoneCountry: "Phone country",
        publicPhone: "Public phone for all posts",
        phonePlaceholder: "Enter phone number",
        companyOptional: "Company (optional)",
        companyPlaceholder: "Company name",
        websiteOptional: "Website (optional)",
        addressOptional: "Address (optional)",
        addressPlaceholder: "Street and area",
        bioOptional: "Bio (optional)",
        bioPlaceholder: "Short description about your store or products",
        phoneSavedHint:
          "Saved public phone is used by default on new listings.",
        saveProfile: "Save profile",
        postingAndSubscription: "Posting and subscription",
        postingAndSubscriptionDesc:
          "Start from here, then complete payment while publishing your listing.",
        payPerListing: "Pay per listing",
        listing30: "30-day listing",
        activeWithPlan: "Active with this plan",
        postWith4: "Post with $4 plan",
        subscription: "Subscription",
        monthlyUnlimited: "Monthly unlimited",
        activeWithSubscription: "Active with subscription",
        nextExpiry: "Next expiration",
        subscriptionState: "Subscription active",
        subscriptionStateHint:
          "Subscription listings stay active while your subscription remains enabled.",
        noActiveCycle: "No active cycle yet.",
        startSubscriptionFlow: "Start subscription flow",
        dummyStripeOptional: "Dummy Stripe test card (optional)",
        cardNumber: "Card number",
        expiry: "Expiry",
        cvc: "CVC",
        runBillingTest: "Run billing test",
        successCards: "Success cards",
        failCards: "Fail cards",
        favorites: "Favorites",
        favoritesDesc: "Listings you saved for later.",
        noFavorites: "You do not have favorite listings yet.",
        savedSearches: "Saved searches",
        savedSearchesDesc: "Quickly open your most-used browse filters.",
        noSavedSearches: "No saved searches yet.",
      };
  const user = await requireUser();
  const sp = await searchParams;
  const error = sp.error;
  const saved = sp.saved === "1";
  const billingSuccess = sp.billing === "success";
  const dbUnavailableError = text.dbUnavailable;
  const dashboardHref = canSell(user.role) ? "/dashboard" : "/browse";

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
        where: { ownerId: user.authUserId },
        select: {
          id: true,
          status: true,
          activeUntil: true,
        },
      }),
      prisma.favorite.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          createdAt: true,
          listing: {
            ...listingCardSelect,
          },
        },
      }),
      prisma.savedSearch.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          queryJson: true,
          createdAt: true,
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
          <h1 className="text-4xl font-black">{text.myProfile}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {text.manageAllInfo}
          </p>
        </section>

        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-4 text-sm text-foreground">
            {error || dbUnavailableError}
          </CardContent>
        </Card>

        <Link href={dashboardHref}>
          <Button variant="outline">{text.back}</Button>
        </Link>
      </div>
    );
  }

  const [userRecord, listings, favorites, savedSearches] = profileData;
  const parsedPhone = parseStoredPhone(userRecord?.phone);
  const handleValue =
    userRecord?.username || buildFallbackHandle(userRecord?.email || user.email);
  const sellerHandle = toPublicHandle(handleValue);
  const totalListings = listings.length;
  const activeListings = listings.filter((listing) => listing.status === "ACTIVE");
  const payPerListingActive = activeListings.filter((listing) => listing.activeUntil).length;
  const subscriptionActive = activeListings.filter((listing) => !listing.activeUntil).length;
  const nextPayPerExpiryDate =
    activeListings
      .map((listing) => listing.activeUntil)
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  const storedPhoneE164 = userRecord?.phone || "";
  const favoriteListings = favorites.map((favorite) => favorite.listing);
  const savedSearchItems = savedSearches.map((searchItem) => ({
    id: searchItem.id,
    name: searchItem.name,
    href: toSavedSearchHref(searchItem.queryJson),
    createdAtLabel: searchItem.createdAt.toLocaleDateString(
      isMk ? "mk-MK" : "en-US",
    ),
  }));

  return (
    <div className="space-y-5">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div>
            <h1 className="text-4xl font-black">{text.myProfile}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {text.manageAllInfo}
            </p>
          </div>
          <Link href={dashboardHref}>
            <Button variant="outline">{text.backToDashboard}</Button>
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
            {text.profileSaved}
          </CardContent>
        </Card>
      )}
      {billingSuccess && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            {text.billingPassed}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{text.profileSettings}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {text.profileSettingsDesc}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {text.publicHandle}
                </p>
                <p className="text-lg font-bold">{sellerHandle}</p>
                <p className="text-xs text-muted-foreground">
                  {text.setUsernameHint}
                </p>
              </div>
              <div className="text-xs text-muted-foreground sm:text-right">
                <p>
                  {text.memberSince}{" "}
                  {new Date(userRecord?.createdAt || new Date()).toLocaleDateString()}
                </p>
                <p>
                  {text.listings}: {totalListings} | {text.active}: {activeListings.length}
                </p>
              </div>
            </div>
          </div>

          <form
            action={updateProfile}
            className="space-y-3 rounded-xl border border-border/70 bg-card p-4"
          >
            <input type="hidden" name="locale" value={locale} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{text.fullName}</span>
                <Input
                  name="name"
                  defaultValue={userRecord?.name || ""}
                  placeholder={text.fullNamePlaceholder}
                  maxLength={80}
                  autoComplete="name"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">{text.email}</span>
                <Input
                  name="email"
                  value={userRecord?.email || user.email}
                  readOnly
                  autoComplete="email"
                />
              </label>

              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-[220px_minmax(0,1fr)]">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">{text.phoneCountry}</span>
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
                    {text.publicPhone}
                  </span>
                  <Input
                    name="phone"
                    defaultValue={parsedPhone.localPhone}
                    placeholder={text.phonePlaceholder}
                    required
                    minLength={6}
                    maxLength={20}
                    inputMode="tel"
                    autoComplete="tel"
                    pattern="[0-9+()\\-\\s]{6,20}"
                  />
                </label>
              </div>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{text.companyOptional}</span>
                <Input
                  name="company"
                  defaultValue={userRecord?.company || ""}
                  placeholder={text.companyPlaceholder}
                  maxLength={80}
                  autoComplete="organization"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{text.websiteOptional}</span>
                <Input
                  name="website"
                  defaultValue={userRecord?.website || ""}
                  placeholder="https://example.com"
                  type="url"
                  inputMode="url"
                  maxLength={180}
                  autoComplete="url"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">{text.addressOptional}</span>
                <Input
                  name="address"
                  defaultValue={userRecord?.address || ""}
                  placeholder={text.addressPlaceholder}
                  maxLength={180}
                  autoComplete="street-address"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">{text.bioOptional}</span>
                <textarea
                  name="bio"
                  defaultValue={userRecord?.bio || ""}
                  placeholder={text.bioPlaceholder}
                  className="min-h-24 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  maxLength={500}
                />
              </label>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <p>
                {text.phoneSavedHint}
              </p>
              {storedPhoneE164 && <p className="mt-1 font-medium text-foreground">{storedPhoneE164}</p>}
            </div>
            <Button type="submit">{text.saveProfile}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{text.postingAndSubscription}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {text.postingAndSubscriptionDesc}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-sm">
            {nextPayPerExpiryDate ? (
              <p>
                <span className="font-semibold">{text.nextExpiry}:</span>{" "}
                {nextPayPerExpiryDate.toLocaleDateString(isMk ? "mk-MK" : "en-US")}
              </p>
            ) : subscriptionActive > 0 ? (
              <p>
                <span className="font-semibold">{text.subscriptionState}.</span>{" "}
                <span className="text-muted-foreground">{text.subscriptionStateHint}</span>
              </p>
            ) : (
              <p className="text-muted-foreground">{text.noActiveCycle}</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-card p-3">
              <p className="text-sm font-semibold">{text.payPerListing}</p>
              <p className="text-2xl font-black text-primary">$4</p>
              <p className="text-xs text-muted-foreground">{text.listing30}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {text.activeWithPlan}: {payPerListingActive}
              </p>
              <Link href="?create=1&plan=pay-per-listing" className="mt-2 block">
                <Button className="w-full">{text.postWith4}</Button>
              </Link>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-3">
              <p className="text-sm font-semibold">{text.subscription}</p>
              <p className="text-2xl font-black text-secondary">$30</p>
              <p className="text-xs text-muted-foreground">{text.monthlyUnlimited}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {text.activeWithSubscription}: {subscriptionActive}
              </p>
              <Link href="?create=1&plan=subscription" className="mt-2 block">
                <Button variant="outline" className="w-full">
                  {text.startSubscriptionFlow}
                </Button>
              </Link>
            </div>
          </div>

          <details className="rounded-xl border border-border/70 bg-card p-3">
            <summary className="cursor-pointer text-sm font-semibold">
              {text.dummyStripeOptional}
            </summary>
            <form action={testDummyBillingCard} className="mt-3 grid gap-3 sm:grid-cols-4">
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">{text.cardNumber}</span>
                <Input
                  name="dummyCardNumber"
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  required
                  pattern="[0-9 ]{16,23}"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{text.expiry}</span>
                <Input
                  name="dummyCardExp"
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                  required
                  pattern="(0[1-9]|1[0-2])/[0-9]{2}"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{text.cvc}</span>
                <Input
                  name="dummyCardCvc"
                  placeholder="CVC"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  required
                  pattern="[0-9]{3,4}"
                />
              </label>
              <div className="sm:col-span-4">
                <Button type="submit">{text.runBillingTest}</Button>
              </div>
            </form>

            <p className="mt-2 text-xs text-muted-foreground">
              {text.successCards}: {DUMMY_STRIPE_SUCCESS_CARDS.join(", ")}. {text.failCards}:{" "}
              {DUMMY_STRIPE_FAIL_CARDS.join(", ")}.
            </p>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{text.favorites}</CardTitle>
          <p className="text-sm text-muted-foreground">{text.favoritesDesc}</p>
        </CardHeader>
        <CardContent>
          {favoriteListings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{text.noFavorites}</p>
          ) : (
            <div className="responsive-grid gap-4">
              {favoriteListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  locale={locale}
                  currentAuthUserId={user.authUserId}
                  isFavorited
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{text.savedSearches}</CardTitle>
          <p className="text-sm text-muted-foreground">{text.savedSearchesDesc}</p>
        </CardHeader>
        <CardContent>
          {savedSearchItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{text.noSavedSearches}</p>
          ) : (
            <SavedSearchesList locale={locale} items={savedSearchItems} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
