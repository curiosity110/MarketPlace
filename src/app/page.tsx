import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h1 className="text-3xl font-semibold">MarketPlace MK</h1>
        <p className="text-muted-foreground">Buy and sell in North Macedonia.</p>
        <Link href="/browse">
          <Button>Browse listings</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
