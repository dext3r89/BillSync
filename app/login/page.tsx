"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Scale, ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden w-1/2 bg-primary lg:flex lg:flex-col lg:justify-between p-12">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Scale className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-semibold text-primary-foreground">
              BillSync
            </span>
          </Link>
        </div>

        <div className="space-y-6">
          <blockquote className="text-2xl font-medium text-primary-foreground/90 leading-relaxed max-w-md">
            &ldquo;BillSync has transformed how our firm tracks billable hours. We&apos;ve
            increased captured time by 23% in the first month.&rdquo;
          </blockquote>
          <div>
            <p className="font-medium text-primary-foreground">Sarah Mitchell</p>
            <p className="text-sm text-primary-foreground/70">
              Managing Partner, Mitchell & Associates
            </p>
          </div>
        </div>

        <div className="text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} BillSync Legal Technologies
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full flex-col justify-center px-8 py-12 lg:w-1/2 lg:px-16">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mx-auto w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">BillSync</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@lawfirm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                Remember me for 30 days
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="#" className="font-medium text-foreground hover:underline">
              Contact sales
            </Link>
          </p>

          {/* Demo Hint */}
          <div className="mt-8 rounded-lg border border-border bg-secondary/50 p-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Demo mode:</span>{" "}
              Enter any email and password to access the dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
