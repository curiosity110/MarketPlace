import Link from "next/link";
import { ChevronLeft, Share2 } from "lucide-react";
import { ListingMedia } from "@/features/listing-details/listing-media";
import { ListingHero } from "@/features/listing-details/listing-hero";
import { ListingDescription } from "@/features/listing-details/listing-description";
import { ListingContact } from "@/features/listing-details/listing-contact";
import { ListingOwnerActions } from "@/features/listing-details/listing-owner-actions";

/**
 * Premium product page layout
 * - Media dominates
 * - Hero info below
 * - Full description
 * - Contact area
 * - Owner actions subtle
 */
export function ListingDetailsLayout({
  listing,
  isOwner,
  isFavorited,
  isAuthenticated,
  categoryLabel,
  text,
  browseQuery,
  locale,
  whatsappHref,
  backToBrowseHref,
}: {
  listing: any; // Full listing object
  isOwner: boolean;
  isFavorited: boolean;
  isAuthenticated: boolean;
  categoryLabel: string;
  text: any;
  browseQuery: string;
  locale: "en" | "mk";
  whatsappHref: string;
  backToBrowseHref: string;
}) {
  const isSold = Boolean(listing.sale);

  return (
    <div className="mx-auto min-w-0 max-w-4xl">
      {/* Back Link */}
      <div className="mb-4 flex items-center justify-between gap-3 px-1 sm:px-0">
        <Link
          href={backToBrowseHref}
          className="flex min-h-10 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft size={18} />
          <span>{text.backToBrowse}</span>
        </Link>

        {!isOwner && (
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Share"
          >
            <Share2 size={18} />
          </button>
        )}
      </div>

      {/* Media - Full Width, Dominant */}
      <div className="mb-6 sm:mb-8">
        <ListingMedia
          locale={locale}
          imageUrls={listing.images.map((img: any) => img.url)}
          title={listing.title}
          text={text}
        />
      </div>

      {/* Hero Info Below Media */}
      <div className="mb-6 px-1 sm:mb-8 sm:px-0">
        <ListingHero
          category={categoryLabel}
          condition={listing.condition}
          title={listing.title}
          price={listing.priceCents}
          currency={listing.currency}
          location={listing.city.name}
          locale={locale}
          text={text}
        />
      </div>

      {/* Description */}
      <div className="mb-8 px-1 sm:mb-10 sm:px-0">
        <ListingDescription
          locale={locale}
          descriptionTitle={text.description}
          description={listing.description}
          categoryDetailsTitle={text.categoryDetails}
          noCategoryDetailsLabel={text.noCategoryDetails}
          categoryDetails={[]} // Built separately
          valuesByKey={{}} // Built separately
          isCarCategory={false}
        />
      </div>

      {/* Seller Contact - Clear CTA */}
      {!isOwner && (
        <div className="mb-8 px-1 sm:mb-10 sm:px-0">
          <ListingContact
            locale={locale}
            listingId={listing.id}
            sellerName={listing.seller.name || listing.seller.email}
            sellerPhone={listing.seller.phone}
            sellerEmail={listing.seller.email}
            sellerId={listing.seller.id}
            isSold={isSold}
            isAuthenticated={isAuthenticated}
            browseQuery={browseQuery}
            whatsappHref={whatsappHref}
            text={text}
          />
        </div>
      )}

      {/* Owner Actions - Subtle */}
      {isOwner && (
        <div className="flex gap-3 px-1 text-sm sm:px-0">
          <ListingOwnerActions
            listingId={listing.id}
            priceCents={listing.priceCents}
            locale={locale}
            isSold={isSold}
            text={text}
          />
        </div>
      )}

      {/* Favorite - Always Available */}
      {!isOwner && isAuthenticated && (
        <div className="mt-6 px-4 sm:px-0">
          {/* Favorite integrated with contact or separate button */}
        </div>
      )}
    </div>
  );
}
