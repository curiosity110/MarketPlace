import type React from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function ModalActionRow({ children, className }: Props) {
  return <div className={cn("flex justify-end gap-2 pt-1", className)}>{children}</div>;
}
