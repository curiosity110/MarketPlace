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
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-base",
  };

  return (
    <button
      className={cn(
        // Base styles
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:translate-y-px",
        sizeStyles[size],

        // Variants
        variant === "default" &&
          "bg-gradient-to-r from-orange-500 to-orange-600 text-primary-foreground shadow-sm hover:from-orange-600 hover:to-orange-600 hover:shadow-md",
        variant === "secondary" &&
          "bg-gradient-to-r from-blue-600 to-blue-700 text-secondary-foreground shadow-sm hover:from-blue-700 hover:to-blue-700 hover:shadow-md",
        variant === "outline" &&
          "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-orange-50/60 dark:hover:bg-orange-500/10",
        variant === "ghost" &&
          "bg-transparent text-foreground/75 hover:bg-muted hover:text-foreground",
        variant === "destructive" &&
          "bg-destructive text-white shadow-sm hover:bg-red-700",

        className,
      )}
      {...props}
    />
  );
}
