import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { en } from "@/messages/en";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export async function Nav() {
  const user = await getSessionUser();

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <Container className="flex items-center justify-between py-4">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-bold text-xl bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            {en.appName}
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/browse"
              className="text-foreground/70 hover:text-primary transition-colors"
            >
              {en.nav.browse}
            </Link>
            <Link
              href="/categories"
              className="text-foreground/70 hover:text-primary transition-colors"
            >
              Categories
            </Link>
            <Link
              href="/sell"
              className="text-foreground/70 hover:text-primary transition-colors"
            >
              {en.nav.sell}
            </Link>
            {user?.role === "ADMIN" && (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-border">
                <Link
                  href="/admin"
                  className="text-foreground/70 hover:text-secondary transition-colors"
                >
                  {en.nav.admin}
                </Link>
                <Link
                  href="/admin/subscriptions"
                  className="text-foreground/70 hover:text-secondary transition-colors"
                >
                  Subscriptions
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <form action="/api/auth/logout" method="post" className="contents">
              <Button variant="outline" size="sm" type="submit">
                {en.nav.logout}
              </Button>
            </form>
          ) : (
            <Link href="/login">
              <Button size="sm">{en.nav.login}</Button>
            </Link>
          )}
        </div>
      </Container>
    </nav>
  );
}
