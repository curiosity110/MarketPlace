"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { BadgeCheck, ChevronDown } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { markListingSold } from "@/lib/actions/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/modal-shell";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

      <ModalShell
        open={open}
        onClose={() => setOpen(false)}
        closeLabel={text.cancel}
        className="max-w-md"
      >
        <div className="p-4 sm:p-5">
          <h3 className="text-lg font-semibold">{text.title}</h3>
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
                  <Input
                    type="text"
                    name="soldPrice"
                    defaultValue={defaultPriceValue}
                    inputMode="decimal"
                  />
                </label>

                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  <span>{text.method}</span>
                  <Select name="method" defaultValue="">
                    <option value="">-</option>
                    <option value="CASH">{text.methodCash}</option>
                    <option value="BANK">{text.methodBank}</option>
                    <option value="CARD">{text.methodCard}</option>
                    <option value="OTHER">{text.methodOther}</option>
                  </Select>
                </label>

                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  <span>{text.buyerName}</span>
                  <Input type="text" name="buyerName" />
                </label>

                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  <span>{text.buyerPhone}</span>
                  <Input type="text" name="buyerPhone" />
                </label>

                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  <span>{text.notes}</span>
                  <Textarea name="notes" maxLength={400} className="min-h-20" />
                </label>
              </div>
            </details>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {text.cancel}
              </Button>
              <MarkSoldSubmitButton label={text.confirm} />
            </div>
          </form>
        </div>
      </ModalShell>
    </>
  );
}

function MarkSoldSubmitButton({
  label,
}: {
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="gap-2" disabled={pending}>
      <BadgeCheck size={14} />
      {label}
    </Button>
  );
}
