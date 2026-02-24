import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { en } from "@/messages/en";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function Nav() {
  const user = await getSessionUser();

  async function logout() {
    "use server";
    const jar = await cookies();
    jar.delete("sb-access-token");
    jar.delete("sb-refresh-token");
    redirect("/");
  }

  return (
    <nav className="flex items-center justify-between border-b p-4">
      <div className="flex gap-4">
        <Link href="/">{en.appName}</Link>
        <Link href="/browse">{en.nav.browse}</Link>
        <Link href="/sell">{en.nav.sell}</Link>
        {user?.role === "ADMIN" && <Link href="/admin">{en.nav.admin}</Link>}
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {user ? (
          <form action={logout}><button className="rounded border px-2 py-1" type="submit">{en.nav.logout}</button></form>
        ) : (
          <Link href="/login">{en.nav.login}</Link>
        )}
      </div>
    </nav>
  );
}
