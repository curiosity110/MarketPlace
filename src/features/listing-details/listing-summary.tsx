import Link from "next/link";
import { Pencil } from "lucide-react";
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { MarkSoldPopout } from "@/components/mark-sold-popout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionBlock } from "@/components/ui/layout";
import { formatCurrencyFromCents } from "@/lib/currency";
import { ListingMeta } from "@/features/listing-details/listing-meta";
import type { ListingDetailsSummaryProps } from "@/features/listing-details/types";
import { getConditionLabel } from "@/features/listing-details/utils";

export function ListingSummary({
  locale,
  title,
  cityName,
  categoryLabel,
  condition,
  priceCents,
  currency,
  listingId,
  isOwner,
  isAuthenticated,
  isFavorited,
  isSold,
  text,
}: ListingDetailsSummaryProps) {
  const conditionLabel = getConditionLabel(locale, condition);

  return (
    <SectionBlock
      className="space-y-5"
      contentClassName="space-y-5"
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isOwner ? (
            <>
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
            </>
          ) : (
            <FavoriteToggleButton
              listingId={listingId}
              locale={locale}
              isAuthenticated={isAuthenticated}
              initialFavorited={isFavorited}
            />
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {isSold ? (
          <Badge variant="secondary" className="w-fit px-2.5 py-1 text-xs">
            {text.sold}
          </Badge>
        ) : null}
        <h1 className="break-words text-[2.2rem] font-semibold leading-tight tracking-[-0.05em] [overflow-wrap:anywhere] sm:text-[2.8rem]">
          {title}
        </h1>
        <div className="space-y-1">
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {text.price}
          </p>
          <p className="text-[2.1rem] font-semibold leading-none tracking-[-0.04em] text-primary sm:text-[2.7rem]">
            {formatCurrencyFromCents(priceCents, currency)}
          </p>
        </div>
      </div>

      <ListingMeta
        cityName={cityName}
        categoryLabel={categoryLabel}
        conditionLabel={conditionLabel}
        text={{
          listedIn: text.listedIn,
          category: text.category,
          condition: text.condition,
        }}
      />
    </SectionBlock>
  );
}
