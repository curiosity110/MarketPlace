import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export default function LoginPage() {
  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 dark:from-orange-400 dark:to-blue-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">Sign in to your marketplace account</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Magic Link Login</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a secure login link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <div className="mt-6 text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">Don't have an account?</span>
            </div>
          </div>

          <p className="text-sm">
            <Link href="/auth/finish" className="text-primary hover:underline font-semibold">
              Create your account
            </Link>
          </p>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 space-y-3 text-sm text-muted-foreground text-center">
          <p className="flex items-center justify-center gap-2">
            <span className="text-green-500">✓</span> Secure & encrypted
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="text-green-500">✓</span> No password needed
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="text-green-500">✓</span> One-click login
          </p>
        </div>
      </div>
    </Container>
  );
}
