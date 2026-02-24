import { Card, CardContent } from "@/components/ui/card";

export default function LoadingBrowse() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="h-24 animate-pulse bg-muted" />
        </Card>
      ))}
    </div>
  );
}
