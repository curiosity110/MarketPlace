"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  id?: string;
  name?: string;
};

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      defaultChecked = false,
      disabled = false,
      onCheckedChange,
      className,
      id,
      name,
    },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    const isControlled = typeof checked === "boolean";
    const value = isControlled ? checked : internalChecked;

    function handleToggle() {
      if (disabled) return;
      const nextValue = !value;
      if (!isControlled) setInternalChecked(nextValue);
      onCheckedChange?.(nextValue);
    }

    return (
      <button
        ref={ref}
        id={id}
        name={name}
        type="button"
        role="switch"
        aria-checked={value}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          value ? "bg-primary" : "bg-muted",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          className,
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
            value ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    );
  },
);

Switch.displayName = "Switch";
