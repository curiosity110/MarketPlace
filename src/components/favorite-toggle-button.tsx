"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  locale: "en" | "mk";
  isAuthenticated: boolean;
  initialFavorited?: boolean;
  iconOnly?: boolean;
  className?: string;
};

export function FavoriteToggleButton({
  listingId,
  locale,
  isAuthenticated,
  initialFavorited = false,
  iconOnly = false,
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [favorited, setFavorited] = useState(initialFavorited);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  const isMk = locale === "mk";
  const text = isMk
    ? {
        favorite: "Омилено",
        removeFavorite: "Отстрани од омилени",
        addFavorite: "Додај во омилени",
      }
    : {
        favorite: "Favorite",
        removeFavorite: "Remove from favorites",
        addFavorite: "Add to favorites",
      };

  const loginHref = useMemo(() => {
    const query = searchParams.toString();
    const next = query ? `${pathname}?${query}` : pathname;
    return `/login?next=${encodeURIComponent(next || "/browse")}`;
  }, [pathname, searchParams]);

  if (!isAuthenticated) {
    return (
      <Link href={loginHref} aria-label={text.addFavorite}>
        <Button
          variant={iconOnly ? "outline" : "ghost"}
          size="sm"
          className={cn(iconOnly ? "h-8 w-8 p-0" : "gap-1.5", className)}
          type="button"
        >
          <Heart size={14} />
          {!iconOnly && <span>{text.favorite}</span>}
        </Button>
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant={iconOnly ? "outline" : favorited ? "secondary" : "ghost"}
      size="sm"
      className={cn(iconOnly ? "h-8 w-8 p-0" : "gap-1.5", className)}
      aria-label={favorited ? text.removeFavorite : text.addFavorite}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleFavorite({ listingId, locale });
          if (!result.ok) return;
          setFavorited(result.favorited);
          router.refresh();
        });
      }}
    >
      {isPending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Heart
          size={14}
          className={cn(
            "transition-colors",
            favorited ? "fill-current text-red-500" : "",
          )}
        />
      )}
      {!iconOnly && <span>{text.favorite}</span>}
    </Button>
  );
}
