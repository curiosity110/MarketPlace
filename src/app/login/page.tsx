import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerLocale, t } from "@/lib/i18n";

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const text = isMk
    ? {
        welcomeBack: "Добредојде назад",
        subtitle: "Најави се или регистрирај се и започни веднаш.",
        accountAccess: "Пристап до профил",
        secureSession: "Безбедна сесија преку Supabase",
        passwordOrMagic: "Поддржана е најава со лозинка или magic линк",
        newHere: "Нов/а си тука?",
        openRegister: "Отвори регистрација",
      }
    : {
        welcomeBack: "Welcome Back",
        subtitle: "Login or register and start trading immediately.",
        accountAccess: "Account access",
        secureSession: "Secure session handling through Supabase",
        passwordOrMagic: "Password or magic link login supported",
        newHere: "New here?",
        openRegister: "Open register page",
      };
  const sp = await searchParams;
  const errorRaw = sp.error ? safeDecodeURIComponent(sp.error) : null;
  const error =
    errorRaw && errorRaw.startsWith("auth.")
      ? t(locale, errorRaw)
      : errorRaw;
  const next =
    sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//")
      ? sp.next
      : "/dashboard";
  const encodedNext = encodeURIComponent(next);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <section className="text-center">
        <h1 className="bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
          {text.welcomeBack}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {text.subtitle}
        </p>
      </section>

      <Card className="border-border/75">
        <CardHeader>
          <CardTitle className="text-2xl">{text.accountAccess}</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm
            defaultMode="login"
            initialError={error}
            nextPath={next}
            locale={locale}
          />
        </CardContent>
      </Card>

      <div className="grid gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <p className="inline-flex items-center gap-2">
          <ShieldCheck size={15} className="text-success" />
          {text.secureSession}
        </p>
        <p className="inline-flex items-center gap-2">
          <LockKeyhole size={15} className="text-secondary" />
          {text.passwordOrMagic}
        </p>
        <p>
          {text.newHere}{" "}
          <Link
            href={`/register?next=${encodedNext}`}
            className="font-semibold text-primary hover:underline"
          >
            {text.openRegister}
          </Link>
        </p>
      </div>
    </div>
  );
}
