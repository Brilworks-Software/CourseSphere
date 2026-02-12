"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { parseHashParamsForSessionVerification } from "@/lib/utils";
import { useAuth } from "@/app/provider/AuthProvider";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Loader from "@/components/loader";
import { TokenManager } from "@/lib/token-manager";
import Cookies from "js-cookie";

function LoadingFallback() {
  return <Loader />;
}

export default function VerifyPage({ searchParams }: { searchParams: any }) {
  const [status, setStatus] = useState("verifying"); //"verifying", "success", "error"
  const [error, setError] = useState<string | null>(null);
  const { redirect } = searchParams;
  const { refetchUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function verify() {
      setStatus("verifying");
      setError(null);
      try {
        // Parse tokens from hash
        const hashParams = parseHashParamsForSessionVerification(
          window.location.hash,
        );
        const { access_token, refresh_token, expires_at } = hashParams;
        if (!access_token || !refresh_token || !expires_at) {
          setStatus("error");
          setError("Invalid or missing verification tokens.");
          toast.error("Invalid or missing verification tokens.");
          return;
        }
        // Send tokens to server to set cookies
        const res = await fetch("/api/auth/verify-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token, refresh_token, expires_at }),
        });
        if (!res.ok) {
          setStatus("error");
          setError("Failed to verify session.");
          toast.error("Failed to verify session.");
          return;
        }
        const data = await res.json();
        const { tokenData } = data;
        Cookies.set("sb-auth-token", tokenData.access_token);
        Cookies.set("sb-user-id", tokenData.user_id);
        router.push(redirect || "/dashboard");
        // TokenManager.setTokens(tokenData);

        setStatus("success");
        toast.success("Email verified successfully!");
        refetchUser();
      } catch (err) {
        setStatus("error");
        let message = "Verification failed";
        if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          typeof (err as Error).message === "string"
        ) {
          message = (err as Error).message;
        }
        setError(message);
        toast.error(message);
      }
    }
    verify();
  }, []);

  if (status === "verifying") {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <LoadingFallback />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="flex flex-col items-center">
            <div className="rounded-full p-3 mb-4 bg-destructive/10">
              <svg
                className="w-10 h-10 text-destructive"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <CardTitle className="text-center">Verification Failed</CardTitle>
            <CardDescription className="text-center">
              We couldn&apos;t verify your email. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Button className="mt-2" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex flex-col items-center">
          <div className="rounded-full p-3 mb-4 bg-success/10">
            <svg
              className="w-10 h-10 text-success"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <CardTitle className="text-center">Email Verified!</CardTitle>
          <CardDescription className="text-center">
            Your email has been successfully verified. Redirecting to your
            dashboard...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Button
            className="w-fit h-10 px-5 font-semibold text-sm mt-2"
            onClick={() => router.push("/login")}
          >
            Go to Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
