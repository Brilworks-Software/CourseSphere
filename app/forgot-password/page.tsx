"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      setIsSubmitting(true);
      // const supabase = createClient();
      // const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      //   email,
      //   {
      //     redirectTo: `${window.location.origin}/reset-password`,
      //   },
      // );
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to request password reset");
        return;
      }

      setMessage(
        data.message || "Password reset link has been sent to your email",
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to request password reset";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="w-full max-w-lg h-fit relative overflow-hidden border-8 rounded-2xl shadow-lg mx-auto">
        <div className="w-[90%] mx-auto rounded-full top-[-5%] h-44 absolute bg-primary blur-2xl" />
        <div className="relative z-10 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-xl shadow-lg">
                <Logo />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2">Forgot your password?</h2>
            <p className="mb-0">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Request failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert>
                <AlertTitle>Check your email</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field>
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isSubmitting || !email}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Spinner className="h-5 w-5 mr-2" />
                      Sending reset link...
                    </span>
                  ) : (
                    "Send reset link"
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
