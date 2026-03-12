"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";
import { useUserContext } from "@/app/provider/user-context";

export default function AffiliateSignup({
  variant = "full",
  onSignupSuccess,
}: {
  variant?: "full" | "banner";
  onSignupSuccess?: () => void;
}) {
  const { user } = useUserContext();
  const [isAffiliate, setIsAffiliate] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!user?.id) {
      setError("Please log in to become an affiliate");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/affiliate/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setReferralCode(data.referralCode);
          setSuccess(true);
          onSignupSuccess?.();
        } else if (response.status === 403) {
          throw new Error("Only students can join the affiliate program");
        } else {
          throw new Error(data.error || "Failed to create affiliate profile");
        }
      } else {
        setReferralCode(data.profile.referralCode);
        setSuccess(true);
        onSignupSuccess?.();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user already has an affiliate profile
  useEffect(() => {
    const checkAffiliate = async () => {
      if (!user?.id) {
        setIsAffiliate(false);
        return;
      }

      try {
        const res = await fetch(`/api/affiliate/dashboard?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setReferralCode(data.profile?.referralCode ?? null);
          setIsAffiliate(true);
        } else if (res.status === 404) {
          setIsAffiliate(false);
        } else {
          setIsAffiliate(false);
        }
      } catch (err) {
        setIsAffiliate(false);
      }
    };

    checkAffiliate();
  }, [user]);

  if (success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">
            Welcome to our Affiliate Program!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-2">
              Your Referral Code:
            </p>
            <p className="text-2xl font-mono font-bold text-center">
              {referralCode}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-muted-foreground">Commission Rate</p>
              <p className="font-bold">20%</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-muted-foreground">Referral Tracking</p>
              <p className="font-bold">30 Days</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-muted-foreground">Real-time Stats</p>
              <p className="font-bold">Dashboard</p>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              Share your referral link:{" "}
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {window.location.origin}/course/[course-id]?ref={referralCode}
              </code>
            </AlertDescription>
          </Alert>

          <Button
            className="w-full"
            onClick={() => (window.location.href = "/affiliate/dashboard")}
          >
            Go to Affiliate Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }
  // Render compact banner variant for dashboard placement
  if (variant === "banner") {
    return (
      <div className=" mx-auto">
        <div className="rounded-lg border bg-gradient-to-b from-background/80 to-background/60 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                Join Our Affiliate Program
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Earn 20% commission on every successful referral — share links
                and track performance in your affiliate dashboard.
              </p>
              <div className="hidden sm:flex mt-3 gap-3">
                <div className="text-xs px-3 py-2 rounded bg-muted/30">
                  20% Commission
                </div>
                <div className="text-xs px-3 py-2 rounded bg-muted/30">
                  30-day Cookie
                </div>
                <div className="text-xs px-3 py-2 rounded bg-muted/30">
                  Real-time Stats
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              {isAffiliate ? (
                <Button
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold shadow-sm"
                  onClick={() =>
                    (window.location.href = "/affiliate/dashboard")
                  }
                >
                  Go to Affiliate Dashboard
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSignup}
                  disabled={loading || !user}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {!user
                    ? "Please Login to Continue"
                    : "Join Affiliate Program"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Join Our Affiliate Program</CardTitle>
        <p className="text-muted-foreground">
          Earn 20% commission on every successful referral
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-6 border rounded-lg">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-green-600" />
            <h3 className="font-semibold mb-2">Earn 20% Commission</h3>
            <p className="text-sm text-muted-foreground">
              Get paid for every course sold through your referral link
            </p>
          </div>
          <div className="text-center p-6 border rounded-lg">
            <Users className="w-12 h-12 mx-auto mb-3 text-blue-600" />
            <h3 className="font-semibold mb-2">30-Day Cookie</h3>
            <p className="text-sm text-muted-foreground">
              Referrals are tracked for 30 days after clicking your link
            </p>
          </div>
          <div className="text-center p-6 border rounded-lg">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-purple-600" />
            <h3 className="font-semibold mb-2">Real-time Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Track clicks, conversions, and earnings in your dashboard
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">How it works:</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Get your unique referral code</p>
                <p className="text-sm text-muted-foreground">
                  Share it with your audience through social media, blogs, or
                  direct links
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium">
                  People click your link and purchase courses
                </p>
                <p className="text-sm text-muted-foreground">
                  We track their activity for 30 days and attribute sales to you
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium">
                  Earn 20% commission on successful sales
                </p>
                <p className="text-sm text-muted-foreground">
                  Commission are calculated from the final purchase amount after
                  any discounts
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleSignup}
          disabled={loading || !user}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {!user ? "Please Login to Continue" : "Join Affiliate Program"}
        </Button>
      </CardContent>
    </Card>
  );
}
