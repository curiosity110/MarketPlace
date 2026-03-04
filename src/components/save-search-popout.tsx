"use client";

import { useState, useTransition } from "react";
import { BookmarkPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveSearch } from "@/lib/actions/saved-searches";
import { Button } from "@/components/ui/button";

type Props = {
  locale: "en" | "mk";
  query: Record<string, string>;
};

export function SaveSearchPopout({ locale, query }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isMk = locale === "mk";
  const text = isMk
    ? {
        saveSearch: "Зачувај пребарување",
        title: "Зачувај пребарување",
        subtitle: "Внеси име (опционално) за полесно отворање подоцна.",
        nameSearch: "Име на пребарување",
        namePlaceholder: "Пример: Коли до 5.000€",
        cancel: "Откажи",
        save: "Зачувај",
      }
    : {
        saveSearch: "Save search",
        title: "Save search",
        subtitle: "Optional: add a short name so it is easier to find later.",
        nameSearch: "Search name",
        namePlaceholder: "Example: Cars under €5k",
        cancel: "Cancel",
        save: "Save",
      };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => {
          setResultMessage(null);
          setOpen(true);
        }}
      >
        <BookmarkPlus size={15} />
        {text.saveSearch}
      </Button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-4 shadow-2xl">
            <h3 className="text-lg font-bold">{text.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{text.subtitle}</p>

            <div className="mt-3 space-y-1">
              <label
                htmlFor="saved-search-name"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {text.nameSearch}
              </label>
              <input
                id="saved-search-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                placeholder={text.namePlaceholder}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              />
            </div>

            {resultMessage ? (
              <p className="mt-3 text-sm text-muted-foreground">{resultMessage}</p>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {text.cancel}
              </Button>
              <Button
                type="button"
                className="gap-2"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await saveSearch({
                      query,
                      name,
                      locale,
                    });
                    setResultMessage(result.message);
                    if (result.ok) {
                      setOpen(false);
                      setName("");
                      router.refresh();
                    }
                  });
                }}
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                {text.save}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
