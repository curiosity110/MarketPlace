import type { Locale } from "@/lib/i18n";

const MK_BY_SLUG: Record<string, string> = {
  cars: "Автомобили",
  "real-estate": "Недвижности",
  electronics: "Електроника",
  jobs: "Работа",
  services: "Услуги",
  furniture: "Мебел",
  phones: "Телефони",
  fashion: "Мода",
};

const MK_BY_NAME: Record<string, string> = {
  Cars: "Автомобили",
  "Real Estate": "Недвижности",
  Electronics: "Електроника",
  Jobs: "Работа",
  Services: "Услуги",
  Furniture: "Мебел",
  Phones: "Телефони",
  Fashion: "Мода",
};

type CategoryLike = {
  name: string;
  slug?: string | null;
};

export function localizeCategoryName(
  category: CategoryLike | null | undefined,
  locale: Locale,
): string {
  if (!category) return "";
  if (locale !== "mk") return category.name;

  const bySlug = category.slug ? MK_BY_SLUG[category.slug] : undefined;
  return bySlug || MK_BY_NAME[category.name] || category.name;
}

type CategoryPathLike = {
  name: string;
  slug?: string | null;
  parent?: {
    name: string;
    slug?: string | null;
  } | null;
};

export function localizeCategoryPath(
  category: CategoryPathLike,
  locale: Locale,
): string {
  const child = localizeCategoryName(category, locale);
  if (!category.parent) return child;
  const parent = localizeCategoryName(category.parent, locale);
  return `${parent} / ${child}`;
}
