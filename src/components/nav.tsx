import Link from "next/link";
import { Bell } from "lucide-react";
import { canAccessControl, getSessionUser } from "@/lib/auth";
import { listNotifications } from "@/lib/actions/notifications";
import { AuthCtaLinks } from "@/components/auth-cta-links";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NavMobileMenu } from "@/components/nav-mobile-menu";
import { NavAccountLinks } from "@/components/nav-account-links";
import { NotificationsBell } from "@/components/notifications-bell";
import { NavPrimaryLinks } from "@/components/nav-primary-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { getMessages, getServerLocale } from "@/lib/i18n";

export async function Nav() {
  const user = await getSessionUser();
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const isAdmin = user ? canAccessControl(user.role) : false;
  const notifications = user
    ? await listNotifications({ limit: 8 })
    : { items: [], unreadCount: 0 };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border/35 bg-background/78 backdrop-blur-xl">
        <Container className="flex items-center gap-2 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-7">
            <Link
              href="/"
              className="inline-flex min-w-0 max-w-[min(56vw,11rem)] items-center whitespace-nowrap rounded-full bg-foreground px-3 py-2 text-[10px] font-semibold leading-none tracking-[0.12em] text-background transition-opacity hover:opacity-90 sm:max-w-none sm:px-4 sm:text-sm"
            >
              <span className="truncate sm:hidden">MP MKD</span>
              <span className="hidden truncate sm:inline">{messages.appName}</span>
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

          <div className="ml-auto hidden min-w-0 shrink-0 items-center gap-2 sm:flex">
            <LanguageSwitcher
              locale={locale}
              label={messages.language.label}
              englishLabel={messages.language.english}
              macedonianLabel={messages.language.macedonian}
            />
            <ThemeToggle label={messages.theme.toggle} />
            {user ? (
              <>
                <NotificationsBell
                  locale={locale}
                  items={notifications.items}
                  unreadCount={notifications.unreadCount}
                />
                <NavAccountLinks
                  isAdmin={isAdmin}
                  adminLabel={messages.nav.admin}
                  profileLabel={messages.market.profile}
                  logoutLabel={messages.nav.logout}
                />
              </>
            ) : (
              <AuthCtaLinks
                registerLabel={messages.nav.register}
                loginLabel={messages.nav.login}
              />
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:hidden">
            {user ? (
              <NotificationsBell
                locale={locale}
                items={notifications.items}
                unreadCount={notifications.unreadCount}
              />
            ) : (
              <Link href="/notifications">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  aria-label={messages.market.notifications}
                >
                  <Bell size={16} />
                </Button>
              </Link>
            )}

            <NavMobileMenu
              isLoggedIn={Boolean(user)}
              isAdmin={isAdmin}
              locale={locale}
              labels={{
                menu: messages.nav.menu,
                profile: messages.market.profile,
                dashboard: messages.nav.dashboard,
                admin: messages.nav.admin,
                login: messages.nav.login,
                register: messages.nav.register,
                logout: messages.nav.logout,
                language: messages.language.label,
                english: messages.language.english,
                macedonian: messages.language.macedonian,
                toggleTheme: messages.theme.toggle,
              }}
            />
          </div>
        </Container>
      </nav>

      <MobileBottomNav
        isAdmin={isAdmin}
        isLoggedIn={Boolean(user)}
        labels={{
          home: messages.nav.home,
          browse: messages.nav.browse,
          sell: messages.nav.sell,
          dashboard: messages.nav.dashboard,
          login: messages.nav.login,
        }}
      />
    </>
  );
}
