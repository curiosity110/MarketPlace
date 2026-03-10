import type { Locale } from "@/lib/i18n";
import type { HomePageContent } from "@/components/home/home.types";

export function getHomePageContent(
  locale: Locale,
  createPayPerHref: string,
  createSubscriptionHref: string,
): HomePageContent {
  const isMk = locale === "mk";
  const text = isMk
    ? {
        heroBadge: "Изградено за Македонија. Подготвено за глобален пазар.",
        heroTitleA: "Купувај и продавај брзо",
        heroTitleB: "во јасен маркетплејс",
        heroDesc:
          "Удобно на телефон и десктоп, со фокус на читливост и паметна помош низ целиот сајт.",
        explore: "Пребарај бесплатно огласи",
        startSelling: "Започни бесплатно со продавање",
        smartAssistance: "Паметна помош",
        smartAssistanceDesc: "Пиши подобри огласи и добиј брз совет.",
        saferTrading: "Побезбедно тргување",
        saferTradingDesc: "Модерација и пријавување за поголема доверба.",
        localGlobal: "Локално + глобално",
        localGlobalDesc: "Продавај во Македонија и објавувај глобално.",
        popularCategories: "Популарни категории",
        whatBuyNow: "Популарни категории",
        listings: "огласи",
        viewAllCategories: "Види ги сите категории",
        dbUnavailable:
          "Базата е привремено недостапна. Прикажуваме ограничена содржина.",
        sellerPricing: "Цени за продавачи",
        sellerPricingDesc:
          "Едноставно: 220 ден. за еден оглас (30 дена), или 1,650 ден. месечна претплата.",
        recommended: "Препорачано",
        latestListings: "Најнови огласи",
        latestListingsDesc: "Свежи огласи од продавачи од Македонија и пошироко.",
        noListings: "Сè уште нема активни огласи. Објави го првиот.",
        listItem: "Објави производ",
        browseAll: "Пребарај ги сите огласи",
      }
    : {
        heroBadge: "Built for Macedonia. Ready for worldwide reach.",
        heroTitleA: "Buy and Sell Fast ",
        heroTitleB: "in a Clear Marketplace",
        heroDesc:
          "Comfortable on phone and desktop, focused on readability, and powered by smart help across the full site.",
        explore: "Explore Listings",
        startSelling: "Start Selling",
        smartAssistance: "Smart assistant",
        smartAssistanceDesc: "Write stronger listings and get instant advice.",
        saferTrading: "Safer Trading",
        saferTradingDesc: "Moderation tools and reporting flow for trust.",
        localGlobal: "Local + Global",
        localGlobalDesc: "Sell in Macedonia and publish globally.",
        popularCategories: "Popular categories",
        whatBuyNow: "Popular Categories",
        listings: "listings",
        viewAllCategories: "View all categories",
        dbUnavailable:
          "Marketplace database is temporarily unreachable. Showing limited content.",
        sellerPricing: "Seller Pricing",
        sellerPricingDesc:
          "Simple model: 220 ден. one listing for 30 days, or 1,650 ден. monthly subscription.",
        recommended: "Recommended",
        latestListings: "Latest Listings",
        latestListingsDesc: "Fresh items from sellers in Macedonia and beyond.",
        noListings: "No active listings yet. Create the first one.",
        listItem: "List an Item",
        browseAll: "Browse all listings",
      };

  const pricingPlans = isMk
    ? [
        {
          name: "Плаќање по оглас",
          price: "220 ден.",
          cadence: "за 30 дена",
          description: "Одлично за повремени продавачи",
          bullets: [
            "Еден активен оглас за 30 дена",
            "Паметен асистент за пишување",
            "Фотографии и динамични полиња",
            "Основни увиди за продавач",
          ],
          cta: "Почни со 220 ден.",
          href: createPayPerHref,
          featured: false,
        },
        {
          name: "Претплата за продавач",
          price: "1,650 ден.",
          cadence: "месечно",
          description: "Најдобро за активни продавници и препродавачи",
          bullets: [
            "Неограничени активни огласи",
            "Приоритетна поддршка",
            "Напредна аналитика",
            "Поголема видливост",
          ],
          cta: "Претплати се за 1,650 ден.",
          href: createSubscriptionHref,
          featured: true,
        },
      ]
    : [
        {
          name: "Pay Per Listing",
          price: "220 ден.",
          cadence: "for 30 days",
          description: "Great for occasional sellers",
          bullets: [
            "One active listing for 30 days",
            "Smart writing assistant",
            "Photos and dynamic category fields",
            "Basic seller insights",
          ],
          cta: "Start with 220 ден.",
          href: createPayPerHref,
          featured: false,
        },
        {
          name: "Seller Subscription",
          price: "1,650 ден.",
          cadence: "per month",
          description: "Best for active stores and resellers",
          bullets: [
            "Unlimited active listings",
            "Priority marketplace support",
            "Advanced analytics dashboard",
            "Higher visibility options",
          ],
          cta: "Subscribe for 1,650 ден.",
          href: createSubscriptionHref,
          featured: true,
        },
      ];

  const quickTitle = isMk ? "Брзо пребарување" : "Hot right now";
  const quickItems = [
    {
      id: "cars-cheap",
      label: isMk ? "Авта" : "Cars",
      hint: isMk ? "до 3k EUR" : "under 3k EUR",
      href: "/browse?catSlug=cars&max=3000&sort=price_asc",
    },
    {
      id: "cars-new",
      label: isMk ? "Авта" : "Cars",
      hint: isMk ? "денес" : "new today",
      href: "/browse?catSlug=cars&sort=new",
    },
    {
      id: "jobs-remote",
      label: isMk ? "Работа" : "Jobs",
      hint: isMk ? "remote" : "remote",
      href: "/browse?catSlug=jobs&work=remote&sort=new",
    },
    {
      id: "rent-cheap",
      label: isMk ? "Кирија" : "Rent",
      hint: isMk ? "до 200 EUR" : "under 200 EUR",
      href: "/browse?catSlug=real-estate&deal=rent&max=200&sort=price_asc",
    },
    {
      id: "phones-iphone",
      label: isMk ? "Телефони" : "Phones",
      hint: "iPhone",
      href: "/browse?catSlug=phones&q=iphone&sort=new",
    },
    {
      id: "gaming",
      label: isMk ? "Гејминг" : "Gaming",
      hint: isMk ? "PC/PS" : "PC/PS",
      href: "/browse?catSlug=electronics&q=gaming&sort=new",
    },
    {
      id: "most-viewed",
      label: isMk ? "Тренд" : "Trending",
      hint: isMk ? "најгледано" : "most viewed",
      href: "/browse?sort=views",
    },
  ];

  return {
    locale,
    text,
    pricingPlans,
    quickTitle,
    quickItems,
  };
}
