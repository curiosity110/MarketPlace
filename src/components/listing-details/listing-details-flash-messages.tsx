import { Card, CardContent } from "@/components/ui/card";

type Props = {
  reportSaved: boolean;
  soldSaved: boolean;
  contactedSaved: boolean;
  msg?: string;
  reportError?: string;
  reportSubmittedLabel: string;
};

export function ListingDetailsFlashMessages({
  reportSaved,
  soldSaved,
  contactedSaved,
  msg,
  reportError,
  reportSubmittedLabel,
}: Props) {
  if (!(reportSaved || soldSaved || contactedSaved || msg || reportError)) return null;

  return (
    <>
      {(reportSaved || soldSaved || contactedSaved || msg) && (
        <Card className="max-w-full border-success/30 bg-success/10">
          <CardContent className="py-3 text-sm text-success">
            {msg || reportSubmittedLabel}
          </CardContent>
        </Card>
      )}
      {reportError ? (
        <Card className="max-w-full border-warning/30 bg-warning/10">
          <CardContent className="py-3 text-sm text-foreground">{reportError}</CardContent>
        </Card>
      ) : null}
    </>
  );
}
