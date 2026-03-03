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
  const routeGuide =
    "Website routes: /browse, /categories, /dashboard, /profile, /register, /login, /sell, /listing/[id], /seller/[id]. Prefer direct route links when user asks where to go.";

  if (pathname.startsWith("/sell")) {
    return {
      title: isMk ? "Асистент за продавачи" : "Seller Assistant",
      placeholder: isMk
        ? "Прашај за оглас, цена или избор на категорија..."
        : "Ask for listing help, pricing, or category tips...",
      context:
        "You are a seller assistant for a marketplace in Macedonia. Help users write clear listings, pick relevant category fields, and price competitively. " +
        routeGuide,
    };
  }

  if (pathname.startsWith("/browse") || pathname.startsWith("/categories")) {
    return {
      title: isMk ? "Асистент за купување" : "Buying Assistant",
      placeholder: isMk
        ? "Кажи ми што бараш и ќе ти предложам филтри..."
        : "Tell me what you need and I will suggest filters...",
      context:
        "You help buyers discover products fast in a marketplace. Ask clarifying questions, suggest filters, and keep answers concise. " +
        routeGuide,
    };
  }

  if (pathname.startsWith("/admin")) {
    return {
      title: isMk ? "Админ асистент" : "Admin Assistant",
      placeholder: isMk
        ? "Прашај за модерација или пазарна аналитика..."
        : "Ask for moderation or marketplace analytics help...",
      context:
        "You assist admins with moderation, risk flags, and marketplace analytics summaries. " +
        routeGuide,
    };
  }

  return {
    title: isMk ? "Помош за маркетплејс" : "Marketplace Help",
    placeholder: isMk
      ? "Треба помош? Прашај каде било на сајтот..."
      : "Need help? Ask anywhere on the site...",
    context:
      "You are a marketplace guide focused on safe buying and selling in Macedonia and worldwide listings. " +
      routeGuide,
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
