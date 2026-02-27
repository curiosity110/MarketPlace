import { Currency } from "@prisma/client";

export const MARKETPLACE_CURRENCIES: Currency[] = [Currency.MKD, Currency.EUR];

export function isMarketplaceCurrency(value: string): value is Currency {
  return value === Currency.EUR || value === Currency.MKD;
}

export function formatCurrencyFromCents(amountCents: number, currency: Currency) {
  const locale = currency === Currency.MKD ? "mk-MK" : "de-DE";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amountCents / 100));
}

export function convertByStaticRate(amountCents: number, from: Currency, to: Currency) {
  if (from === to) return amountCents;

  const EUR_TO_MKD = 61.5;
  if (from === Currency.EUR && to === Currency.MKD) {
    return Math.round(amountCents * EUR_TO_MKD);
  }
  return Math.round(amountCents / EUR_TO_MKD);
}
