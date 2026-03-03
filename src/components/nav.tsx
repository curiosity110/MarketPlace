import Link from "next/link";
import { canAccessControl, getSessionUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { AuthCtaLinks } from "@/components/auth-cta-links";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getMessages, getServerLocale } from "@/lib/i18n";

export async function Nav() {
  const user = await getSessionUser();
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const isAdmin = user ? canAccessControl(user.role) : false;
  const profileLabel = locale === "mk" ? "Профил" : "Profile";

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-sm">
        <Container className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="rounded-full border border-primary/30 bg-gradient-to-r from-orange-500 to-blue-600 px-4 py-1.5 text-sm font-bold tracking-wide text-white shadow-sm transition-opacity hover:opacity-90"
            >
              {messages.appName}
            </Link>

            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-muted/30 p-1 md:flex">
              <Link
                href="/browse"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-card hover:text-foreground"
              >
                {messages.nav.browse}
              </Link>
              <Link
                href="/categories"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-card hover:text-foreground"
              >
                {messages.nav.categories}
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-card hover:text-foreground"
                >
                  {messages.nav.dashboard}
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/15"
                >
                  {messages.nav.admin}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher
              locale={locale}
              label={messages.language.label}
              englishLabel={messages.language.english}
              macedonianLabel={messages.language.macedonian}
            />
            <ThemeToggle label={messages.theme.toggle} />
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile">
                  <Button variant="outline" size="sm" type="button">
                    {profileLabel}
                  </Button>
                </Link>
                <form action="/api/auth/logout" method="post" className="contents">
                  <Button variant="outline" size="sm" type="submit">
                    {messages.nav.logout}
                  </Button>
                </form>
              </div>
            ) : (
              <AuthCtaLinks
                registerLabel={messages.nav.register}
                loginLabel={messages.nav.login}
              />
            )}
          </div>
        </Container>
      </nav>

      <MobileBottomNav
        isAdmin={isAdmin}
        isLoggedIn={Boolean(user)}
        labels={{
          home: messages.nav.home,
          browse: messages.nav.browse,
          categories: messages.nav.categories,
          admin: messages.nav.admin,
          dashboard: messages.nav.dashboard,
          login: messages.nav.login,
        }}
      />
    </>
  );
}
