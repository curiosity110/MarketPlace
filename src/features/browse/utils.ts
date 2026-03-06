import type { BrowsePageText } from "@/features/browse/types";

export function getBrowsePageText(locale: "en" | "mk"): BrowsePageText {
  if (locale === "mk") {
    return {
      title: "Сите огласи",
      support: "Пребарај побрзо со едно поле за пребарување и чисти филтри кога ти требаат.",
      resultsLabel: "резултати",
      filtersLabel: "Филтри",
      searchLabel: "Пребарување",
      searchPlaceholder: "Наслов, модел, клучен збор...",
      sortLabel: "Подреди",
      resetLabel: "Ресетирај",
      clearAllLabel: "Исчисти сè",
      removeFilterLabel: "Отстрани филтер",
      page: "Страница",
      of: "од",
      previous: "Претходна",
      next: "Следна",
      noMatch: "Нема огласи што одговараат на твоите филтри.",
      noListingsYet: "Сè уште нема огласи. Биди прв што ќе објави.",
      firstList: "Биди прв што ќе го објави овој производ",
      popularCategories: "Популарни категории",
      dbUnavailable:
        "Пребарувањето е привремено недостапно поради проблем со базата.",
    };
  }

  return {
    title: "All listings",
    support: "Search first, open filters only when needed, and keep the results in focus.",
    resultsLabel: "results",
    filtersLabel: "Filters",
    searchLabel: "Search",
    searchPlaceholder: "Title, model, keyword...",
    sortLabel: "Sort",
    resetLabel: "Reset",
    clearAllLabel: "Clear all",
    removeFilterLabel: "Remove filter",
    page: "Page",
    of: "of",
    previous: "Previous",
    next: "Next",
    noMatch: "No listings match your filters.",
    noListingsYet: "No listings yet. Be the first to post.",
    firstList: "Be the first to list this item",
    popularCategories: "Popular categories",
    dbUnavailable:
      "Browse data is temporarily unavailable because the database is unreachable.",
  };
}
