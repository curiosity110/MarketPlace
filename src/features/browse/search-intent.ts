import { Prisma } from "@prisma/client";

type BrowseCategoryNode = {
  id: string;
  name: string;
  slug: string;
  children: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
};

type BrowseCarMakeNode = {
  id: string;
  name: string;
  slug: string;
  models: Array<{
    id: string;
    name: string;
    slug: string;
    makeId: string;
  }>;
};

type SearchableListing = {
  title: string;
  description: string;
  createdAt: Date | string;
  category: {
    id: string;
    name: string;
    slug: string;
    parent: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
  carMake?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  carModel?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  fieldValues?: Array<{
    key: string;
    value: string;
  }>;
};

type CategoryInference = {
  categoryId?: string;
  subcategoryId?: string;
  confidence: "low" | "medium" | "high";
};

export type BrowseSearchIntent = {
  rawQuery: string;
  normalizedQuery: string;
  phrase: string;
  tokens: string[];
  inferredCategoryId?: string;
  inferredSubcategoryId?: string;
  inferredMakeSlug?: string;
  inferredModelSlug?: string;
  confidence: "low" | "medium" | "high";
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "for",
  "with",
  "na",
  "za",
  "so",
  "od",
  "i",
  "vo",
]);

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  cars: [
    "car",
    "cars",
    "auto",
    "autos",
    "vehicle",
    "vehicles",
    "truck",
    "trucks",
    "lorry",
    "van",
    "bus",
    "buses",
    "autobus",
    "autobuses",
    "sedan",
    "sedans",
    "suv",
    "suvs",
    "hatchback",
    "hatchbacks",
  ],
  "real-estate": [
    "real estate",
    "property",
    "properties",
    "apartment",
    "apartments",
    "flat",
    "flats",
    "house",
    "houses",
    "home",
    "homes",
    "land",
  ],
  electronics: [
    "electronics",
    "computer",
    "computers",
    "laptop",
    "laptops",
    "tv",
    "audio",
    "gaming",
    "console",
  ],
  jobs: ["job", "jobs", "work", "career", "position", "remote"],
  services: ["service", "services", "repair", "cleaning", "transport"],
  furniture: ["furniture", "sofa", "table", "wardrobe", "bed", "desk"],
  phones: ["phone", "phones", "smartphone", "mobile", "iphone", "galaxy", "xiaomi"],
  fashion: ["fashion", "clothes", "clothing", "wear", "outfit", "shoes", "sneakers"],
  "fashion-shoes": ["shoe", "shoes", "sneaker", "sneakers", "boots", "heels", "nike"],
  "phones-iphone": ["iphone", "ios"],
  "phones-samsung": ["samsung", "galaxy"],
  "phones-xiaomi": ["xiaomi", "redmi"],
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeSlug(value: string) {
  return normalizeText(value).replace(/\s+/g, "-");
}

function includesTerm(source: string, term: string) {
  if (!source || !term) return false;
  const haystack = ` ${source} `;
  const needle = ` ${term} `;
  return haystack.includes(needle) || source.includes(term);
}

function tokenizeQuery(query: string) {
  const normalized = normalizeText(query);
  const tokens = [...new Set(normalized.split(/\s+/).filter(Boolean))]
    .filter((token) => token.length > 1)
    .filter((token) => !STOP_WORDS.has(token));

  return {
    normalized,
    tokens,
  };
}

function getCategoryAliasScore(
  normalizedQuery: string,
  tokens: string[],
  aliases: string[],
) {
  let score = 0;

  aliases.forEach((alias) => {
    const normalizedAlias = normalizeText(alias);
    if (!normalizedAlias) return;
    if (includesTerm(normalizedQuery, normalizedAlias)) {
      score += normalizedAlias.includes(" ") ? 8 : 5;
      return;
    }
    normalizedAlias.split(" ").forEach((part) => {
      if (tokens.includes(part)) score += 2;
    });
  });

  return score;
}

function inferCategory(
  normalizedQuery: string,
  tokens: string[],
  categories: BrowseCategoryNode[],
): CategoryInference {
  let best:
    | {
        categoryId?: string;
        subcategoryId?: string;
        score: number;
      }
    | undefined;

  categories.forEach((category) => {
    const parentAliases = [
      category.name,
      category.slug.replace(/-/g, " "),
      ...(CATEGORY_SYNONYMS[category.slug] || []),
    ];
    const parentScore = getCategoryAliasScore(normalizedQuery, tokens, parentAliases);
    if (parentScore > 0 && (!best || parentScore > best.score)) {
      best = {
        categoryId: category.id,
        score: parentScore,
      };
    }

    category.children.forEach((child) => {
      const childAliases = [
        child.name,
        child.slug.replace(/-/g, " "),
        ...(CATEGORY_SYNONYMS[child.slug] || []),
      ];
      const childScore = getCategoryAliasScore(normalizedQuery, tokens, childAliases);
      if (childScore > 0 && (!best || childScore > best.score)) {
        best = {
          categoryId: category.id,
          subcategoryId: child.id,
          score: childScore + 4,
        };
      }
    });
  });

  if (!best) {
    return { confidence: "low" };
  }

  return {
    categoryId: best.categoryId,
    subcategoryId: best.subcategoryId,
    confidence: best.score >= 8 ? "high" : best.score >= 4 ? "medium" : "low",
  };
}

function inferVehicleIdentity(
  normalizedQuery: string,
  carMakes: BrowseCarMakeNode[],
) {
  let inferredMakeSlug: string | undefined;
  let inferredModelSlug: string | undefined;
  let bestMakeScore = 0;
  let bestModelScore = 0;

  carMakes.forEach((make) => {
    const makeTerms = [normalizeText(make.name), make.slug.replace(/-/g, " ")];
    const makeMatched = makeTerms.some((term) => includesTerm(normalizedQuery, term));
    const makeScore = makeMatched ? Math.max(...makeTerms.map((term) => term.length)) : 0;

    if (makeScore > bestMakeScore) {
      bestMakeScore = makeScore;
      inferredMakeSlug = make.slug;
    }

    make.models.forEach((model) => {
      const modelTerms = [normalizeText(model.name), model.slug.replace(/-/g, " ")];
      const modelMatched = modelTerms.some((term) => includesTerm(normalizedQuery, term));
      const modelScore = modelMatched ? Math.max(...modelTerms.map((term) => term.length)) : 0;

      if (modelScore > bestModelScore) {
        bestModelScore = modelScore;
        inferredModelSlug = model.slug;
        inferredMakeSlug = make.slug;
      }
    });
  });

  return {
    inferredMakeSlug,
    inferredModelSlug,
    confidence:
      bestModelScore >= 4 ? ("high" as const) : bestMakeScore >= 4 ? ("medium" as const) : ("low" as const),
  };
}

function buildPhraseVariants(tokens: string[]) {
  if (tokens.length < 2) return [];

  const variants = new Set<string>();
  for (let size = Math.min(tokens.length, 3); size >= 2; size -= 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      variants.add(tokens.slice(index, index + size).join(" "));
    }
  }

  return [...variants];
}

export function resolveBrowseSearchIntent(input: {
  query?: string | null;
  categories: BrowseCategoryNode[];
  carMakes: BrowseCarMakeNode[];
}) {
  const rawQuery = (input.query || "").trim();
  const { normalized, tokens } = tokenizeQuery(rawQuery);
  const phrase = rawQuery.trim();

  if (!normalized) {
    return {
      rawQuery,
      normalizedQuery: normalized,
      phrase,
      tokens,
      confidence: "low",
    } satisfies BrowseSearchIntent;
  }

  const categoryInference = inferCategory(normalized, tokens, input.categories);
  const vehicleInference = inferVehicleIdentity(normalized, input.carMakes);

  const carsCategory = input.categories.find((category) => category.slug === "cars");
  const inferredCategoryId =
    vehicleInference.confidence !== "low" && carsCategory
      ? carsCategory.id
      : categoryInference.categoryId;

  return {
    rawQuery,
    normalizedQuery: normalized,
    phrase,
    tokens,
    inferredCategoryId,
    inferredSubcategoryId:
      vehicleInference.confidence === "high" ? categoryInference.subcategoryId : categoryInference.subcategoryId,
    inferredMakeSlug: vehicleInference.inferredMakeSlug,
    inferredModelSlug: vehicleInference.inferredModelSlug,
    confidence:
      vehicleInference.confidence === "high"
        ? "high"
        : categoryInference.confidence === "high" || vehicleInference.confidence === "medium"
          ? "medium"
          : categoryInference.confidence,
  } satisfies BrowseSearchIntent;
}

function buildTextMatchClauses(term: string): Prisma.ListingWhereInput[] {
  const normalizedSlug = normalizeSlug(term);

  return [
    { title: { contains: term, mode: "insensitive" } },
    { description: { contains: term, mode: "insensitive" } },
    {
      fieldValues: {
        some: {
          value: { contains: term, mode: "insensitive" },
        },
      },
    },
    {
      category: {
        is: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { slug: { contains: normalizedSlug, mode: "insensitive" } },
          ],
        },
      },
    },
    {
      category: {
        is: {
          parent: {
            is: {
              OR: [
                { name: { contains: term, mode: "insensitive" } },
                { slug: { contains: normalizedSlug, mode: "insensitive" } },
              ],
            },
          },
        },
      },
    },
    {
      carMake: {
        is: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { slug: { contains: normalizedSlug, mode: "insensitive" } },
          ],
        },
      },
    },
    {
      carModel: {
        is: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { slug: { contains: normalizedSlug, mode: "insensitive" } },
          ],
        },
      },
    },
  ];
}

export function buildBrowseSearchFilters(intent: BrowseSearchIntent) {
  if (!intent.normalizedQuery) return [];

  // Build a single OR group that searches across:
  // - title
  // - description
  // - dynamic field values
  // - category / subcategory names
  // - car make / model names
  //
  // Uses case-insensitive `contains` matching in Prisma, and supports both the
  // full phrase and individual tokens so queries like "Audi R8" match listings
  // titled "AUDI R8" as well as related fields.

  const clauses: Prisma.ListingWhereInput[] = [];

  // Prefer matching the full normalized phrase first.
  if (intent.normalizedQuery) {
    clauses.push(...buildTextMatchClauses(intent.normalizedQuery));
  }

  // Also match each token to catch partials / reordered words.
  intent.tokens.forEach((token) => {
    if (!token) return;
    clauses.push(...buildTextMatchClauses(token));
  });

  if (clauses.length === 0) return [];

  return [
    {
      OR: clauses,
    },
  ];
}

export function buildImplicitCategoryFilter(input: {
  intent: BrowseSearchIntent;
  explicitCategoryId?: string;
  explicitSubcategoryId?: string;
}) {
  if (input.explicitCategoryId || input.explicitSubcategoryId) return null;

  if (input.intent.inferredSubcategoryId) {
    return {
      categoryId: input.intent.inferredSubcategoryId,
    } satisfies Prisma.ListingWhereInput;
  }

  if (input.intent.inferredCategoryId && input.intent.confidence === "high") {
    return {
      OR: [
        { categoryId: input.intent.inferredCategoryId },
        {
          category: {
            is: {
              parentId: input.intent.inferredCategoryId,
            },
          },
        },
      ],
    } satisfies Prisma.ListingWhereInput;
  }

  return null;
}

export function scoreBrowseListingSearchIntent(
  listing: SearchableListing,
  intent: BrowseSearchIntent,
) {
  if (!intent.normalizedQuery) return 0;

  const title = normalizeText(listing.title);
  const description = normalizeText(listing.description);
  const categoryParts = [
    normalizeText(listing.category.name),
    normalizeText(listing.category.slug.replace(/-/g, " ")),
    normalizeText(listing.category.parent?.name || ""),
    normalizeText((listing.category.parent?.slug || "").replace(/-/g, " ")),
  ].filter(Boolean);
  const fieldValues = (listing.fieldValues || []).map((entry) => normalizeText(entry.value));
  const carMake = normalizeText(listing.carMake?.name || listing.carMake?.slug || "");
  const carModel = normalizeText(listing.carModel?.name || listing.carModel?.slug || "");
  const phrase = intent.normalizedQuery;
  const phraseVariants = buildPhraseVariants(intent.tokens);
  const identityLine = [carMake, carModel].filter(Boolean).join(" ");
  const searchableParts = [
    title,
    description,
    ...categoryParts,
    ...fieldValues,
    carMake,
    carModel,
  ].filter(Boolean);

  let score = 0;

  if (includesTerm(title, phrase)) score += 140;
  if (title.startsWith(phrase)) score += 50;
  if (includesTerm(description, phrase)) score += 35;
  if (fieldValues.some((value) => includesTerm(value, phrase))) score += 50;
  if (includesTerm(carMake, phrase)) score += 90;
  if (includesTerm(carModel, phrase)) score += 90;
  if (identityLine && includesTerm(identityLine, phrase)) score += 130;

  phraseVariants.forEach((variant) => {
    if (includesTerm(title, variant)) score += 42;
    if (fieldValues.some((value) => includesTerm(value, variant))) score += 24;
    if (identityLine && includesTerm(identityLine, variant)) score += 64;
  });

  intent.tokens.forEach((token) => {
    if (includesTerm(title, token)) score += 24;
    if (includesTerm(description, token)) score += 8;
    if (fieldValues.some((value) => includesTerm(value, token))) score += 12;
    if (categoryParts.some((value) => includesTerm(value, token))) score += 14;
    if (includesTerm(carMake, token)) score += 32;
    if (includesTerm(carModel, token)) score += 32;
  });

  const matchedTokenCount = intent.tokens.filter((token) =>
    searchableParts.some((part) => includesTerm(part, token)),
  ).length;
  const titleTokenCount = intent.tokens.filter((token) => includesTerm(title, token)).length;
  const identityTokenCount = intent.tokens.filter((token) => includesTerm(identityLine, token)).length;

  if (intent.tokens.length > 1 && matchedTokenCount === intent.tokens.length) {
    score += 85;
  }
  if (intent.tokens.length > 1 && titleTokenCount === intent.tokens.length) {
    score += 110;
  }
  if (intent.tokens.length > 1 && identityLine && identityTokenCount === intent.tokens.length) {
    score += 120;
  }

  if (intent.inferredSubcategoryId && listing.category.id === intent.inferredSubcategoryId) {
    score += 120;
  } else if (
    intent.inferredCategoryId &&
    (listing.category.id === intent.inferredCategoryId ||
      listing.category.parent?.id === intent.inferredCategoryId)
  ) {
    score += 70;
  }

  if (intent.inferredMakeSlug && listing.carMake?.slug === intent.inferredMakeSlug) {
    score += 110;
  }
  if (intent.inferredModelSlug && listing.carModel?.slug === intent.inferredModelSlug) {
    score += 120;
  }

  const createdAtTime = new Date(listing.createdAt).getTime();
  if (Number.isFinite(createdAtTime)) {
    score += createdAtTime / 1_000_000_000_000;
  }

  return score;
}
