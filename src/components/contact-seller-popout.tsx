"use client";

import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  locale: "en" | "mk";
  iconOnly?: boolean;
  className?: string;
};

export function ContactSellerPopout({
  listingId,
  locale,
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
        messageSeller: "Порака до продавач",
        title: "Испрати порака до продавачот",
        name: "Име",
        phone: "Телефон",
        message: "Порака",
        cancel: "Откажи",
        send: "Испрати",
      }
    : {
        messageSeller: "Message seller",
        title: "Send a message to the seller",
        name: "Name",
        phone: "Phone",
        message: "Message",
        cancel: "Cancel",
        send: "Send",
      };

  return (
    <>
      <Button
        type="button"
        variant={iconOnly ? "outline" : "default"}
        size="sm"
        className={cn(iconOnly ? "h-8 w-8 p-0" : "gap-1.5", className)}
        onClick={() => setOpen(true)}
        aria-label={text.messageSeller}
      >
        <MessageCircle size={14} />
        {!iconOnly && <span>{text.messageSeller}</span>}
      </Button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-4 shadow-2xl">
            <h3 className="text-lg font-bold">{text.title}</h3>
            <form action="/api/contact-requests" method="post" className="mt-3 space-y-2">
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
                  required
                  minLength={2}
                  maxLength={400}
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  {text.cancel}
                </Button>
                <Button type="submit" className="gap-2">
                  <MessageCircle size={14} />
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
