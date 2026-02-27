"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  className?: string;
};

export function OpenAssistantButton({
  size = "sm",
  variant = "secondary",
  className = "",
}: Props) {
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={`gap-1.5 ${className}`}
      onClick={() => {
        window.dispatchEvent(new CustomEvent("mkd:open-assistant"));
      }}
    >
      <MessageCircle size={15} />
      Ask GPT
    </Button>
  );
}
