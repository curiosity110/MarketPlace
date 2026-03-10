"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { CreateListingTemplate } from "@/components/create-listing/types";

const OPEN_EVENT_NAME = "mkd:open-create-modal";

type CreateAction = (formData: FormData) => Promise<unknown>;

type CreateModalMeta = {
  categories: { id: string; name: string; slug: string; parentId?: string | null }[];
  cities: { id: string; name: string }[];
  templatesByCategory: Record<
    string,
    { id: string; key: string; label: string; type: string; required: boolean; order: number; options: string[] }[]
  >;
  publishLabel: string;
  paymentProvider: "none" | "stripe-dummy";
  showPlanSelector: boolean;
  initial: Record<string, unknown>;
  locale: "en" | "mk";
};

const FALLBACK_META: CreateModalMeta = {
  categories: [],
  cities: [],
  templatesByCategory: {},
  publishLabel: "Publish listing",
  paymentProvider: "none",
  showPlanSelector: false,
  initial: { currency: "MKD" },
  locale: "en",
};

const CreateListingPopout = dynamic(
  () =>
    import("@/features/create-listing/create-listing-popout").then(
      (m) => m.CreateListingPopout,
    ),
  { ssr: false },
);

type Props = { action: CreateAction };

export function CreateListingModalRoot({ action }: Props) {
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState<CreateModalMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAndOpen = useCallback(async () => {
    setError(null);
    setOpen(true);
    setMeta(FALLBACK_META);
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch("/api/create-modal-meta", {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      if (!res.ok) {
        setError("Failed to load form");
        return;
      }
      const data = (await res.json()) as CreateModalMeta;
      setMeta(data);
    } catch {
      window.clearTimeout(timeoutId);
      setError("Failed to load form");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      void loadAndOpen();
    };
    window.addEventListener(OPEN_EVENT_NAME, handleOpen);
    return () => window.removeEventListener(OPEN_EVENT_NAME, handleOpen);
  }, [loadAndOpen]);

  useEffect(() => {
    const handleSellLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        const shouldOpen = url.pathname === "/sell" || url.searchParams.get("create") === "1";
        if (!shouldOpen) return;
        event.preventDefault();
        void loadAndOpen();
      } catch {
        // ignore
      }
    };
    document.addEventListener("click", handleSellLinkClick, true);
    return () => document.removeEventListener("click", handleSellLinkClick, true);
  }, [loadAndOpen]);

  const handleOpenChange = useCallback((next: boolean) => {
    if (!next) {
      setOpen(false);
      setError(null);
      window.setTimeout(() => setMeta(null), 350);
    }
  }, []);

  if (!open && !meta) return null;

  if (error) {
    return (
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50"
        role="dialog"
        aria-modal="true"
      >
        <div className="rounded-2xl bg-background px-6 py-8 shadow-xl text-center">
          <p className="text-sm text-destructive">{error}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
                setMeta(null);
              }}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                void loadAndOpen();
              }}
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!meta) return null;

  if (loading && meta.categories.length === 0) {
    return (
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50"
        role="dialog"
        aria-modal="true"
        aria-busy
      >
        <div className="rounded-2xl bg-background px-8 py-10 shadow-xl">
          <p className="text-sm text-muted-foreground">Loading…</p>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setMeta(null);
              setLoading(false);
            }}
            className="mt-4 text-sm text-muted-foreground underline hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <CreateListingPopout
      mode="button"
      hideTrigger
      open={open}
      onOpenChange={handleOpenChange}
      action={action}
      categories={meta.categories}
      cities={meta.cities}
      templatesByCategory={meta.templatesByCategory as Record<string, CreateListingTemplate[]>}
      allowDraft={false}
      showPlanSelector={meta.showPlanSelector}
      publishLabel={meta.publishLabel}
      paymentProvider={meta.paymentProvider}
      initial={meta.initial as never}
      locale={meta.locale}
      onClose={() => handleOpenChange(false)}
    />
  );
}
