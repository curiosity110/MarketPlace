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
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(
        // Base styles
        "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary active:scale-95",
        sizeStyles[size],

        // Variants
        variant === "default" &&
          "bg-primary text-primary-foreground hover:bg-orange-600 dark:hover:bg-orange-500 shadow-md hover:shadow-lg",
        variant === "secondary" &&
          "bg-secondary text-secondary-foreground hover:bg-blue-700 dark:hover:bg-blue-400 shadow-md hover:shadow-lg",
        variant === "outline" &&
          "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-400 dark:hover:text-background",
        variant === "ghost" &&
          "text-primary hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-400/10",
        variant === "destructive" &&
          "bg-destructive text-white hover:bg-red-600 dark:hover:bg-red-500 shadow-md hover:shadow-lg",

        className,
      )}
      {...props}
    />
  );
}
