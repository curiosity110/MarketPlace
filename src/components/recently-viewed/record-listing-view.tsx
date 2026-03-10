"use client";

import { useEffect } from "react";
import { addRecentlyViewed } from "@/lib/recently-viewed";

type Props = { listingId: string };

export function RecordListingView({ listingId }: Props) {
  useEffect(() => {
    if (listingId) addRecentlyViewed(listingId);
  }, [listingId]);
  return null;
}
