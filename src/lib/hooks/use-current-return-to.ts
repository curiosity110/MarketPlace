"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function useCurrentReturnTo(fallback = "/") {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useMemo(() => {
    const safePathname = pathname || fallback;
    const query = searchParams.toString();
    return query ? `${safePathname}?${query}` : safePathname;
  }, [fallback, pathname, searchParams]);
}
