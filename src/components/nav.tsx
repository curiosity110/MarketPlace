import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { en } from "@/messages/en";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SB_ACCESS_COOKIE, SB_REFRESH_COOKIE } from "@/lib/supabase/cookies";

export async function Nav() {
  const user = await getSessionUser();

  async function logout() {
    "use server";
    const jar = await cookies();
    jar.delete(SB_ACCESS_COOKIE);
    jar.delete(SB_REFRESH_COOKIE);
    redirect("/browse");
  }

  return (
    <nav className="border-b border-border bg-background">
      <Container className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="font-semibold">{en.appName}</Link>
          <Link href="/browse">{en.nav.browse}</Link>
          <Link href="/sell">{en.nav.sell}</Link>
          {user?.role === "ADMIN" && <Link href="/admin">{en.nav.admin}</Link>}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <form action={logout}>
              <Button variant="outline" type="submit">{en.nav.logout}</Button>
            </form>
          ) : (
            <Link href="/login" className="text-sm font-medium">{en.nav.login}</Link>
          )}
        </div>
      </Container>
    </nav>
  );
}
