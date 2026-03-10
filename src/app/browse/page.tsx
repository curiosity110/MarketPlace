import type { Metadata } from "next";
import { BrowseFeaturePage } from "@/features/browse";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Browse Listings | MarketPlace MKD",
  description:
    "Search and browse cars, electronics, real estate, fashion, jobs and more in Macedonia. Buy and sell securely.",
};

export default BrowseFeaturePage;
