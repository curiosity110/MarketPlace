import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Car,
  House,
  Laptop2,
  PackageOpen,
  PlusCircle,
  Search,
  Shirt,
  Smartphone,
  Sofa,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryRequestForm } from "@/components/category-request-form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSessionUser, requireSeller } from "@/lib/auth";
import { localizeCategoryName } from "@/lib/category-label";
import { getServerLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import {
  isMissingCategoryRequestTableError,
  isPrismaConnectionError,
} from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

const iconBySlug = {
  cars: Car,
  "real-estate": House,
  electronics: Laptop2,
  jobs: BriefcaseBusiness,
  services: Wrench,
  furniture: Sofa,
  phones: Smartphone,
  fashion: Shirt,
} as const;

const POPULAR_CATEGORY_LOOKUP = [
  { slug: "cars", fallbackName: "cars" },
  { slug: "phones", fallbackName: "phones" },
  { slug: "electronics", fallbackName: "electronics" },
  { slug: "jobs", fallbackName: "jobs" },
  { slug: "real-estate", fallbackName: "real estate" },
  { slug: "fashion", fallbackName: "fashion" },
] as const;

function getCategoryCover(seed: string) {
  return `https://picsum.photos/seed/market-${encodeURIComponent(seed)}/1200/720`;
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const text = isMk
    ? {
        title: "Категории",
        subtitle:
          "Прегледна мапа на категории за пребарување и продавање. Избери категорија, филтрирај брзо и креирај оглас.",
        mainCategories: "Главни категории",
        subcategories: "Поткатегории",
        activeListings: "Активни огласи",
        searchPlaceholder: "Пребарај категории",
        dbUnavailable:
          "Категориите се привремено недостапни затоа што базата е недостапна.",
        browse: "Пребарувај",
        createHere: "Креирај тука",
        missingCategory: "Недостига категорија?",
        missingCategoryText:
          "Поднеси барање за нова категорија директно овде. Админ тимот може брзо да ја одобри.",
        openDashboardCategories: "Поднеси барање за категорија",
        continueBrowsing: "Продолжи со пребарување",
        requestCategoryTitle: "Побарај нова категорија",
        requestCategoryDesc:
          "Ако некоја категорија недостига, испрати барање и ќе се прегледа.",
        requestSaved: "Барањето е испратено. Ќе добиеш одговор по преглед.",
        requestErrorGeneric: "Барањето не може да се испрати моментално.",
        loginToRequest: "Најави се за да побараш нова категорија.",
        login: "Најава",
        invalidCategoryName: "Името на категоријата мора да има најмалку 3 карактери.",
      }
    : {
        title: "Categories",
        subtitle:
          "Clean category map for browsing and selling. Pick category, filter fast, and create listings directly.",
        mainCategories: "Main categories",
        subcategories: "Subcategories",
        activeListings: "Active listings",
        searchPlaceholder: "Search categories",
        dbUnavailable:
          "Categories are temporarily unavailable because the database is unreachable.",
        browse: "Browse",
        createHere: "Create here",
        missingCategory: "Missing a category?",
        missingCategoryText:
          "Submit a new category request directly here. The admin team can approve it quickly.",
        openDashboardCategories: "Submit category request",
        continueBrowsing: "Continue browsing",
        requestCategoryTitle: "Request a new category",
        requestCategoryDesc:
          "If a category is missing, submit a request and we will review it.",
        requestSaved: "Category request sent. You will get an update after review.",
        requestErrorGeneric: "Category request cannot be submitted right now.",
        loginToRequest: "Sign in to request a new category.",
        login: "Login",
        invalidCategoryName: "Category name must have at least 3 characters.",
      };
  const sp = await searchParams;
  const query = (sp.q || "").trim().toLowerCase();
  const requestSaved = sp.requested === "1";
  const requestError = sp.requestError;
  const sessionUser = await getSessionUser();

  async function submitCategoryRequest(formData: FormData) {
    "use server";

    const actionLocale =
      String(formData.get("locale") || "en") === "mk" ? "mk" : "en";
    const errors =
      actionLocale === "mk"
        ? {
            dbUnavailable: "Барањето не може да се испрати моментално.",
            invalidName:
              "Името на категоријата мора да има најмалку 3 карактери.",
          }
        : {
            dbUnavailable: "Category request cannot be submitted right now.",
            invalidName: "Category name must have at least 3 characters.",
          };

    const user = await requireSeller();
    if (shouldSkipPrismaCalls()) {
      redirect(
        `/categories?requestError=${encodeURIComponent(errors.dbUnavailable)}#request-category`,
      );
    }

    const desiredName = String(formData.get("desiredName") || "").trim();
    if (desiredName.length < 3) {
      redirect(
        `/categories?requestError=${encodeURIComponent(errors.invalidName)}#request-category`,
      );
    }

    const parentIdRaw = String(formData.get("parentId") || "").trim();
    const parentId = parentIdRaw || null;
    const descriptionRaw = String(formData.get("description") || "").trim();
    const description = descriptionRaw ? descriptionRaw.slice(0, 400) : null;

    try {
      await prisma.categoryRequest.create({
        data: {
          requesterId: user.id,
          desiredName: desiredName.slice(0, 80),
          parentId,
          description,
        },
      });
      markPrismaHealthy();
    } catch (error) {
      if (isMissingCategoryRequestTableError(error)) {
        redirect(
          `/categories?requestError=${encodeURIComponent(errors.dbUnavailable)}#request-category`,
        );
      }
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        redirect(
          `/categories?requestError=${encodeURIComponent(errors.dbUnavailable)}#request-category`,
        );
      }
      throw error;
    }

    revalidatePath("/categories");
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    redirect("/categories?requested=1#request-category");
  }

  async function fetchCategoriesData() {
    return prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
        listings: {
          select: { status: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  let categories: Awaited<ReturnType<typeof fetchCategoriesData>> = [];
  let dbUnavailable = false;
  try {
    if (!shouldSkipPrismaCalls()) {
      categories = await fetchCategoriesData();
      markPrismaHealthy();
    } else {
      dbUnavailable = true;
    }
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      dbUnavailable = true;
    } else {
      throw error;
    }
  }

  let recentRequests: {
    id: string;
    desiredName: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAtLabel: string;
  }[] = [];
  if (sessionUser && !dbUnavailable && !shouldSkipPrismaCalls()) {
    try {
      const requests = await prisma.categoryRequest.findMany({
        where: { requesterId: sessionUser.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          desiredName: true,
          status: true,
          createdAt: true,
        },
      });
      recentRequests = requests.map((request) => ({
        id: request.id,
        desiredName: request.desiredName,
        status: request.status,
        createdAtLabel: request.createdAt.toLocaleDateString(
          isMk ? "mk-MK" : "en-US",
        ),
      }));
      markPrismaHealthy();
    } catch (error) {
      if (
        !isMissingCategoryRequestTableError(error) &&
        !isPrismaConnectionError(error)
      ) {
        throw error;
      }
    }
  }

  const visibleCategories = categories.filter((category) =>
    query
      ? `${category.name} ${localizeCategoryName(category, locale)}`
          .toLowerCase()
          .includes(query)
      : true,
  );
  const totalActiveListings = categories.reduce(
    (sum, category) =>
      sum +
      category.listings.filter((listing) => listing.status === "ACTIVE").length,
    0,
  );
  const totalSubcategories = categories.reduce(
    (sum, category) => sum + category.children.length,
    0,
  );
  const popularCategories = POPULAR_CATEGORY_LOOKUP
    .map((item) =>
      categories.find(
        (category) =>
          category.slug === item.slug ||
          category.name.trim().toLowerCase() === item.fallbackName,
      ),
    )
    .filter((category): category is (typeof categories)[number] => Boolean(category))
    .filter(
      (category, index, arr) =>
        arr.findIndex((current) => current.id === category.id) === index,
    );
  const popularLabel = isMk ? "\u041f\u043e\u043f\u0443\u043b\u0430\u0440\u043d\u043e" : "Popular";

  return (
    <div className="space-y-7">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <h1 className="text-4xl font-black sm:text-5xl">{text.title}</h1>
            <p className="max-w-2xl text-muted-foreground">{text.subtitle}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {text.mainCategories}
              </p>
              <p className="text-2xl font-black">{categories.length}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {text.subcategories}
              </p>
              <p className="text-2xl font-black">{totalSubcategories}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {text.activeListings}
              </p>
              <p className="text-2xl font-black">{totalActiveListings}</p>
            </div>
          </div>

          <form method="get" className="max-w-xl">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                name="q"
                defaultValue={query}
                placeholder={text.searchPlaceholder}
                className="pl-9"
              />
            </div>
          </form>

          {popularCategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {popularLabel}
              </span>
              {popularCategories.map((category) => (
                <Link key={category.id} href={`/browse?cat=${category.id}`}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full px-3 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {localizeCategoryName(category, locale)}
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {dbUnavailable && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-4 text-sm text-foreground">
            {text.dbUnavailable}
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleCategories.map((category) => {
          const Icon =
            iconBySlug[category.slug as keyof typeof iconBySlug] || PackageOpen;
          const activeCount = category.listings.filter(
            (listing) => listing.status === "ACTIVE",
          ).length;
          const totalCount = category.listings.length;

          return (
            <Card
              key={category.id}
              className="relative h-full overflow-hidden border-border/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-25"
                  style={{
                    backgroundImage: `url("${getCategoryCover(category.slug || category.id)}")`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-background/92 via-background/85 to-background/78" />
              </div>

              <CardContent className="relative space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="inline-flex rounded-xl border border-border/70 bg-muted/20 p-2">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <h2 className="mt-2 text-xl font-bold">
                      {localizeCategoryName(category, locale)}
                    </h2>
                  </div>
                  <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {activeCount}/{totalCount}
                  </span>
                </div>

                {category.children.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/browse?sub=${child.id}`}
                        className="rounded-full border border-secondary/20 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:border-secondary/35 dark:bg-blue-500/10 dark:text-blue-300"
                      >
                        {localizeCategoryName(child, locale)}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-2">
                  <Link href={`/browse?cat=${category.id}`}>
                    <Button variant="outline" className="w-full">
                      {text.browse}
                    </Button>
                  </Link>
                  <Link href={`/dashboard?create=1&cat=${category.id}`}>
                    <Button className="w-full">{text.createHere}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="rounded-3xl border border-dashed border-border bg-card p-6 text-center">
        <h2 className="text-2xl font-bold">{text.missingCategory}</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          {text.missingCategoryText}
        </p>
        <Link href="#request-category" className="mt-4 inline-block">
          <Button variant="outline" className="gap-2">
            <PlusCircle size={16} />
            {text.openDashboardCategories}
          </Button>
        </Link>
        <Link
          href="/browse"
          className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          {text.continueBrowsing} <ArrowRight size={14} />
        </Link>
      </section>

      <section
        id="request-category"
        className="rounded-3xl border border-border/70 bg-card p-6"
      >
        <h2 className="text-2xl font-bold">{text.requestCategoryTitle}</h2>
        <p className="mt-2 text-muted-foreground">{text.requestCategoryDesc}</p>

        {requestSaved && (
          <Card className="mt-4 border-success/30 bg-success/10">
            <CardContent className="py-3 text-sm text-success">
              {text.requestSaved}
            </CardContent>
          </Card>
        )}
        {requestError && (
          <Card className="mt-4 border-warning/30 bg-warning/10">
            <CardContent className="py-3 text-sm text-foreground">
              {requestError || text.requestErrorGeneric}
            </CardContent>
          </Card>
        )}

        <div className="mt-4">
          {sessionUser ? (
            <CategoryRequestForm
              action={submitCategoryRequest}
              categories={categories.map((category) => ({
                id: category.id,
                name: category.name,
              }))}
              recentRequests={recentRequests}
              locale={locale}
            />
          ) : (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm">
              <p className="text-muted-foreground">{text.loginToRequest}</p>
              <Link
                href="/login?next=%2Fcategories%23request-category"
                className="mt-2 inline-block"
              >
                <Button size="sm">{text.login}</Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
