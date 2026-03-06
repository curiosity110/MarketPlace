"use client";

import type { ReactNode } from "react";
import { uiModal } from "@/components/ui/ui-patterns";

type Props = {
  isOpen: boolean;
  isActive: boolean;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
};

export function CreateListingModalShell({
  isOpen,
  isActive,
  closeLabel,
  onClose,
  children,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className={`${uiModal.overlayTop} z-[120]`} role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className={`absolute inset-0 ${uiModal.backdrop} transition-opacity duration-200 ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />
      {children}
    </div>
  );
}
