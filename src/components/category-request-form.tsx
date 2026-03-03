"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { localizeCategoryName } from "@/lib/category-label";

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
};

const STORAGE_KEY = "mkd:category-request-form:v1";

export function CategoryRequestForm({
  action,
  categories,
  recentRequests,
  locale = "en",
}: Props) {
  const isMk = locale === "mk";
  const text = isMk
    ? {
        categoryName: "Име на категорија",
        categoryNamePlaceholder: "Пример: Индустриска опрема",
        closestParent: "Најблиска родителска категорија",
        noParent: "Без родител (горно ниво)",
        reasonDetails: "Причина / детали",
        reasonPlaceholder: "Што треба да може да се пребарува во оваа категорија?",
        submitRequest: "Поднеси барање за категорија",
        autosaveHint: "Оваа форма се зачувува локално додека не ја поднесеш.",
        latestRequests: "Твои последни барања",
        statusPending: "На чекање",
        statusApproved: "Одобрено",
        statusRejected: "Одбиено",
      }
    : {
        categoryName: "Category name",
        categoryNamePlaceholder: "Example: Industrial Equipment",
        closestParent: "Closest parent category",
        noParent: "No parent (top-level)",
        reasonDetails: "Reason / details",
        reasonPlaceholder: "What should be searchable in this category?",
        submitRequest: "Submit category request",
        autosaveHint: "This form auto-saves locally until you submit.",
        latestRequests: "Your latest requests",
        statusPending: "Pending",
        statusApproved: "Approved",
        statusRejected: "Rejected",
      };
  const [desiredName, setDesiredName] = useState("");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setIsReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        desiredName?: string;
        parentId?: string;
        description?: string;
      };

      setDesiredName(parsed.desiredName || "");
      setDescription(parsed.description || "");

      const safeParentId =
        parsed.parentId && categories.some((category) => category.id === parsed.parentId)
          ? parsed.parentId
          : "";
      setParentId(safeParentId);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsReady(true);
    }
  }, [categories]);

  useEffect(() => {
    if (!isReady) return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        desiredName,
        parentId,
        description,
      }),
    );
  }, [description, desiredName, isReady, parentId]);

  const canSubmit = useMemo(() => desiredName.trim().length >= 3, [desiredName]);
  const statusLabelByValue = {
    PENDING: text.statusPending,
    APPROVED: text.statusApproved,
    REJECTED: text.statusRejected,
  } as const;

  return (
    <div className="space-y-4">
      <form
        action={action}
        className="grid gap-3 md:grid-cols-2"
        onSubmit={() => {
          window.localStorage.removeItem(STORAGE_KEY);
        }}
      >
        <label className="space-y-1 md:col-span-1">
          <span className="text-sm font-medium">{text.categoryName}</span>
          <input
            name="desiredName"
            required
            minLength={3}
            value={desiredName}
            onChange={(event) => setDesiredName(event.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-input px-3 text-sm"
            placeholder={text.categoryNamePlaceholder}
          />
        </label>

        <label className="space-y-1 md:col-span-1">
          <span className="text-sm font-medium">{text.closestParent}</span>
          <select
            name="parentId"
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-input px-3 text-sm"
          >
            <option value="">{text.noParent}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {localizeCategoryName({ name: category.name }, locale)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium">{text.reasonDetails}</span>
          <textarea
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-24 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm"
            placeholder={text.reasonPlaceholder}
          />
        </label>

        <Button className="md:col-span-2" type="submit" disabled={!canSubmit}>
          {text.submitRequest}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        {text.autosaveHint}
      </p>

      {recentRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">{text.latestRequests}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {recentRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm"
              >
                <p className="font-semibold">{request.desiredName}</p>
                <p className="text-xs text-muted-foreground">{request.createdAtLabel}</p>
                <Badge
                  className="mt-2"
                  variant={
                    request.status === "APPROVED"
                      ? "success"
                      : request.status === "REJECTED"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {statusLabelByValue[request.status]}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
