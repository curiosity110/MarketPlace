"use client";

import type React from "react";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-scroll-lock";
import { uiModal } from "@/components/ui/ui-patterns";

type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  closeLabel: string;
  children: React.ReactNode;
  className?: string;
  zIndexClassName?: string;
  align?: "center" | "top";
  backdropClassName?: string;
};

export function ModalShell({
  open,
  onClose,
  closeLabel,
  children,
  className,
  zIndexClassName = "z-[70]",
  align = "center",
  backdropClassName,
}: ModalShellProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
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
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      unlockBodyScroll();
      if (previousActiveElementRef.current?.isConnected) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        align === "top" ? uiModal.overlayTop : uiModal.overlayCenter,
        "max-w-[100vw] overflow-x-hidden",
        zIndexClassName,
      )}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className={cn(uiModal.backdrop, backdropClassName)}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          uiModal.panel,
          "max-w-full min-w-0 overflow-x-hidden",
          "data-[mobile-sheet=true]:pb-[env(safe-area-inset-bottom,0px)] sm:data-[mobile-sheet=true]:pb-0",
          className,
        )}
        data-mobile-sheet="true"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
