import Link from "next/link";
import { UserRoundPlus } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerLocale } from "@/lib/i18n";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const text = isMk
    ? {
        createAccount: "Креирај профил",
        subtitle: "Приклучи се и почни да продаваш или купуваш денес.",
        register: "Регистрација",
        haveAccount: "Веќе имаш профил?",
        goToLogin: "Оди на најава",
      }
    : {
        createAccount: "Create account",
        subtitle: "Join the marketplace and start selling or buying today.",
        register: "Register",
        haveAccount: "Already have an account?",
        goToLogin: "Go to login",
      };
  const sp = await searchParams;
  const next =
    sp.next && sp.next !== "/" && sp.next.startsWith("/") && !sp.next.startsWith("//")
      ? sp.next
      : "/dashboard";
  const encodedNext = encodeURIComponent(next);

  return (
    <div className="mx-auto max-w-lg space-y-5 sm:space-y-6">
      <section className="space-y-2 text-center">
        <h1 className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
          {text.createAccount}
        </h1>
        <p className="text-muted-foreground">{text.subtitle}</p>
      </section>

      <Card className="border-border/75">
        <CardHeader className="pb-4">
          <CardTitle className="inline-flex items-center gap-2 text-2xl">
            <UserRoundPlus size={20} className="text-primary" />
            {text.register}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm defaultMode="register" nextPath={next} locale={locale} />
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {text.haveAccount}{" "}
        <Link href={`/login?next=${encodedNext}`} className="font-semibold text-primary hover:underline">
          {text.goToLogin}
        </Link>
      </p>
    </div>
  );
}
