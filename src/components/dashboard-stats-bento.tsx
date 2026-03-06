import { Activity, CheckCircle2, FileText, Layers3 } from "lucide-react";
import { StatItem } from "@/components/ui/layout";

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
          <StatItem
            key={item.key}
            label={item.label}
            value={item.value}
            description={item.description}
            tone={item.tone}
            icon={<Icon size={14} />}
          />
        );
      })}
    </div>
  );
}
