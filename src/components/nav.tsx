import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { en } from "@/messages/en";
import { Container } from "@/components/ui/container";
import { SB_ACCESS_COOKIE, SB_REFRESH_COOKIE } from "@/lib/supabase/cookies";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClientAuthButton } from "@/components/client-auth-button";

export async function ServerNav() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
          <Link href="/" className="font-semibold">
            {en.appName}
          </Link>
          <Link href="/browse">{en.nav.browse}</Link>
          <Link href="/sell">{en.nav.sell}</Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <ClientAuthButton
            user={user?.email ? { email: user.email } : null}
            logoutAction={logout}
          />
        </div>
      </Container>
    </nav>
  );
}

export const Nav = ServerNav;
