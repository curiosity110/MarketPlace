import type { CreateFieldErrorKey } from "@/components/create-listing/state/wizard-form.types";

export function inferCreateErrorStep(field?: CreateFieldErrorKey, message?: string) {
  if (field === "title" || field === "categoryId" || field === "price") return 2;
  if (field === "cityId" || field === "phone") return 3;
  if (!message) return null;
  if (/(title|наслов|category|категори|price|цена)/i.test(message)) return 2;
  if (/(city|град|phone|телефон)/i.test(message)) return 3;
  return null;
}

export function inferCreateErrorField(message: string | null, explicit?: string | null) {
  if (explicit === "title") return "title" as const;
  if (explicit === "categoryId") return "categoryId" as const;
  if (explicit === "cityId") return "cityId" as const;
  if (explicit === "price") return "price" as const;
  if (explicit === "phone") return "phone" as const;
  if (!message) return "general" as const;
  if (/(phone|телефон)/i.test(message)) return "phone" as const;
  if (/(title|наслов)/i.test(message)) return "title" as const;
  if (/(price|цена)/i.test(message)) return "price" as const;
  if (/(category|категори)/i.test(message)) return "categoryId" as const;
  if (/(city|град)/i.test(message)) return "cityId" as const;
  return "general" as const;
}

export function appendUniqueTokenToTitle(previous: string, value: string) {
  const token = value.trim();
  if (!token) return previous;
  const current = previous.trim();
  if (!current) return token;
  const hasToken = new RegExp(
    `\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    "i",
  ).test(current);
  if (hasToken) return current;
  return `${current} ${token}`.replace(/\s+/g, " ").trim();
}
