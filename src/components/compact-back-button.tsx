"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  fallbackHref: string;
  className?: string;
};

export function CompactBackButton({ label, fallbackHref, className }: Props) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref, { scroll: false });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn("h-8 self-start gap-1.5 rounded-full px-2.5 text-xs", className)}
      aria-label={label}
    >
      <ArrowLeft size={14} />
      <span>{label}</span>
    </Button>
  );
}
