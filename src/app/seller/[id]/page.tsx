import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingStatus } from "@prisma/client";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getServerLocale } from "@/lib/i18n";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

function toHandle(value: string) {
  return `@${value}`;
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const text = isMk
    ? {
        dbUnavailable:
          "Профилот на продавачот е привремено недостапен. Обиди се повторно наскоро.",
        sellerProfile: "Профил на продавач",
        activeListings: "Активни огласи",
        memberSince: "Член од",
        contactPhone: "Контакт телефон",
        notSet: "Не е поставено",
        backToBrowse: "Назад кон пребарување",
        noActiveListings: "Овој продавач моментално нема активни огласи.",
      }
    : {
        dbUnavailable:
          "Seller profile is temporarily unavailable. Please retry in a moment.",
        sellerProfile: "Seller profile",
        activeListings: "Active listings",
        memberSince: "Member since",
        contactPhone: "Contact phone",
        notSet: "Not set",
        backToBrowse: "Back to browse",
        noActiveListings: "This seller has no active listings right now.",
      };

  const { id } = await params;
  async function fetchSellerProfile() {
    return Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          phone: true,
          createdAt: true,
          bio: true,
          company: true,
          website: true,
        },
      }),
      prisma.listing.findMany({
        where: {
          sellerId: id,
          status: ListingStatus.ACTIVE,
          sale: null,
        },
        include: {
          city: true,
          category: {
            include: {
              parent: true,
              fieldTemplates: {
                where: { isActive: true },
                orderBy: { order: "asc" },
              },
            },
          },
          images: true,
          fieldValues: true,
          seller: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);
  }

  let sellerData: Awaited<ReturnType<typeof fetchSellerProfile>> | null = null;
  try {
    if (!shouldSkipPrismaCalls()) {
      sellerData = await fetchSellerProfile();
      markPrismaHealthy();
    }
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      sellerData = null;
    } else {
      throw error;
    }
  }

  if (!sellerData) {
    return (
      <div className="space-y-4">
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-5 text-sm text-foreground">
            {text.dbUnavailable}
          </CardContent>
        </Card>
        <Link href="/browse">
          <Button variant="outline">{text.backToBrowse}</Button>
        </Link>
      </div>
    );
  }

  const [seller, listings] = sellerData;
  if (!seller) notFound();

  const displayName = seller.name || seller.email.split("@")[0];
  const sellerHandle = toHandle(seller.username || displayName);

  return (
    <div className="space-y-6">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {text.sellerProfile}
        </p>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl">{displayName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{sellerHandle}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>
            {text.memberSince}{" "}
            {new Date(seller.createdAt).toLocaleDateString(isMk ? "mk-MK" : "en-US")}
          </span>
          <span>|</span>
          <span>
            {text.activeListings}: {listings.length}
          </span>
          <span>|</span>
          <span>
            {text.contactPhone}: {seller.phone || text.notSet}
          </span>
        </div>
        {seller.bio && (
          <p className="mt-3 max-w-2xl text-sm text-foreground/90">{seller.bio}</p>
        )}
      </section>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {text.noActiveListings}
          </CardContent>
        </Card>
      ) : (
        <div className="responsive-grid gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
