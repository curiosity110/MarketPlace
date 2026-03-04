import Link from "next/link";
import { canAccessControl, getSessionUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Container } from "@/components/ui/container";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { AuthCtaLinks } from "@/components/auth-cta-links";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NavPrimaryLinks } from "@/components/nav-primary-links";
import { NavAccountLinks } from "@/components/nav-account-links";
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

            <NavPrimaryLinks
              isLoggedIn={Boolean(user)}
              labels={{
                browse: messages.nav.browse,
                categories: messages.nav.categories,
                sell: messages.nav.sell,
                dashboard: messages.nav.dashboard,
              }}
            />
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
              <NavAccountLinks
                isAdmin={isAdmin}
                adminLabel={messages.nav.admin}
                profileLabel={profileLabel}
                logoutLabel={messages.nav.logout}
              />
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
          browse: messages.nav.browse,
          categories: messages.nav.categories,
          sell: messages.nav.sell,
          dashboard: messages.nav.dashboard,
          login: messages.nav.login,
        }}
      />
    </>
  );
}
