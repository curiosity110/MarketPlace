import type React from "react";
import { Button } from "@/components/ui/button";
import { ModalActionRow } from "@/components/ui/modal-action-row";

type Props = {
  cancelLabel: string;
  onCancel: () => void;
  cancelDisabled?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function ActionModalFooter({
  cancelLabel,
  onCancel,
  cancelDisabled = false,
  children,
  className,
}: Props) {
  return (
    <ModalActionRow className={className}>
      <Button type="button" variant="ghost" onClick={onCancel} disabled={cancelDisabled}>
        {cancelLabel}
      </Button>
      {children}
    </ModalActionRow>
  );
}
