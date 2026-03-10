"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

const AIHelper = dynamic(
  () => import("@/components/ai-helper").then((mod) => mod.AIHelper),
  { ssr: false },
);

type AssistantConfig = {
  title: string;
  placeholder: string;
  context: string;
};

function getConfig(pathname: string, locale: "en" | "mk"): AssistantConfig {
  const isMk = locale === "mk";
  const routeGuide =
    "Website routes: / (landing), /browse, /categories, /dashboard, /profile, /register, /login, /sell, /listing/[id], /seller/[id]. Authenticated users visiting / are redirected to /dashboard. Prefer direct route links when user asks where to go.";

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
  const [shouldLoad, setShouldLoad] = useState(false);

  const openLabel =
    locale === "mk" ? "Отвори асистент за маркетплејс" : "Open marketplace assistant";
  const askLabel = locale === "mk" ? "Прашај асистент" : "Ask assistant";

  useEffect(() => {
    function openAssistant() {
      setShouldLoad(true);
    }

    window.addEventListener("mkd:open-assistant", openAssistant);
    return () => {
      window.removeEventListener("mkd:open-assistant", openAssistant);
    };
  }, []);

  if (!shouldLoad) {
    return (
      <button
        type="button"
        onClick={() => setShouldLoad(true)}
        className="fixed right-3 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/55 bg-background/96 text-foreground shadow-[0_14px_28px_-24px_rgba(15,23,42,0.34)] backdrop-blur-md transition-colors hover:bg-muted sm:bottom-6 sm:left-auto sm:right-6 sm:z-40 sm:h-auto sm:w-auto sm:gap-2 sm:border-primary/30 sm:bg-gradient-to-r sm:from-orange-500 sm:to-blue-600 sm:px-4 sm:py-3 sm:text-sm sm:font-semibold sm:text-white sm:shadow-lg sm:hover:-translate-y-0.5 sm:hover:shadow-xl"
        style={{ bottom: "calc(var(--app-mobile-fab-offset) + env(safe-area-inset-bottom, 0px))" }}
        aria-label={openLabel}
      >
        <MessageCircle size={16} />
        <span className="hidden md:inline">{askLabel}</span>
      </button>
    );
  }

  return (
    <AIHelper
      context={config.context}
      placeholder={config.placeholder}
      title={config.title}
      locale={locale}
      defaultOpen
    />
  );
}
