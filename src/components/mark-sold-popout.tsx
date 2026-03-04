"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, ChevronDown } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { markListingSold } from "@/lib/actions/sales";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  locale: "en" | "mk";
  defaultPriceCents: number;
  iconOnly?: boolean;
  className?: string;
};

export function MarkSoldPopout({
  listingId,
  locale,
  defaultPriceCents,
  iconOnly = false,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const isMk = locale === "mk";
  const text = isMk
    ? {
        markSold: "Означи продадено",
        title: "Означи како продадено?",
        subtitle: "Огласот ќе биде тргнат од активни резултати.",
        optionalDetails: "Детали (опционално)",
        soldPrice: "Продажна цена",
        method: "Начин на плаќање",
        buyerName: "Купувач",
        buyerPhone: "Телефон на купувач",
        notes: "Белешка",
        cancel: "Откажи",
        confirm: "Означи продадено",
        methodCash: "Кеш",
        methodBank: "Банка",
        methodCard: "Картичка",
        methodOther: "Друго",
      }
    : {
        markSold: "Mark sold",
        title: "Mark as sold?",
        subtitle: "This listing will be removed from active results.",
        optionalDetails: "Add details (optional)",
        soldPrice: "Sold price",
        method: "Payment method",
        buyerName: "Buyer name",
        buyerPhone: "Buyer phone",
        notes: "Notes",
        cancel: "Cancel",
        confirm: "Mark sold",
        methodCash: "Cash",
        methodBank: "Bank",
        methodCard: "Card",
        methodOther: "Other",
      };
  const defaultPriceValue = useMemo(
    () => String(Math.round(defaultPriceCents) / 100),
    [defaultPriceCents],
  );

  return (
    <>
      <Button
        type="button"
        variant={iconOnly ? "outline" : "secondary"}
        size="sm"
        className={cn(iconOnly ? "h-8 w-8 p-0" : "gap-1.5", className)}
        onClick={() => setOpen(true)}
        aria-label={text.markSold}
      >
        <BadgeCheck size={14} />
        {!iconOnly && <span>{text.markSold}</span>}
      </Button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-4 shadow-2xl">
            <h3 className="text-lg font-bold">{text.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{text.subtitle}</p>

            <form action={markListingSold} className="mt-4 space-y-3">
              <input type="hidden" name="listingId" value={listingId} />
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="returnTo" value={returnTo} />

              <details className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold">
                  {text.optionalDetails}
                  <ChevronDown size={14} className="text-muted-foreground" />
                </summary>
                <div className="mt-3 space-y-2">
                  <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    <span>{text.soldPrice}</span>
                    <input
                      type="text"
                      name="soldPrice"
                      defaultValue={defaultPriceValue}
                      inputMode="decimal"
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                    />
                  </label>

                  <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    <span>{text.method}</span>
                    <select
                      name="method"
                      defaultValue=""
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                    >
                      <option value="">-</option>
                      <option value="CASH">{text.methodCash}</option>
                      <option value="BANK">{text.methodBank}</option>
                      <option value="CARD">{text.methodCard}</option>
                      <option value="OTHER">{text.methodOther}</option>
                    </select>
                  </label>

                  <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    <span>{text.buyerName}</span>
                    <input
                      type="text"
                      name="buyerName"
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                    />
                  </label>

                  <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    <span>{text.buyerPhone}</span>
                    <input
                      type="text"
                      name="buyerPhone"
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                    />
                  </label>

                  <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    <span>{text.notes}</span>
                    <textarea
                      name="notes"
                      maxLength={400}
                      className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                </div>
              </details>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  {text.cancel}
                </Button>
                <Button type="submit" className="gap-2">
                  <BadgeCheck size={14} />
                  {text.confirm}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
