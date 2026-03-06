export type CreateListingCategory = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
};

export type CreateListingCity = {
  id: string;
  name: string;
};

export type CreateListingTemplate = {
  id: string;
  key: string;
  label: string;
  type: "TEXT" | "NUMBER" | "SELECT" | "BOOLEAN";
  required: boolean;
  order: number;
  options: string[];
};

export type CreateListingPlan = "pay-per-listing" | "subscription";
