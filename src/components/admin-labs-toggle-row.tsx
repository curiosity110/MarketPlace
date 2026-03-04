"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFeatureFlag } from "@/lib/actions/feature-flags";
import type { FeatureFlagKey } from "@/lib/feature-flags";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type Props = {
  flagKey: FeatureFlagKey;
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  text: {
    enabled: string;
    disabled: string;
    saveError: string;
  };
};

export function AdminLabsToggleRow({
  flagKey,
  label,
  description,
  enabled,
  disabled = false,
  text,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  function handleCheckedChange(nextChecked: boolean) {
    setError(null);
    setChecked(nextChecked);
    startTransition(async () => {
      try {
        await setFeatureFlag(flagKey, nextChecked);
        router.refresh();
      } catch {
        setChecked(!nextChecked);
        setError(text.saveError);
      }
    });
  }

  const rowDisabled = disabled || isPending;

  return (
    <Card className="border-border/70">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="space-y-1">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={checked ? "success" : "secondary"}>
            {checked ? text.enabled : text.disabled}
          </Badge>
          <Switch checked={checked} onCheckedChange={handleCheckedChange} disabled={rowDisabled} />
        </div>
      </CardContent>
    </Card>
  );
}
