import { Activity, CheckCircle2, FileText, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";

type StatItem = {
  key: string;
  label: string;
  value: number;
  description: string;
  tone: "default" | "success" | "warning" | "secondary";
};

type Props = {
  stats: StatItem[];
};

function iconByKey(key: string) {
  if (key === "active") return CheckCircle2;
  if (key === "draft") return FileText;
  if (key === "sold") return Activity;
  return Layers3;
}

export function DashboardStatsBento({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = iconByKey(item.key);
        return (
          <div
            key={item.key}
            className="rounded-[1.1rem] bg-muted/45 px-3 py-3 ring-1 ring-black/5 dark:ring-white/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-lg font-semibold tracking-tight sm:text-xl">{item.value}</p>
              </div>
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full",
                  item.tone === "success" && "bg-success/10 text-success",
                  item.tone === "warning" && "bg-warning/12 text-warning",
                  item.tone === "secondary" && "bg-secondary/10 text-secondary",
                  item.tone === "default" && "bg-background text-foreground",
                )}
              >
                <Icon size={14} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
