import Link from "next/link";
import { UserRoundPlus } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <section className="text-center">
        <h1 className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
          Create Account
        </h1>
        <p className="mt-2 text-muted-foreground">
          Join the marketplace and start selling or buying today.
        </p>
      </section>

      <Card className="border-border/75">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-2xl">
            <UserRoundPlus size={20} className="text-primary" />
            Register
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm defaultMode="register" />
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Go to login
        </Link>
      </p>
    </div>
  );
}
