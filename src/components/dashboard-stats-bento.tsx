import { Activity, CheckCircle2, FileText, Layers3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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

function toneClasses(tone: StatItem["tone"]) {
  if (tone === "success") return "border-success/20 bg-success/10 text-success";
  if (tone === "warning") return "border-warning/20 bg-warning/10 text-warning";
  if (tone === "secondary") return "border-secondary/20 bg-secondary/10 text-secondary";
  return "border-border/70 bg-muted/20 text-foreground";
}

export function DashboardStatsBento({ stats }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = iconByKey(item.key);
        return (
          <Card key={item.key} className="rounded-2xl border-border/70 shadow-sm">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${toneClasses(item.tone)}`}
                >
                  <Icon size={15} />
                </span>
              </div>
              <p className="text-3xl font-black leading-none">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

