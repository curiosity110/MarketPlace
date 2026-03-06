import Link from "next/link";
import type { Currency } from "@prisma/client";
import { BadgeCheck, MapPin, Pencil } from "lucide-react";
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { MarkSoldPopout } from "@/components/mark-sold-popout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrencyFromCents } from "@/lib/currency";

type Props = {
  locale: "en" | "mk";
  title: string;
  cityName: string;
  categoryLabel: string;
  conditionLabel: string;
  priceCents: number;
  currency: Currency;
  listingId: string;
  isOwner: boolean;
  isAuthenticated: boolean;
  isFavorited: boolean;
  isSold: boolean;
  text: {
    price: string;
    sold: string;
    edit: string;
  };
};

export function ListingDetailsHeader({
  locale,
  title,
  cityName,
  categoryLabel,
  conditionLabel,
  priceCents,
  currency,
  listingId,
  isOwner,
  isAuthenticated,
  isFavorited,
  isSold,
  text,
}: Props) {
  void text.price;
  return (
    <div className="space-y-3 px-1 pb-1">
      <div className="flex max-w-full min-w-0 flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-3">
        <h1 className="break-words text-[1.8rem] font-semibold leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-[2.15rem] lg:text-[2.5rem]">
          {title}
        </h1>
        <div className="flex max-w-full flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} />
            {cityName}
          </span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{categoryLabel}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{conditionLabel}</span>
          {isSold && (
            <Badge variant="secondary" className="gap-1">
              <BadgeCheck size={12} />
              {text.sold}
            </Badge>
          )}
        </div>
      </div>

      <div className="w-full max-w-full space-y-3 sm:w-auto sm:min-w-[260px]">
        <div className="rounded-[1.2rem] bg-primary/6 px-4 py-3.5 text-right ring-1 ring-primary/12">
          <p className="text-[1.7rem] font-semibold tracking-tight text-primary sm:text-[2rem]">
            {formatCurrencyFromCents(priceCents, currency)}
          </p>
        </div>
        {!isOwner && (
          <div className="flex justify-end">
            <FavoriteToggleButton
              listingId={listingId}
              locale={locale}
              isAuthenticated={isAuthenticated}
              initialFavorited={isFavorited}
            />
          </div>
        )}
        {isOwner && (
          <div className="flex flex-wrap justify-end gap-2">
            <Link href={`/sell/${listingId}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil size={14} />
                {text.edit}
              </Button>
            </Link>
            {!isSold ? (
              <MarkSoldPopout
                listingId={listingId}
                locale={locale}
                defaultPriceCents={priceCents}
              />
            ) : (
              <Badge variant="secondary" className="h-9 px-3">
                {text.sold}
              </Badge>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
