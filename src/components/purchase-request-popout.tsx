"use client";

import { useMemo, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { createPurchaseRequest } from "@/lib/actions/purchase-requests";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  locale: "en" | "mk";
  className?: string;
};

export function PurchaseRequestPopout({ listingId, locale, className }: Props) {
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
        trigger: "Го купив ова",
        title: "Потврди купување",
        subtitle: "Ова ќе испрати барање до продавачот за потврда.",
        name: "Име",
        phone: "Телефон",
        message: "Порака (опционално)",
        cancel: "Откажи",
        send: "Испрати барање",
      }
    : {
        trigger: "I bought this",
        title: "Confirm purchase",
        subtitle: "This sends a request to the seller for confirmation.",
        name: "Name",
        phone: "Phone",
        message: "Message (optional)",
        cancel: "Cancel",
        send: "Send request",
      };

  return (
    <>
      <button
        type="button"
        className={cn("text-xs font-medium text-primary hover:underline", className)}
        onClick={() => setOpen(true)}
      >
        {text.trigger}
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-4 shadow-2xl">
            <h3 className="text-lg font-bold">{text.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{text.subtitle}</p>

            <form action={createPurchaseRequest} className="mt-3 space-y-2">
              <input type="hidden" name="listingId" value={listingId} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="locale" value={locale} />

              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                <span>{text.name}</span>
                <input
                  type="text"
                  name="buyerName"
                  maxLength={80}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                />
              </label>

              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                <span>{text.phone}</span>
                <input
                  type="text"
                  name="buyerPhone"
                  maxLength={40}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                />
              </label>

              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                <span>{text.message}</span>
                <textarea
                  name="message"
                  maxLength={400}
                  className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  {text.cancel}
                </Button>
                <Button type="submit" className="gap-2">
                  <BadgeCheck size={14} />
                  {text.send}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
