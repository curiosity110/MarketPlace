"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FolderPlus, X } from "lucide-react";
import { CategoryRequestForm } from "@/components/category-request-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { uiModal, uiTypography } from "@/components/ui/ui-patterns";

type Category = {
  id: string;
  name: string;
};

type CategoryRequestItem = {
  id: string;
  desiredName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAtLabel: string;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  recentRequests: CategoryRequestItem[];
  locale?: "en" | "mk";
  canRequest?: boolean;
  loginHref?: string;
  loginLabel?: string;
  loginHint?: string;
  buttonLabel?: string;
  openOnMount?: boolean;
  errorMessage?: string;
  successMessage?: string;
};

export function CategoryRequestPopout({
  action,
  categories,
  recentRequests,
  locale = "en",
  canRequest = false,
  loginHref = "/login?next=%2Fcategories%3Frequest%3D1",
  loginLabel,
  loginHint,
  buttonLabel,
  openOnMount = false,
  errorMessage,
  successMessage,
}: Props) {
  const isMk = locale === "mk";
  const text = isMk
    ? {
        requestCategory: "Побарај категорија",
        requestTitle: "Побарај нова категорија",
        requestDescription:
          "Ако недостига категорија, испрати барање и ќе се прегледа.",
        loginHint: "Најави се за да побараш нова категорија.",
        login: "Најава",
        close: "Затвори",
        closeRequestForm: "Затвори форма за барање категорија",
      }
    : {
        requestCategory: "Request category",
        requestTitle: "Request a new category",
        requestDescription:
          "If a category is missing, submit a request and we will review it.",
        loginHint: "Sign in to request a new category.",
        login: "Login",
        close: "Close",
        closeRequestForm: "Close request category form",
      };

  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const autoOpenDoneRef = useRef(false);

  function openPopout() {
    setIsOpen(true);
    requestAnimationFrame(() => setIsActive(true));
  }

  function closePopout() {
    setIsActive(false);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setIsOpen(false), 190);
  }

  useEffect(() => {
    if (!openOnMount || autoOpenDoneRef.current) return;
    autoOpenDoneRef.current = true;
    const timer = window.setTimeout(() => openPopout(), 0);
    return () => window.clearTimeout(timer);
  }, [openOnMount]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopout();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <>
      <Button type="button" variant="outline" onClick={openPopout} className="h-9 rounded-full px-4">
        <FolderPlus className="mr-1.5 h-4 w-4" />
        {buttonLabel || text.requestCategory}
      </Button>

      {isOpen && (
        <div
          className={`${uiModal.overlayTop} z-[80]`}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label={text.closeRequestForm}
            onClick={closePopout}
            className={`absolute inset-0 ${uiModal.backdrop} transition-opacity duration-200 ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          />

          <div
            className={`relative mx-auto flex max-h-[94vh] w-full max-w-3xl flex-col rounded-2xl border border-border/70 bg-background shadow-2xl transition-all duration-200 ${
              isActive
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-2 scale-[0.99] opacity-0"
            }`}
          >
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 sm:px-6">
              <div>
                <p className={uiTypography.sectionTitle}>{text.requestTitle}</p>
                <p className={uiTypography.muted}>
                  {text.requestDescription}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={closePopout} className="gap-1">
                <X size={15} />
                {text.close}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {successMessage && (
                <Card className="mb-4 border-success/30 bg-success/10">
                  <CardContent className="py-3 text-sm text-success">
                    {successMessage}
                  </CardContent>
                </Card>
              )}
              {errorMessage && (
                <Card className="mb-4 border-warning/30 bg-warning/10">
                  <CardContent className="py-3 text-sm text-foreground">
                    {errorMessage}
                  </CardContent>
                </Card>
              )}

              {canRequest ? (
                <CategoryRequestForm
                  action={action}
                  categories={categories}
                  recentRequests={recentRequests}
                  locale={locale}
                />
              ) : (
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm">
                  <p className="text-muted-foreground">
                    {loginHint || text.loginHint}
                  </p>
                  <Link href={loginHref} className="mt-2 inline-block">
                    <Button size="sm">{loginLabel || text.login}</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
