import type React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  const sizeStyles = {
    sm: "min-h-11 px-3 text-sm",
    md: "min-h-11 px-4 text-sm",
    lg: "h-11 px-5 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:translate-y-px",
        "whitespace-nowrap",
        sizeStyles[size],
        variant === "default" &&
          "bg-primary text-primary-foreground shadow-[0_14px_30px_-20px_rgba(228,120,62,0.7)] hover:bg-[rgb(214,108,51)]",
        variant === "secondary" &&
          "bg-secondary/10 text-secondary ring-1 ring-secondary/10 hover:bg-secondary/15",
        variant === "outline" &&
          "border border-border/60 bg-transparent text-foreground shadow-none hover:border-border/80 hover:bg-card/80",
        variant === "ghost" &&
          "bg-transparent text-foreground/72 hover:bg-muted/70 hover:text-foreground",
        variant === "destructive" &&
          "bg-destructive text-white shadow-[0_10px_24px_-18px_rgba(220,38,38,0.9)] hover:bg-red-700",
        className,
      )}
      {...props}
    />
  );
}
