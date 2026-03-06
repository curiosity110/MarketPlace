"use client";

import { useMemo, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { createPurchaseRequest } from "@/lib/actions/purchase-requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/modal-shell";
import { Textarea } from "@/components/ui/textarea";
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

      <ModalShell
        open={open}
        onClose={() => setOpen(false)}
        closeLabel={text.cancel}
        className="max-w-md"
      >
        <div className="p-4 sm:p-5">
          <h3 className="text-lg font-semibold">{text.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{text.subtitle}</p>

          <form action={createPurchaseRequest} className="mt-3 space-y-3">
            <input type="hidden" name="listingId" value={listingId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="locale" value={locale} />

            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              <span>{text.name}</span>
              <Input type="text" name="buyerName" maxLength={80} />
            </label>

            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              <span>{text.phone}</span>
              <Input type="text" name="buyerPhone" maxLength={40} />
            </label>

            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              <span>{text.message}</span>
              <Textarea name="message" maxLength={400} className="min-h-20" />
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
      </ModalShell>
    </>
  );
}
