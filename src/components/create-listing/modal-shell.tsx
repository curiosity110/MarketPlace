"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-scroll-lock";
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
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lockBodyScroll();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      unlockBodyScroll();
      if (previousActiveElementRef.current?.isConnected) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
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
    </div>,
    document.body,
  );
}
