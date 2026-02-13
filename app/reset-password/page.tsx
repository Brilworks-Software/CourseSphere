"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import Logo from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExchanging, setIsExchanging] = useState(true);
  const [isTokenReady, setIsTokenReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsExchanging(true);
    async function run() {
      const code = searchParams.get("code");

      if (!code) return;
      setIsExchanging(false);
      setError("Invalid or expired reset link.");

      const res = await fetch("/api/auth/exchange-reset-code", {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("exchange reset code error", data);
        setError(data.error);
        setIsExchanging(false);
        return;
      }
      console.log("exchange reset code data", data);
      setIsTokenReady(true);
      setIsExchanging(false);
      setError(null);
      setMessage(null);
    }

    run();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setMessage(
        data.message || "Your password has been updated successfully.",
      );
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to reset password";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isExchanging) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="w-full max-w-lg relative overflow-hidden border-8 rounded-2xl shadow-lg mx-auto">
          <div className="w-[90%] mx-auto rounded-full top-[-5%] h-44 absolute bg-primary blur-2xl" />
          <div className="relative z-10 p-8 sm:p-10 flex flex-col items-center justify-center min-h-[280px]">
            <Spinner className="h-10 w-10 mb-4" />
            <p className="text-muted-foreground">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="w-full max-w-lg relative overflow-hidden border-8 rounded-2xl shadow-lg mx-auto">
        <div className="w-[90%] mx-auto rounded-full top-[-5%] h-44 absolute bg-primary blur-2xl" />
        <div className="relative z-10 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-xl shadow-lg">
                <Logo />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2">Reset your password</h2>
            <p className="mb-0">
              Choose a new password to secure your account.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Reset failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert>
                <AlertTitle>Password updated</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">New password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Enter a new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!isTokenReady || isSubmitting}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirm-password">
                  Confirm new password
                </FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!isTokenReady || isSubmitting}
                />
              </Field>

              <Field>
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isSubmitting || !isTokenReady}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Spinner className="h-5 w-5 mr-2" />
                      Updating password...
                    </span>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </Field>

              <Field>
                <FieldDescription className="text-center">
                  Remembered your password?{" "}
                  <button
                    type="button"
                    className="cursor-pointer font-semibold underline-offset-2 hover:underline"
                    onClick={() => router.push("/login")}
                  >
                    Sign in
                  </button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  );
}
