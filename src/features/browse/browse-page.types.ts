import type { CategoryFieldType } from "@prisma/client";

export type BrowseSort = "newest" | "price-asc" | "price-desc";

export type BrowseTemplate = {
  key: string;
  label: string;
  type: CategoryFieldType;
  options: string[];
};

export type CarMakeOption = {
  id: string;
  name: string;
  slug: string;
  models: {
    id: string;
    name: string;
    slug: string;
    makeId: string;
  }[];
};

export type ActiveFilterChip = {
  key: string;
  label: string;
  href: string;
};

export type ListingSimilarityData = {
  id: string;
  city: { id: string };
  carMake: { slug: string } | null;
  carModel: { slug: string } | null;
  carYear: number | null;
  priceCents: number;
  fieldValues: { key: string; value: string }[];
};
