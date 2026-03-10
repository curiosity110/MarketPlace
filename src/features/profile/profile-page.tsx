import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, PageShell } from "@/components/ui/layout";
import {
  DUMMY_STRIPE_FAIL_CARDS,
  DUMMY_STRIPE_SUCCESS_CARDS,
  ProfileFlashBanners,
  ProfileSettingsSection,
  ProfileSubscriptionSection,
  buildFallbackHandle,
  getInitials,
  testDummyBillingCard,
  toPublicHandle,
  updateProfile,
} from "@/components/profile";
import { ProfileHeader } from "@/features/profile/profile-header";
import { ProfileListings } from "@/features/profile/profile-listings";
import { getProfilePageText } from "@/features/profile/utils";
import { canSell, requireUser } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n";
import { listingCardSelect } from "@/lib/listing-card-select";
import { parseStoredPhone } from "@/lib/phone";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";

type ProfilePageSearchParams = Promise<Record<string, string | undefined>>;

export async function ProfileFeaturePage({
  searchParams,
}: {
  searchParams: ProfilePageSearchParams;
}) {
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const text = getProfilePageText(locale);
  const user = await requireUser();
  const sp = await searchParams;
  const error = sp.error;
  const saved = sp.saved === "1";
  const billingSuccess = sp.billing === "success";
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
      <PageShell>
        <PageHeader title={text.myProfile} compact />
        <Card className="bg-warning/10 ring-1 ring-warning/15">
          <CardContent className="py-4 text-sm text-foreground">
            {error || text.dbUnavailable}
          </CardContent>
        </Card>
      </PageShell>
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
  const profileEmail = userRecord?.email || user.email;

  return (
    <PageShell className="space-y-3.5 sm:space-y-4">
      <ProfileHeader
        backLabel={text.backToDashboard}
        backHref={dashboardHref}
        displayName={displayName}
        sellerHandle={sellerHandle}
        memberSinceLabel={text.memberSince}
        joinedDateLabel={joinedDateLabel}
        emailLabel={text.email}
        emailValue={profileEmail}
        locationLabel={text.profileLocationLabel}
        locationValue={profileLocation}
        sellerStatusLabel={text.sellerStatus}
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

      <ProfileListings
        locale={locale}
        currentAuthUserId={user.authUserId}
        activeLabel={text.active}
        listingsLabel={text.listings}
        emptyLabel={text.noActiveListings}
        activeListings={activeListings}
      />

      <div className="space-y-3.5">
        <ProfileSettingsSection
          locale={locale}
          userRecord={userRecord}
          accountEmail={user.email}
          parsedPhone={parsedPhone}
          storedPhoneE164={storedPhoneE164}
          updateProfileAction={updateProfile}
          text={{
            ...text,
            profileSettings: text.settings,
            profileSettingsDesc: "",
            fullName: isMk ? "Целосно име" : "Full name",
            fullNamePlaceholder: isMk ? "Внеси целосно име" : "Enter your full name",
            phoneCountry: isMk ? "Држава за телефон" : "Phone country",
            publicPhone: isMk ? "Јавен телефон за сите огласи" : "Public phone for all posts",
            phonePlaceholder: isMk ? "Внеси телефонски број" : "Enter phone number",
            companyOptional: isMk ? "Компанија (опционално)" : "Company (optional)",
            companyPlaceholder: isMk ? "Име на компанија" : "Company name",
            websiteOptional: isMk ? "Веб сајт (опционално)" : "Website (optional)",
            addressOptional: isMk ? "Адреса (опционално)" : "Address (optional)",
            addressPlaceholder: isMk ? "Улица и област" : "Street and area",
            bioOptional: isMk ? "Био (опционално)" : "Bio (optional)",
            bioPlaceholder: "",
            phoneSavedHint: "",
            saveProfile: isMk ? "Зачувај профил" : "Save profile",
          }}
        />

        <ProfileSubscriptionSection
          isMk={isMk}
          nextPayPerExpiryDate={nextPayPerExpiryDate}
          subscriptionActive={subscriptionActive}
          payPerListingActive={payPerListingActive}
          testDummyBillingCardAction={testDummyBillingCard}
          successCards={DUMMY_STRIPE_SUCCESS_CARDS}
          failCards={DUMMY_STRIPE_FAIL_CARDS}
          text={{
            postingAndSubscription: text.subscription,
            postingAndSubscriptionDesc: "",
            nextExpiry: isMk ? "Следно истекување" : "Next expiration",
            subscriptionState: isMk ? "Претплата активна" : "Subscription active",
            subscriptionStateHint: "",
            noActiveCycle: isMk ? "Нема активен циклус." : "No active cycle.",
            payPerListing: isMk ? "Плаќање по оглас" : "Pay per listing",
            listing30: isMk ? "Оглас 30 дена" : "30-day listing",
            activeWithPlan: isMk ? "Активни со овој план" : "Active with this plan",
            postWith4: isMk ? "Објави со $4 план" : "Post with $4 plan",
            subscription: isMk ? "Претплата" : "Subscription",
            monthlyUnlimited: isMk ? "Месечно неограничено" : "Monthly unlimited",
            activeWithSubscription: isMk ? "Активни со претплата" : "Active with subscription",
            startSubscriptionFlow: isMk ? "Почни тек на претплата" : "Start subscription flow",
            dummyStripeOptional: isMk ? "Dummy Stripe тест картичка (опционално)" : "Dummy Stripe test card (optional)",
            cardNumber: isMk ? "Број на картичка" : "Card number",
            expiry: isMk ? "Важи до" : "Expiry",
            cvc: "CVC",
            runBillingTest: isMk ? "Пушти billing тест" : "Run billing test",
            successCards: isMk ? "Успешни картички" : "Success cards",
            failCards: isMk ? "Неуспешни картички" : "Fail cards",
          }}
        />
      </div>
    </PageShell>
  );
}
