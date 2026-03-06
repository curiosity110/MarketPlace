import { Card, CardContent } from "@/components/ui/card";

type ProfileFlashBannersProps = {
  error?: string;
  saved: boolean;
  billingSuccess: boolean;
  profileSavedLabel: string;
  billingPassedLabel: string;
};

export function ProfileFlashBanners({
  error,
  saved,
  billingSuccess,
  profileSavedLabel,
  billingPassedLabel,
}: ProfileFlashBannersProps) {
  return (
    <>
      {error && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-4 text-sm text-foreground">{error}</CardContent>
        </Card>
      )}
      {saved && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">{profileSavedLabel}</CardContent>
        </Card>
      )}
      {billingSuccess && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">{billingPassedLabel}</CardContent>
        </Card>
      )}
    </>
  );
}
