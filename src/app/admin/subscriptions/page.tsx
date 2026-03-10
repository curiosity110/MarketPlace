import { Currency, ListingStatus } from "@prisma/client";
import { ArrowUpRight, BarChart3, DollarSign, Users } from "lucide-react";
import { requireMoneyAnalyticsAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { convertByStaticRate, formatCurrencyFromCents } from "@/lib/currency";
import { getServerLocale } from "@/lib/i18n";

const PRICE_PAY_PER_LISTING = 4;
const PRICE_SUBSCRIPTION = 30;

function monthKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date, locale: "en" | "mk") {
  return date.toLocaleString(locale === "mk" ? "mk-MK" : "en-US", {
    month: "short",
  });
}

export default async function AdminSubscriptions() {
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const text = isMk
    ? {
        title: "Претплати и приходи",
        subtitle:
          "Проценета аналитика за модел $4 по оглас и $30 претплата.",
        estimatedRevenue: "Проценет приход",
        liveEstimate: "Жива проценка",
        subscriptionSellers: "Продавачи со претплата",
        monthlyEach: "$30 месечно по продавач",
        payPerListings: "Огласи со плаќање по објава",
        fourPerListing: "$4 по оглас",
        activeSellers: "Активни продавачи",
        publishingInventory: "Моментално објавуваат инвентар",
        soldTracking: "Следење продадени средства",
        noSoldYet: "Сè уште нема евидентирани продадени огласи.",
        sales: "продажби",
        gross: "Бруто",
        fees: "Надоместоци",
        net: "Нето",
        approxMkdTotals: "Приближни MKD вкупни (статична конверзија)",
        soldListings: "Продадени огласи",
        platformFees: "Платформски надоместоци",
        netPayouts: "Нето исплати",
        trend: "6-месечен тренд на приходи",
        subscriptionLegend: "Претплата ($30)",
        payPerLegend: "По оглас ($4)",
        sellerRank: "Ранг на профит по продавач (профит + објави)",
        seller: "Продавач",
        plan: "План",
        listings: "Огласи",
        revenueEst: "Проценка приход",
        sold: "Продадени",
        netMkd: "Нето (MKD)",
        joined: "Приклучен",
        status: "Статус",
        noActiveSellers: "Сè уште нема активни продавачи.",
        active: "активен",
      }
    : {
        title: "Subscriptions & Revenue",
        subtitle:
          "Estimated analytics for $4 pay-per-listing and $30 subscription model.",
        estimatedRevenue: "Estimated revenue",
        liveEstimate: "Live estimate",
        subscriptionSellers: "Subscription sellers",
        monthlyEach: "$30 each monthly",
        payPerListings: "Pay-per listings",
        fourPerListing: "$4 per listing",
        activeSellers: "Active sellers",
        publishingInventory: "Currently publishing inventory",
        soldTracking: "Sold money tracking",
        noSoldYet: "No sold listings recorded yet.",
        sales: "sales",
        gross: "Gross",
        fees: "Fees",
        net: "Net",
        approxMkdTotals: "Approx MKD totals (static conversion)",
        soldListings: "Sold listings",
        platformFees: "Platform fees",
        netPayouts: "Net payouts",
        trend: "6-month revenue trend",
        subscriptionLegend: "Subscription ($30)",
        payPerLegend: "Pay per listing ($4)",
        sellerRank: "Seller profit rank (profit + posts)",
        seller: "Seller",
        plan: "Plan",
        listings: "Listings",
        revenueEst: "Revenue est.",
        sold: "Sold",
        netMkd: "Net (MKD)",
        joined: "Joined",
        status: "Status",
        noActiveSellers: "No active sellers yet.",
        active: "active",
      };
  await requireMoneyAnalyticsAccess();

  const startDate = new Date();
  startDate.setUTCMonth(startDate.getUTCMonth() - 5);
  startDate.setUTCDate(1);
  startDate.setUTCHours(0, 0, 0, 0);

  const [
    activeListings,
    recentListings,
    sellersWithListings,
    soldByCurrency,
  ] = await Promise.all([
    prisma.listing.findMany({
      where: { status: ListingStatus.ACTIVE },
      select: { activeUntil: true, sellerId: true },
    }),
    prisma.listing.findMany({
      where: {
        status: { in: [ListingStatus.ACTIVE, ListingStatus.INACTIVE] },
        createdAt: { gte: startDate },
      },
      select: { createdAt: true, activeUntil: true },
    }),
    prisma.user.findMany({
      where: {
        listings: { some: { status: ListingStatus.ACTIVE } },
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        createdAt: true,
        listings: {
          where: { status: ListingStatus.ACTIVE },
          select: { activeUntil: true },
        },
        sales: {
          select: { amountCents: true, netAmountCents: true, currency: true },
        },
      },
      take: 40,
    }),
    prisma.sale.groupBy({
      by: ["currency"],
      _count: { id: true },
      _sum: {
        amountCents: true,
        platformFeeCents: true,
        netAmountCents: true,
      },
    }),
  ]);

  const payPerActive = activeListings.filter((listing) => listing.activeUntil).length;
  const subscriptionSellerIds = new Set(
    activeListings
      .filter((listing) => !listing.activeUntil)
      .map((listing) => listing.sellerId),
  );
  const subscriptionActive = subscriptionSellerIds.size;

  const estimatedRevenue =
    payPerActive * PRICE_PAY_PER_LISTING +
    subscriptionActive * PRICE_SUBSCRIPTION;

  const totalSoldCount = soldByCurrency.reduce((sum, row) => sum + row._count.id, 0);
  const totalGrossMkd = soldByCurrency.reduce(
    (sum, row) =>
      sum +
      convertByStaticRate(row._sum.amountCents || 0, row.currency, Currency.MKD),
    0,
  );
  const totalFeesMkd = soldByCurrency.reduce(
    (sum, row) =>
      sum +
      convertByStaticRate(row._sum.platformFeeCents || 0, row.currency, Currency.MKD),
    0,
  );
  const totalNetMkd = soldByCurrency.reduce(
    (sum, row) =>
      sum +
      convertByStaticRate(row._sum.netAmountCents || 0, row.currency, Currency.MKD),
    0,
  );

  const monthBuckets = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(startDate);
    date.setUTCMonth(startDate.getUTCMonth() + index);
    return {
      key: monthKey(date),
      label: monthLabel(date, locale),
      premium: 0,
      payPerListing: 0,
    };
  });
  const monthMap = new Map(monthBuckets.map((bucket) => [bucket.key, bucket]));

  recentListings.forEach((listing) => {
    const key = monthKey(listing.createdAt);
    const bucket = monthMap.get(key);
    if (!bucket) return;
    if (listing.activeUntil) {
      bucket.payPerListing += PRICE_PAY_PER_LISTING;
    } else {
      bucket.premium += PRICE_SUBSCRIPTION;
    }
  });

  const sellerRows = sellersWithListings.map((seller) => {
    const hasSubscription = seller.listings.some((listing) => !listing.activeUntil);
    const listingCount = seller.listings.length;
    const plan = hasSubscription ? "Subscription" : "Pay per listing";
    const revenue = hasSubscription
      ? PRICE_SUBSCRIPTION
      : listingCount * PRICE_PAY_PER_LISTING;
    const soldListings = seller.sales.length;
    const sellerNetMkd = seller.sales.reduce(
      (sum, sale) =>
        sum + convertByStaticRate(sale.netAmountCents, sale.currency, Currency.MKD),
      0,
    );

    return {
      id: seller.id,
      username: seller.name || seller.username || seller.email,
      plan,
      listings: listingCount,
      revenue,
      soldListings,
      sellerNetMkd,
      joined: seller.createdAt,
      status: "active",
    };
  });
  const rankedSellerRows = [...sellerRows]
    .sort(
      (a, b) =>
        b.sellerNetMkd - a.sellerNetMkd ||
        b.listings - a.listings ||
        b.soldListings - a.soldListings,
    )
    .map((seller, index) => ({
      ...seller,
      rank: index + 1,
    }));

  return (
    <div className="space-y-6">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <h1 className="text-4xl font-black">{text.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {text.subtitle}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{text.estimatedRevenue}</p>
              <p className="mt-1 text-3xl font-black">${estimatedRevenue}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-success">
                <ArrowUpRight size={12} /> {text.liveEstimate}
              </p>
            </div>
            <DollarSign className="text-primary" size={22} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{text.subscriptionSellers}</p>
              <p className="mt-1 text-3xl font-black">{subscriptionActive}</p>
              <p className="mt-1 text-xs text-muted-foreground">{text.monthlyEach}</p>
            </div>
            <Users className="text-secondary" size={22} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{text.payPerListings}</p>
              <p className="mt-1 text-3xl font-black">{payPerActive}</p>
              <p className="mt-1 text-xs text-muted-foreground">{text.fourPerListing}</p>
            </div>
            <BarChart3 className="text-primary" size={22} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{text.activeSellers}</p>
              <p className="mt-1 text-3xl font-black">{rankedSellerRows.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {text.publishingInventory}
              </p>
            </div>
            <Users className="text-secondary" size={22} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{text.soldTracking}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {soldByCurrency.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {text.noSoldYet}
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {soldByCurrency.map((row) => (
                <div
                  key={row.currency}
                  className="rounded-xl border border-border/70 bg-card p-3 text-sm"
                >
                  <p className="font-semibold">
                    {row.currency} {text.sales} ({row._count.id})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {text.gross}: {formatCurrencyFromCents(row._sum.amountCents || 0, row.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {text.fees}: {formatCurrencyFromCents(row._sum.platformFeeCents || 0, row.currency)}
                  </p>
                  <p className="text-sm font-semibold text-success">
                    {text.net}: {formatCurrencyFromCents(row._sum.netAmountCents || 0, row.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
            <p className="font-semibold">{text.approxMkdTotals}</p>
            <p className="text-xs text-muted-foreground">
              {text.soldListings}: {totalSoldCount}
            </p>
            <p className="text-xs text-muted-foreground">
              {text.gross}: {formatCurrencyFromCents(totalGrossMkd, Currency.MKD)}
            </p>
            <p className="text-xs text-muted-foreground">
              {text.platformFees}: {formatCurrencyFromCents(totalFeesMkd, Currency.MKD)}
            </p>
            <p className="text-sm font-semibold text-success">
              {text.netPayouts}: {formatCurrencyFromCents(totalNetMkd, Currency.MKD)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{text.trend}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid h-64 grid-cols-6 items-end gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
            {monthBuckets.map((bucket) => {
              const maxValue = Math.max(
                ...monthBuckets.map((item) => item.premium + item.payPerListing),
                1,
              );
              const premiumHeight = (bucket.premium / maxValue) * 100;
              const payHeight = (bucket.payPerListing / maxValue) * 100;

              return (
                <div key={bucket.key} className="flex h-full flex-col items-center justify-end gap-2">
                  <div className="flex h-full w-full items-end justify-center gap-1">
                    <div
                      className="w-3 rounded-t bg-primary"
                      style={{ height: `${premiumHeight}%` }}
                      title={`${bucket.label} subscription: $${bucket.premium}`}
                    />
                    <div
                      className="w-3 rounded-t bg-secondary"
                      style={{ height: `${payHeight}%` }}
                      title={`${bucket.label} pay-per-listing: $${bucket.payPerListing}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{bucket.label}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-primary" />
              {text.subscriptionLegend}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-secondary" />
              {text.payPerLegend}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{text.sellerRank}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">{text.seller}</th>
                <th className="px-3 py-2">{text.plan}</th>
                <th className="px-3 py-2">{text.listings}</th>
                <th className="px-3 py-2">{text.revenueEst}</th>
                <th className="px-3 py-2">{text.sold}</th>
                <th className="px-3 py-2">{text.netMkd}</th>
                <th className="px-3 py-2">{text.joined}</th>
                <th className="px-3 py-2">{text.status}</th>
              </tr>
            </thead>
            <tbody>
              {sellerRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={9}>
                    {text.noActiveSellers}
                  </td>
                </tr>
              ) : (
                rankedSellerRows.map((seller) => (
                  <tr key={seller.id} className="border-b border-border/60">
                    <td className="px-3 py-3 font-semibold">{seller.rank}</td>
                    <td className="px-3 py-3 font-medium">{seller.username}</td>
                    <td className="px-3 py-3">
                      <Badge
                        variant={seller.plan === "Subscription" ? "primary" : "secondary"}
                      >
                        {seller.plan}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">{seller.listings}</td>
                    <td className="px-3 py-3">${seller.revenue}</td>
                    <td className="px-3 py-3">{seller.soldListings}</td>
                    <td className="px-3 py-3">
                      {formatCurrencyFromCents(seller.sellerNetMkd, Currency.MKD)}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {seller.joined.toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <span className="h-2 w-2 rounded-full bg-success" />
                        {isMk ? text.active : seller.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
