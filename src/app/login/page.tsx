import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="text-sm text-muted-foreground">
        Sign in with a magic link sent to your email.
      </p>
      <LoginForm />
    </div>
  );
}
