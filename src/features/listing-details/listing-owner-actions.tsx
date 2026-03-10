"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { MarkSoldPopout } from "@/components/mark-sold-popout";
import type { ListingDetailsText } from "@/features/listing-details/types";

type Props = {
  listingId: string;
  priceCents: number;
  locale: "en" | "mk";
  isSold: boolean;
  text: Pick<ListingDetailsText, "edit">;
};

export function ListingOwnerActions({
  listingId,
  priceCents,
  locale,
  isSold,
  text,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <Link
        href={`/sell/${listingId}/edit`}
        className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Pencil size={14} />
        <span>{text.edit}</span>
      </Link>

      {!isSold && (
        <MarkSoldPopout
          listingId={listingId}
          locale={locale}
          defaultPriceCents={priceCents}
          iconOnly={false}
          className="h-auto rounded-none border-0 bg-transparent px-0 py-0 text-sm text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-foreground"
        />
      )}
    </div>
  );
}
