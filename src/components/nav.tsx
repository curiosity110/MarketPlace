import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { en } from "@/messages/en";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export async function Nav() {
  const user = await getSessionUser();
  const isAdmin = user?.role === "ADMIN";

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-sm">
        <Container className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="rounded-full border border-primary/30 bg-gradient-to-r from-orange-500 to-blue-600 px-4 py-1.5 text-sm font-bold tracking-wide text-white shadow-sm transition-opacity hover:opacity-90"
            >
              {en.appName}
            </Link>

            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-muted/30 p-1 md:flex">
              <Link
                href="/browse"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-white hover:text-foreground dark:hover:bg-white/10"
              >
                {en.nav.browse}
              </Link>
              <Link
                href="/categories"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-white hover:text-foreground dark:hover:bg-white/10"
              >
                {en.nav.categories}
              </Link>
              <Link
                href="/sell"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-white hover:text-foreground dark:hover:bg-white/10"
              >
                {en.nav.sell}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/15"
                >
                  {en.nav.admin}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <form action="/api/auth/logout" method="post" className="contents">
                <Button variant="outline" size="sm" type="submit">
                  {en.nav.logout}
                </Button>
              </form>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/register">
                  <Button variant="outline" size="sm">
                    {en.nav.register}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm">{en.nav.login}</Button>
                </Link>
              </div>
            )}
          </div>
        </Container>
      </nav>

      <MobileBottomNav isAdmin={isAdmin} isLoggedIn={Boolean(user)} />
    </>
  );
}
