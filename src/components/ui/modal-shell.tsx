import type React from "react";
import { cn } from "@/lib/utils";
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
  if (!open) return null;

  // Generic modal frame: backdrop/positioning/focus surface, inner content stays feature-owned.
  return (
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
      <div className={cn(uiModal.panel, "max-w-full min-w-0 overflow-x-hidden", className)}>
        {children}
      </div>
    </div>
  );
}
