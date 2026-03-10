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

/** Which filter fields to show below search based on detected intent. */
export type IntentFilterSuggestion = {
  showCategory: boolean;
  showMake: boolean;
  showModel: boolean;
  showYearRange: boolean;
  showPriceRange: boolean;
  showCondition: boolean;
  showCity: boolean;
  showFuel: boolean;
  /** For real estate: show rent/sale (deal type). */
  showDealType: boolean;
  /** For jobs: show salary. */
  showSalary: boolean;
  /** Pre-filled category id (parent or child). */
  suggestedCategoryId?: string;
  suggestedSubcategoryId?: string;
  suggestedMakeSlug?: string;
  suggestedModelSlug?: string;
  suggestedCityId?: string;
  suggestedCondition?: string;
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

type CategoryNodeForIntent = { id: string; name: string; slug: string; children: { id: string; slug: string }[] };
type CityForIntent = { id: string; name: string };

/** Returns which filter fields to show below search and suggested values from intent. */
export function getIntentFilterSuggestion(
  intent: BrowseSearchIntent,
  categories: CategoryNodeForIntent[],
  carMakes: BrowseCarMakeNode[],
  cities: CityForIntent[],
): IntentFilterSuggestion {
  const empty: IntentFilterSuggestion = {
    showCategory: false,
    showMake: false,
    showModel: false,
    showYearRange: false,
    showPriceRange: true,
    showCondition: true,
    showCity: false,
    showFuel: false,
    showDealType: false,
    showSalary: false,
  };

  if (!intent.normalizedQuery || intent.confidence === "low") {
    return empty;
  }

  const norm = (s: string) => normalizeText(s);
  const tokens = intent.tokens;
  const matchedCity = cities.find(
    (c) => tokens.includes(norm(c.name)) || norm(c.name).split(/\s+/).some((part) => tokens.includes(part)),
  );

  const carsCat = categories.find((c) => c.slug === "cars");
  const realEstateCat = categories.find((c) => c.slug === "real-estate");
  const electronicsCat = categories.find((c) => c.slug === "electronics");
  const jobsCat = categories.find((c) => c.slug === "jobs");

  const parentOfInferred = categories.find(
    (p) =>
      p.id === intent.inferredCategoryId ||
      p.children.some(
        (ch) => ch.id === intent.inferredCategoryId || ch.id === intent.inferredSubcategoryId,
      ),
  );
  const inferredSlug = parentOfInferred?.slug;

  const isCars =
    inferredSlug === "cars" ||
    (carsCat && Boolean(intent.inferredMakeSlug));
  const isRealEstate =
    inferredSlug === "real-estate" ||
    (realEstateCat && tokens.some((t) => ["apartment", "house", "rent", "sale", "flat", "land"].includes(t)));
  const isElectronics =
    inferredSlug === "electronics" ||
    (electronicsCat && tokens.some((t) => ["iphone", "phone", "laptop", "tv", "macbook", "ipad"].includes(t)));
  const isJobs =
    inferredSlug === "jobs" ||
    (jobsCat && tokens.some((t) => ["job", "jobs", "developer", "work", "salary", "remote"].includes(t)));

  if (isCars && carsCat) {
    return {
      ...empty,
      showCategory: true,
      showMake: true,
      showModel: true,
      showYearRange: true,
      showPriceRange: true,
      showCondition: true,
      showCity: true,
      showFuel: true,
      showDealType: false,
      showSalary: false,
      suggestedCategoryId: intent.inferredSubcategoryId || intent.inferredCategoryId || carsCat.id,
      suggestedSubcategoryId: intent.inferredSubcategoryId || undefined,
      suggestedMakeSlug: intent.inferredMakeSlug,
      suggestedModelSlug: intent.inferredModelSlug,
      suggestedCityId: matchedCity?.id,
      suggestedCondition: undefined,
    };
  }

  if (isElectronics && electronicsCat) {
    return {
      ...empty,
      showCategory: true,
      showMake: false,
      showModel: false,
      showYearRange: false,
      showPriceRange: true,
      showCondition: true,
      showCity: true,
      showFuel: false,
      showDealType: false,
      showSalary: false,
      suggestedCategoryId: intent.inferredSubcategoryId || intent.inferredCategoryId || electronicsCat.id,
      suggestedSubcategoryId: intent.inferredSubcategoryId,
      suggestedCityId: matchedCity?.id,
    };
  }

  if (isRealEstate && realEstateCat) {
    return {
      ...empty,
      showCategory: true,
      showMake: false,
      showModel: false,
      showYearRange: false,
      showPriceRange: true,
      showCondition: false,
      showCity: true,
      showFuel: false,
      showDealType: true,
      showSalary: false,
      suggestedCategoryId: intent.inferredSubcategoryId || intent.inferredCategoryId || realEstateCat.id,
      suggestedSubcategoryId: intent.inferredSubcategoryId,
      suggestedCityId: matchedCity?.id,
    };
  }

  if (isJobs && jobsCat) {
    return {
      ...empty,
      showCategory: true,
      showMake: false,
      showModel: false,
      showYearRange: false,
      showPriceRange: true,
      showCondition: false,
      showCity: true,
      showFuel: false,
      showDealType: false,
      showSalary: true,
      suggestedCategoryId: intent.inferredSubcategoryId || intent.inferredCategoryId || jobsCat.id,
      suggestedSubcategoryId: intent.inferredSubcategoryId,
      suggestedCityId: matchedCity?.id,
    };
  }

  return {
    ...empty,
    showCity: true,
    suggestedCityId: matchedCity?.id,
  };
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

/** Exact title match = highest; exact make+model = second; partial = lowest. */
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

  // 1. Exact / full-phrase title match = highest priority (e.g. "Audi R8" in "Audi R8 V10 2019")
  const titleContainsFullPhrase = phrase.length > 0 && includesTerm(title, phrase);
  const titleEqualsPhrase = title === phrase;
  if (titleEqualsPhrase) score += 2500;
  else if (titleContainsFullPhrase) score += 2000;

  // 2. Exact make+model match = second priority
  const identityContainsFullPhrase =
    identityLine.length > 0 && phrase.length > 0 && includesTerm(identityLine, phrase);
  const identityEqualsPhrase = identityLine === phrase;
  if (identityEqualsPhrase) score += 1800;
  else if (identityContainsFullPhrase) score += 1500;

  // 3. All tokens in title (strong relevance)
  const titleTokenCount = intent.tokens.filter((token) => includesTerm(title, token)).length;
  const allTokensInTitle =
    intent.tokens.length > 0 && titleTokenCount === intent.tokens.length;
  if (allTokensInTitle && !titleContainsFullPhrase) score += 600;

  // 4. All tokens in make+model
  const identityTokenCount = intent.tokens.filter((token) =>
    includesTerm(identityLine, token),
  ).length;
  const allTokensInIdentity =
    identityLine.length > 0 &&
    intent.tokens.length > 0 &&
    identityTokenCount === intent.tokens.length;
  if (allTokensInIdentity && !identityContainsFullPhrase) score += 500;

  // 5. Partial / legacy relevance (lowest)
  if (includesTerm(description, phrase)) score += 35;
  if (fieldValues.some((value) => includesTerm(value, phrase))) score += 50;
  if (includesTerm(carMake, phrase)) score += 90;
  if (includesTerm(carModel, phrase)) score += 90;

  phraseVariants.forEach((variant) => {
    if (includesTerm(title, variant)) score += 42;
    if (fieldValues.some((value) => includesTerm(value, variant))) score += 24;
    if (identityLine && includesTerm(identityLine, variant)) score += 64;
  });

  intent.tokens.forEach((token) => {
    if (includesTerm(title, token)) score += 20;
    if (includesTerm(description, token)) score += 6;
    if (fieldValues.some((value) => includesTerm(value, token))) score += 10;
    if (categoryParts.some((value) => includesTerm(value, token))) score += 12;
    if (includesTerm(carMake, token)) score += 28;
    if (includesTerm(carModel, token)) score += 28;
  });

  const matchedTokenCount = intent.tokens.filter((token) =>
    searchableParts.some((part) => includesTerm(part, token)),
  ).length;
  if (intent.tokens.length > 1 && matchedTokenCount === intent.tokens.length) {
    score += 60;
  }

  if (intent.inferredSubcategoryId && listing.category.id === intent.inferredSubcategoryId) {
    score += 80;
  } else if (
    intent.inferredCategoryId &&
    (listing.category.id === intent.inferredCategoryId ||
      listing.category.parent?.id === intent.inferredCategoryId)
  ) {
    score += 50;
  }

  if (intent.inferredMakeSlug && listing.carMake?.slug === intent.inferredMakeSlug) {
    score += 90;
  }
  if (intent.inferredModelSlug && listing.carModel?.slug === intent.inferredModelSlug) {
    score += 100;
  }

  const createdAtTime = new Date(listing.createdAt).getTime();
  if (Number.isFinite(createdAtTime)) {
    score += createdAtTime / 1_000_000_000_000;
  }

  return score;
}
