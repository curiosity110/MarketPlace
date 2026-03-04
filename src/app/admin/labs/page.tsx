import { AlertTriangle, Beaker } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminLabsToggleRow } from "@/components/admin-labs-toggle-row";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getServerLocale } from "@/lib/i18n";
import { shouldSkipPrismaCalls } from "@/lib/prisma-circuit-breaker";

export default async function AdminLabsPage() {
  await requireAdmin();
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const text = isMk
    ? {
        title: "Labs / Experimental",
        subtitle:
          "Безбедно вклучи/исклучи нови UX експерименти без промена на бизнис логика.",
        dbUnavailable:
          "Базата е моментално недостапна. Поставките се само за читање.",
        labsDisabledTitle: "Labs се исклучени",
        labsDisabledDesc:
          "Активирај го master прекинувачот за да се прикажат останатите експериментални фичери.",
        enabled: "Вклучено",
        disabled: "Исклучено",
        saveError: "Неуспешно зачувување. Обиди се повторно.",
        flags: {
          labsEnabled: {
            label: "Master: Labs",
            description: "Глобален прекинувач за експериментални функции.",
          },
          homeBigCategories: {
            label: "Home: Big Categories",
            description: "Експериментален приказ на големи категории на почетна.",
          },
          browseCityMode: {
            label: "Browse: City Mode",
            description: "Експериментален режим за градови во browse филтри.",
          },
          savedSearches: {
            label: "Saved Searches",
            description: "Експериментална поддршка за зачувани пребарувања.",
          },
        },
      }
    : {
        title: "Labs / Experimental",
        subtitle:
          "Safely toggle new UX experiments without changing core business logic.",
        dbUnavailable:
          "Database is currently unavailable. Settings are read-only.",
        labsDisabledTitle: "Labs disabled",
        labsDisabledDesc:
          "Enable the master switch first to unlock the rest of experimental features.",
        enabled: "Enabled",
        disabled: "Disabled",
        saveError: "Save failed. Please try again.",
        flags: {
          labsEnabled: {
            label: "Master: Labs",
            description: "Global master switch for experimental features.",
          },
          homeBigCategories: {
            label: "Home: Big Categories",
            description: "Experimental large category blocks on home page.",
          },
          browseCityMode: {
            label: "Browse: City Mode",
            description: "Experimental city browsing mode in browse filters.",
          },
          savedSearches: {
            label: "Saved Searches",
            description: "Experimental support for saved searches.",
          },
        },
      };

  const flags = await getFeatureFlags();
  const dbUnavailable = shouldSkipPrismaCalls();
  const toggleText = {
    enabled: text.enabled,
    disabled: text.disabled,
    saveError: text.saveError,
  };

  return (
    <div className="space-y-6">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">{text.title}</h1>
            <p className="mt-2 text-muted-foreground">{text.subtitle}</p>
          </div>
          <Badge variant={flags.labsEnabled ? "success" : "secondary"} className="gap-1">
            <Beaker size={14} />
            {flags.labsEnabled ? text.enabled : text.disabled}
          </Badge>
        </div>
      </section>

      {dbUnavailable ? (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="flex items-center gap-2 py-4 text-sm text-foreground">
            <AlertTriangle size={16} className="text-warning" />
            {text.dbUnavailable}
          </CardContent>
        </Card>
      ) : null}

      {!flags.labsEnabled ? (
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle>{text.labsDisabledTitle}</CardTitle>
            <p className="text-sm text-muted-foreground">{text.labsDisabledDesc}</p>
          </CardHeader>
          <CardContent>
            <AdminLabsToggleRow
              flagKey="labsEnabled"
              label={text.flags.labsEnabled.label}
              description={text.flags.labsEnabled.description}
              enabled={flags.labsEnabled}
              disabled={dbUnavailable}
              text={toggleText}
            />
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-3">
          <AdminLabsToggleRow
            flagKey="labsEnabled"
            label={text.flags.labsEnabled.label}
            description={text.flags.labsEnabled.description}
            enabled={flags.labsEnabled}
            disabled={dbUnavailable}
            text={toggleText}
          />
          <AdminLabsToggleRow
            flagKey="homeBigCategories"
            label={text.flags.homeBigCategories.label}
            description={text.flags.homeBigCategories.description}
            enabled={flags.homeBigCategories}
            disabled={dbUnavailable}
            text={toggleText}
          />
          <AdminLabsToggleRow
            flagKey="browseCityMode"
            label={text.flags.browseCityMode.label}
            description={text.flags.browseCityMode.description}
            enabled={flags.browseCityMode}
            disabled={dbUnavailable}
            text={toggleText}
          />
          <AdminLabsToggleRow
            flagKey="savedSearches"
            label={text.flags.savedSearches.label}
            description={text.flags.savedSearches.description}
            enabled={flags.savedSearches}
            disabled={dbUnavailable}
            text={toggleText}
          />
        </section>
      )}
    </div>
  );
}
