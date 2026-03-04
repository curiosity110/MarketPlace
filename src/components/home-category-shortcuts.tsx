import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ShortcutItem = {
  id: string;
  label: string;
  count: number;
};

type Props = {
  title: string;
  browseAllLabel: string;
  items: ShortcutItem[];
};

export function HomeCategoryShortcuts({ title, browseAllLabel, items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link key={item.id} href={`/browse?cat=${item.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-border/70 px-3 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="max-w-[150px] truncate">{item.label}</span>
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-black leading-none">
                {item.count}
              </span>
            </Button>
          </Link>
        ))}
        <Link href="/browse">
          <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs">
            {browseAllLabel} <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
