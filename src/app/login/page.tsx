import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const error = sp.error ? decodeURIComponent(sp.error) : null;
  const next =
    sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//")
      ? sp.next
      : "/browse";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <section className="text-center">
        <h1 className="bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
          Welcome Back
        </h1>
        <p className="mt-2 text-muted-foreground">
          Login or register and start trading immediately.
        </p>
      </section>

      <Card className="border-border/75">
        <CardHeader>
          <CardTitle className="text-2xl">Account access</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm defaultMode="login" initialError={error} nextPath={next} />
        </CardContent>
      </Card>

      <div className="grid gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <p className="inline-flex items-center gap-2">
          <ShieldCheck size={15} className="text-success" />
          Secure session handling through Supabase
        </p>
        <p className="inline-flex items-center gap-2">
          <LockKeyhole size={15} className="text-secondary" />
          Password or magic link login supported
        </p>
        <p>
          New here?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Open register page
          </Link>
        </p>
      </div>
    </div>
  );
}
