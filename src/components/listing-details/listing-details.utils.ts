export function toWhatsappHref(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function buildBackToBrowseHref(
  searchParams: Record<string, string | undefined>,
) {
  const browseParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (!value) return;
    if (["reported", "error", "msg", "sold", "contacted"].includes(key)) return;
    browseParams.set(key, value);
  });
  const browseQuery = browseParams.toString();
  return {
    browseQuery,
    backToBrowseHref: browseQuery ? `/browse?${browseQuery}` : "/browse",
  };
}

export function isCarCategory(category: {
  name?: string | null;
  slug?: string | null;
  parent?: { name?: string | null } | null;
}) {
  const catName = (category?.name || "").toLowerCase();
  const parentName = (category?.parent?.name || "").toLowerCase();
  const catSlug = (category?.slug || "").toLowerCase();

  return (
    catSlug.includes("car") ||
    catName.includes("car") ||
    catName.includes("auto") ||
    catName.includes("vehicle") ||
    parentName.includes("vehicle") ||
    parentName.includes("auto")
  );
}

export function getConditionLabelMap(locale: "en" | "mk") {
  if (locale === "mk") {
    return { NEW: "Ново", USED: "Користено", REFURBISHED: "Рефурбиширано" } as const;
  }
  return { NEW: "New", USED: "Used", REFURBISHED: "Refurbished" } as const;
}

export type ListingCategoryDetail = {
  id: string;
  label: string;
  value: string;
};

export function buildCategoryDetails(
  fieldTemplates: Array<{ id: string; key: string; label: string }>,
  fieldValues: Array<{ key: string; value: string }>,
): ListingCategoryDetail[] {
  const valuesByKey = Object.fromEntries(
    fieldValues.map((field) => [field.key, field.value]),
  );
  return fieldTemplates
    .map((template) => {
      const value = valuesByKey[template.key];
      if (!value) return null;
      return {
        id: template.id,
        label: template.label,
        value,
      };
    })
    .filter((item): item is ListingCategoryDetail => Boolean(item));
}
