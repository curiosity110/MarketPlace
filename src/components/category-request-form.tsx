"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
};

const STORAGE_KEY = "mkd:category-request-form:v1";

export function CategoryRequestForm({ action, categories, recentRequests }: Props) {
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
          <span className="text-sm font-medium">Category name</span>
          <input
            name="desiredName"
            required
            minLength={3}
            value={desiredName}
            onChange={(event) => setDesiredName(event.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-input px-3 text-sm"
            placeholder="Example: Industrial Equipment"
          />
        </label>

        <label className="space-y-1 md:col-span-1">
          <span className="text-sm font-medium">Closest parent category</span>
          <select
            name="parentId"
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-input px-3 text-sm"
          >
            <option value="">No parent (top-level)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium">Reason / details</span>
          <textarea
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-24 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm"
            placeholder="What should be searchable in this category?"
          />
        </label>

        <Button className="md:col-span-2" type="submit" disabled={!canSubmit}>
          Submit category request
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        This form auto-saves locally until you submit.
      </p>

      {recentRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Your latest requests</p>
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
                  {request.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
