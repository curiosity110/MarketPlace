"use client";

import type { ComponentProps } from "react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";

const OPEN_CREATE_MODAL_EVENT = "mkd:open-create-modal";

type Props = Omit<ComponentProps<typeof Button>, "children" | "onClick" | "type"> & {
  label: string;
  params?: Record<string, string | undefined>;
};

export function OpenCreateListingButton({ label, params, ...buttonProps }: Props) {
  const handleOpen = useCallback(() => {
    const safeParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        const normalizedKey = key.trim();
        const normalizedValue = value?.trim();
        if (!normalizedKey || !normalizedValue) return;
        safeParams[normalizedKey] = normalizedValue;
      });
    }

    window.dispatchEvent(
      new CustomEvent(OPEN_CREATE_MODAL_EVENT, {
        detail: { params: safeParams },
      }),
    );
  }, [params]);

  return (
    <Button
      type="button"
      onClick={handleOpen}
      {...buttonProps}
    >
      {label}
    </Button>
  );
}
