"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { AIHelper } from "@/components/ai-helper";

type AssistantConfig = {
  title: string;
  placeholder: string;
  context: string;
};

function getConfig(pathname: string, locale: "en" | "mk"): AssistantConfig {
  const isMk = locale === "mk";
  if (pathname.startsWith("/sell")) {
    return {
      title: isMk ? "Продавачки копилот" : "Seller Copilot",
      placeholder: isMk
        ? "Прашај за помош со оглас, цена или совети за категорија..."
        : "Ask for listing help, pricing, or category tips...",
      context:
        "You are a seller assistant for a marketplace in Macedonia. Help users write clear listings, pick relevant category fields, and price competitively.",
    };
  }

  if (pathname.startsWith("/browse") || pathname.startsWith("/categories")) {
    return {
      title: isMk ? "Купувачки асистент" : "Buying Assistant",
      placeholder: isMk
        ? "Кажи ми што бараш и ќе го прецизирам пребарувањето..."
        : "Tell me what you need and I will refine your search...",
      context:
        "You help buyers discover products fast in a marketplace. Ask clarifying questions, suggest filters, and keep answers concise.",
    };
  }

  if (pathname.startsWith("/admin")) {
    return {
      title: isMk ? "Админ аналитичар" : "Admin Analyst",
      placeholder: isMk
        ? "Прашај за модерација или аналитика на маркетплејс..."
        : "Ask for moderation or marketplace analytics help...",
      context:
        "You assist admins with moderation, risk flags, and marketplace analytics summaries.",
    };
  }

  return {
    title: isMk ? "GPT помош за маркетплејс" : "Marketplace GPT Help",
    placeholder: isMk
      ? "Треба помош? Прашај каде било на сајтот..."
      : "Need help? Ask anywhere on the site...",
    context:
      "You are a marketplace guide focused on safe buying and selling in Macedonia and worldwide listings.",
  };
}

export function SiteAssistant({ locale = "en" }: { locale?: "en" | "mk" }) {
  const pathname = usePathname();
  const config = useMemo(() => getConfig(pathname, locale), [pathname, locale]);

  return (
    <AIHelper
      context={config.context}
      placeholder={config.placeholder}
      title={config.title}
      locale={locale}
    />
  );
}
