export type * from "@/features/browse/browse-page.types";
export type {
  BrowseActiveFilterChip,
  BrowseCarMake,
  BrowseCity,
  BrowseFilterState,
  BrowseParentCategory,
  BrowseSort,
  BrowseTemplate,
} from "@/components/browse-filters.types";

export type BrowsePageText = {
  title: string;
  support: string;
  resultsLabel: string;
  filtersLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  sortLabel: string;
  resetLabel: string;
  clearAllLabel: string;
  removeFilterLabel: string;
  page: string;
  of: string;
  previous: string;
  next: string;
  noMatch: string;
  noListingsYet: string;
  firstList: string;
  popularCategories: string;
  tryCategoriesLabel: string;
  dbUnavailable: string;
};
