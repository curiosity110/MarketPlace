"use client";

import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/modal-shell";
import { Textarea } from "@/components/ui/textarea";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        className={cn(iconOnly ? "h-8 w-8 p-0" : "max-w-full min-w-0 gap-1.5", className)}
        onClick={() => {
          setIsSubmitting(false);
          setOpen(true);
        }}
        aria-label={text.messageSeller}
      >
        <MessageCircle size={14} />
        {!iconOnly && <span className="truncate">{text.messageSeller}</span>}
      </Button>

      <ModalShell
        open={open}
        onClose={() => {
          if (isSubmitting) return;
          setOpen(false);
        }}
        closeLabel={text.cancel}
        className="w-full max-w-md"
      >
        <div className="max-w-full min-w-0 overflow-x-hidden p-4 sm:p-5">
          <h3 className="break-words text-lg font-semibold tracking-tight [overflow-wrap:anywhere]">
            {text.title}
          </h3>
          <form
            action="/api/contact-requests"
            method="post"
            className="mt-4 max-w-full min-w-0 space-y-3"
            onSubmit={() => setIsSubmitting(true)}
          >
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
              <Textarea name="message" required minLength={2} maxLength={400} />
            </label>

            <div className="flex max-w-full min-w-0 flex-wrap justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="min-w-0"
                disabled={isSubmitting}
              >
                {text.cancel}
              </Button>
              <Button type="submit" className="min-w-0 gap-2" disabled={isSubmitting}>
                <MessageCircle size={14} />
                <span className="truncate">{text.send}</span>
              </Button>
            </div>
          </form>
        </div>
      </ModalShell>
    </>
  );
}
