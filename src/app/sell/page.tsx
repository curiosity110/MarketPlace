import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/auth";

export default async function SellPage() {
  const user = await requireSeller();

  if (user.role === Role.ADMIN) {
    redirect("/admin");
  }

  // /sell now opens the dashboard create popup flow.
  redirect("/sell/analytics?create=1");
}
