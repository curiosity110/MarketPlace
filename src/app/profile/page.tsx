import { Card, CardContent } from "@/components/ui/card";
import { CompactBackButton } from "@/components/compact-back-button";
import {
  DUMMY_STRIPE_FAIL_CARDS,
  DUMMY_STRIPE_SUCCESS_CARDS,
  ProfileFlashBanners,
  ProfileHeader,
  ProfileListingsSection,
  ProfileSettingsSection,
  ProfileSubscriptionSection,
  buildFallbackHandle,
  getInitials,
  testDummyBillingCard,
  toPublicHandle,
  updateProfile,
} from "@/components/profile";
import { canSell, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { listingCardSelect } from "@/lib/listing-card-select";
import { parseStoredPhone } from "@/lib/phone";
import { getServerLocale } from "@/lib/i18n";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // Profile container: server data/actions orchestration; visual sections are split into profile components.
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
  const profileLocationLabel = isMk ? "Локација" : "Location";
  const noActiveListingsLabel = isMk
    ? "Моментално немаш активни огласи."
    : "You do not have active listings right now.";
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
          activeUntil: true,
          ...listingCardSelect.select,
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
      <div className="space-y-4">
        <CompactBackButton label={text.back} fallbackHref={dashboardHref} />
        <section className="hero-surface rounded-3xl border border-border/70 px-4 py-4 sm:px-6 sm:py-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              {text.myProfile}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              {text.manageAllInfo}
            </p>
          </div>
        </section>

        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-4 text-sm text-foreground">
            {error || dbUnavailableError}
          </CardContent>
        </Card>
      </div>
    );
  }

  const [userRecord, listings] = profileData;
  const parsedPhone = parseStoredPhone(userRecord?.phone);
  const handleValue =
    userRecord?.username || buildFallbackHandle(userRecord?.email || user.email);
  const sellerHandle = toPublicHandle(handleValue);
  const activeListings = listings.filter(
    (listing) => listing.status === "ACTIVE" && !listing.sale,
  );
  const payPerListingActive = activeListings.filter((listing) => listing.activeUntil).length;
  const subscriptionActive = activeListings.filter((listing) => !listing.activeUntil).length;
  const nextPayPerExpiryDate =
    activeListings
      .map((listing) => listing.activeUntil)
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  const storedPhoneE164 = userRecord?.phone || "";
  const displayName = userRecord?.name?.trim() || userRecord?.email || user.email;
  const profileLocation = userRecord?.address?.trim() || "";
  const joinedDateLabel = new Date(
    userRecord?.createdAt || new Date(),
  ).toLocaleDateString(isMk ? "mk-MK" : "en-US");
  const avatarInitials = getInitials(displayName);

  return (
    <div className="max-w-full min-w-0 space-y-5 overflow-x-hidden">
      <ProfileHeader
        backLabel={text.backToDashboard}
        backHref={dashboardHref}
        displayName={displayName}
        sellerHandle={sellerHandle}
        memberSinceLabel={text.memberSince}
        joinedDateLabel={joinedDateLabel}
        locationLabel={profileLocationLabel}
        profileLocation={profileLocation}
        activeLabel={text.active}
        activeCount={activeListings.length}
        avatarInitials={avatarInitials}
      />

      <ProfileFlashBanners
        error={error}
        saved={saved}
        billingSuccess={billingSuccess}
        profileSavedLabel={text.profileSaved}
        billingPassedLabel={text.billingPassed}
      />

      <ProfileListingsSection
        locale={locale}
        currentAuthUserId={user.authUserId}
        activeLabel={text.active}
        listingsLabel={text.listings}
        emptyLabel={noActiveListingsLabel}
        activeListings={activeListings}
      />

      <ProfileSettingsSection
        locale={locale}
        userRecord={userRecord}
        accountEmail={user.email}
        parsedPhone={parsedPhone}
        storedPhoneE164={storedPhoneE164}
        updateProfileAction={updateProfile}
        text={text}
      />

      <ProfileSubscriptionSection
        isMk={isMk}
        nextPayPerExpiryDate={nextPayPerExpiryDate}
        subscriptionActive={subscriptionActive}
        payPerListingActive={payPerListingActive}
        testDummyBillingCardAction={testDummyBillingCard}
        successCards={DUMMY_STRIPE_SUCCESS_CARDS}
        failCards={DUMMY_STRIPE_FAIL_CARDS}
        text={text}
      />
    </div>
  );
}


