"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function CreateListingFormLayout({ children }: Props) {
  return (
    <div className="max-w-full min-w-0 space-y-4 overflow-x-hidden pb-1 sm:space-y-5">
      {children}
    </div>
  );
}
