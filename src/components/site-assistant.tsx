"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { AIHelper } from "@/components/ai-helper";

type AssistantConfig = {
  title: string;
  placeholder: string;
  context: string;
};

function getConfig(pathname: string): AssistantConfig {
  if (pathname.startsWith("/sell")) {
    return {
      title: "Seller Copilot",
      placeholder: "Ask for listing help, pricing, or category tips...",
      context:
        "You are a seller assistant for a marketplace in Macedonia. Help users write clear listings, pick relevant category fields, and price competitively.",
    };
  }

  if (pathname.startsWith("/browse") || pathname.startsWith("/categories")) {
    return {
      title: "Buying Assistant",
      placeholder: "Tell me what you need and I will refine your search...",
      context:
        "You help buyers discover products fast in a marketplace. Ask clarifying questions, suggest filters, and keep answers concise.",
    };
  }

  if (pathname.startsWith("/admin")) {
    return {
      title: "Admin Analyst",
      placeholder: "Ask for moderation or marketplace analytics help...",
      context:
        "You assist admins with moderation, risk flags, and marketplace analytics summaries.",
    };
  }

  return {
    title: "Marketplace GPT Help",
    placeholder: "Need help? Ask anywhere on the site...",
    context:
      "You are a marketplace guide focused on safe buying and selling in Macedonia and worldwide listings.",
  };
}

export function SiteAssistant() {
  const pathname = usePathname();
  const config = useMemo(() => getConfig(pathname), [pathname]);

  return (
    <AIHelper
      context={config.context}
      placeholder={config.placeholder}
      title={config.title}
    />
  );
}
