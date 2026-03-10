import type { Metadata } from "next";
import { HomePage } from "@/features/home";

export const metadata: Metadata = {
  title: "MarketPlace MKD | Buy and Sell Fast in Macedonia",
  description:
    "Buy and sell cars, electronics, real estate, fashion, jobs and more. Macedonia's marketplace with smart search and secure trading.",
};

export default async function Home() {
  return <HomePage />;
}
