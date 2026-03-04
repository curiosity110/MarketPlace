"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteSavedSearch } from "@/lib/actions/saved-searches";
import { Button } from "@/components/ui/button";

type SavedSearchListItem = {
  id: string;
  name: string | null;
  href: string;
  createdAtLabel: string;
};

type Props = {
  locale: "en" | "mk";
  items: SavedSearchListItem[];
};

export function SavedSearchesList({ locale, items }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isMk = locale === "mk";
  const text = isMk
    ? {
        open: "Отвори",
        delete: "Избриши",
        unnamed: "Зачувано пребарување",
      }
    : {
        open: "Open",
        delete: "Delete",
        unnamed: "Saved search",
      };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-card p-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {item.name?.trim() || text.unnamed}
            </p>
            <p className="text-xs text-muted-foreground">{item.createdAtLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={item.href}>
              <Button type="button" size="sm" variant="outline">
                {text.open}
              </Button>
            </Link>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isPending}
              className="gap-1 text-destructive hover:text-destructive"
              onClick={() => {
                setDeletingId(item.id);
                startTransition(async () => {
                  await deleteSavedSearch(item.id);
                  setDeletingId(null);
                  router.refresh();
                });
              }}
            >
              {isPending && deletingId === item.id ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
              {text.delete}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
