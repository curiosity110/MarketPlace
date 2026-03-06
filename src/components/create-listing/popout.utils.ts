export function normalizeCreateCategorySearchText(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreCreateCategoryQuery(
  searchText: string,
  query: string,
  tokens: string[],
) {
  if (!searchText) return 0;
  if (searchText === query) return 140;
  if (searchText.startsWith(query)) return 110;
  if (searchText.includes(` ${query}`)) return 95;
  if (searchText.includes(query)) return 82;
  if (tokens.length > 1 && tokens.every((token) => searchText.includes(token))) {
    return 74 + Math.min(tokens.length, 6);
  }
  return 0;
}

export function collectAllLabelStrings(input: unknown, out: Set<string>) {
  if (!input) return;
  if (typeof input === "string") {
    out.add(input);
    return;
  }
  if (Array.isArray(input)) {
    input.forEach((value) => collectAllLabelStrings(value, out));
    return;
  }
  if (typeof input === "object") {
    Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
      if (
        typeof value === "string" &&
        /(name|label|title|locale|translation|i18n|en|mk)/i.test(key)
      ) {
        out.add(value);
      } else if (
        value &&
        typeof value === "object" &&
        /(name|label|title|locale|translation|i18n)/i.test(key)
      ) {
        collectAllLabelStrings(value, out);
      }
    });
  }
}
