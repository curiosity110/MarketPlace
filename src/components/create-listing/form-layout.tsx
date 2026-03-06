"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function CreateListingFormLayout({ children }: Props) {
  return (
    <div className="max-w-full min-w-0 space-y-5 overflow-x-hidden pb-2 sm:space-y-6">
      {children}
    </div>
  );
}
