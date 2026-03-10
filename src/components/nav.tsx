import { Suspense } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cache } from "react";
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

type Props = {
  locale?: "en" | "mk";
};

const getNavNotifications = cache(async () => listNotifications({ limit: 8 }));

export async function Nav({ locale: providedLocale }: Props) {
  const user = await getSessionUser();
  const locale = providedLocale ?? (await getServerLocale());
  const messages = getMessages(locale);
  const isAdmin = user ? canAccessControl(user.role) : false;

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
              compact
            />
            <ThemeToggle label={messages.theme.toggle} />
            {user ? (
              <Suspense
                fallback={
                <NavLoggedInFallback
                    isAdmin={isAdmin}
                    adminLabel={messages.nav.admin}
                    profileLabel={messages.market.profile}
                    logoutLabel={messages.nav.logout}
                    notificationsLabel={messages.market.notifications}
                  />
                }
              >
                <NavLoggedInControls
                  locale={locale}
                  isAdmin={isAdmin}
                  adminLabel={messages.nav.admin}
                  profileLabel={messages.market.profile}
                  logoutLabel={messages.nav.logout}
                />
              </Suspense>
            ) : (
              <AuthCtaLinks
                registerLabel={messages.nav.register}
                loginLabel={messages.nav.login}
              />
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:hidden">
            {user ? (
              <Suspense
                fallback={
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
                }
              >
                <NavNotificationsBell
                  locale={locale}
                />
              </Suspense>
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
                favorites: messages.market.favorites,
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

async function NavLoggedInControls({
  locale,
  isAdmin,
  adminLabel,
  profileLabel,
  logoutLabel,
}: {
  locale: "en" | "mk";
  isAdmin: boolean;
  adminLabel: string;
  profileLabel: string;
  logoutLabel: string;
}) {
  const notifications = await getNavNotifications();

  return (
    <>
      <NotificationsBell
        locale={locale}
        items={notifications.items}
        unreadCount={notifications.unreadCount}
      />
      <NavAccountLinks
        isAdmin={isAdmin}
        adminLabel={adminLabel}
        profileLabel={profileLabel}
        logoutLabel={logoutLabel}
      />
    </>
  );
}

async function NavNotificationsBell({
  locale,
}: {
  locale: "en" | "mk";
}) {
  const notifications = await getNavNotifications();

  return (
    <NotificationsBell
      locale={locale}
      items={notifications.items}
      unreadCount={notifications.unreadCount}
    />
  );
}

function NavLoggedInFallback({
  isAdmin,
  adminLabel,
  profileLabel,
  logoutLabel,
  notificationsLabel,
}: {
  isAdmin: boolean;
  adminLabel: string;
  profileLabel: string;
  logoutLabel: string;
  notificationsLabel: string;
}) {
  return (
    <>
      <Link href="/notifications">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0"
          aria-label={notificationsLabel}
        >
          <Bell size={16} />
        </Button>
      </Link>
      <NavAccountLinks
        isAdmin={isAdmin}
        adminLabel={adminLabel}
        profileLabel={profileLabel}
        logoutLabel={logoutLabel}
      />
    </>
  );
}
