import { redirect } from "next/navigation";
import { canSell, getSessionUser } from "@/lib/auth";

export default async function LegacySellPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?next=%2Fdashboard%3Fcreate%3D1");
  }

  if (!canSell(sessionUser.role)) {
    redirect("/profile");
  }

  redirect("/dashboard?create=1");
}
