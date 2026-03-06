import type { ComponentProps } from "react";
import type { ListingCard } from "@/components/listing-card";

export type ProfileListingCardData = ComponentProps<typeof ListingCard>["listing"];

export type ProfileUserRecord = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  username: string | null;
  company: string | null;
  website: string | null;
  bio: string | null;
  address: string | null;
} | null;
