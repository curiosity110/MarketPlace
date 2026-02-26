import { cn } from "@/lib/utils";
import Link from "next/link";

interface CategoryCardProps {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: "orange" | "blue" | "purple" | "green";
  href?: string;
  count?: number;
}

const colorStyles = {
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-300",
    badge:
      "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/20",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-700 dark:text-purple-300",
    badge:
      "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-950/20",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
    badge:
      "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  },
};

export function CategoryCard({
  id,
  name,
  description,
  icon,
  color = "blue",
  href,
  count,
}: CategoryCardProps) {
  const styles = colorStyles[color];
  const content = (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl p-4 border-2 transition-all duration-200",
        styles.bg,
        styles.border,
        "hover:shadow-md hover:scale-105 cursor-pointer group",
      )}
    >
      {icon && <span className="text-3xl">{icon}</span>}

      <div className="flex-1 w-full">
        <h3 className={cn("font-bold text-lg", styles.text)}>{name}</h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {description}
          </p>
        )}
      </div>

      {count !== undefined && (
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full",
            styles.badge,
          )}
        >
          {count} items
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export function CategoryGrid({
  categories,
}: {
  categories: Array<CategoryCardProps>;
}) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No categories found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {categories.map((cat) => (
        <CategoryCard key={cat.id} {...cat} />
      ))}
    </div>
  );
}
