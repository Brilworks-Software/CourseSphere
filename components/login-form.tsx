"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field";
import Logo from "./logo";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useLogin } from "@/app/hooks/auth/useLogin";
import Cookies from "js-cookie";

export default function LogInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn } = useLogin();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await login({ email, password });
      if (res.success) {
        Cookies.set("sb-auth-token", res.data.session.access_token);
        Cookies.set("sb-user-id", res.data.session.user.id);
        window.location.href = "/dashboard";
      }
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    }
  };

  return (
    <div className="w-full max-w-lg relative overflow-hidden border-8 rounded-2xl shadow-lg mx-auto">
      <div className="w-[90%] mx-auto rounded-full top-[-5%] h-44 absolute bg-primary blur-2xl"></div>
      <div className="relative z-10 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl shadow-lg">
              <Logo />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
          <p className="mb-0">Sign in to continue learning</p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Sign in failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email-address">Email address</FieldLabel>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            <Field>
              <Button type="submit" disabled={isLoggingIn} className="w-full">
                {isLoggingIn ? (
                  <span className="flex items-center">
                    <Spinner className="h-5 w-5 mr-2" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </Field>

            <FieldSeparator>Or continue with</FieldSeparator>

            <Field>
              <FieldDescription className="text-center">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-semibold">
                  Sign up
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
