"use client";

import { useState, useEffect } from "react";
import { useUserContext } from "@/app/provider/user-context";
import { useAuth } from "@/app/provider/AuthProvider";
import { Loader2 } from "lucide-react";
import AffiliateSignup from "./AffiliateSignup";
import AffiliateDashboard from "./AffiliateDashboard";

interface AffiliateProfile {
  id: string;
  referralCode: string;
  commissionRate: number;
  totalSales: number;
  totalEarnings: number;
  isActive: boolean;
  createdAt: string;
}

export default function AffiliateMain() {
  const { user } = useUserContext();
  const { refetchUser } = useAuth();
  const [isAffiliate, setIsAffiliate] = useState<boolean | null>(null);
  const [affiliateProfile, setAffiliateProfile] =
    useState<AffiliateProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAffiliateStatus = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Check if we already have affiliate status from user context
      if (user.is_affiliate !== undefined) {
        setIsAffiliate(user.is_affiliate);
        if (user.is_affiliate && user.affiliate_profile) {
          setAffiliateProfile({
            id: user.affiliate_profile.id,
            referralCode: user.affiliate_profile.referral_code,
            commissionRate: user.affiliate_profile.commission_rate || 20,
            totalSales: user.affiliate_profile.total_sales || 0,
            totalEarnings: user.affiliate_profile.total_earnings || 0,
            isActive: user.affiliate_profile.is_active,
            createdAt: new Date().toISOString(),
          });
        }
        setLoading(false);
        return;
      }

      // Fallback: check via API if user context doesn't have affiliate info
      try {
        const response = await fetch(
          `/api/affiliate/dashboard?userId=${user.id}`,
        );

        if (response.ok) {
          const data = await response.json();
          setIsAffiliate(true);
          setAffiliateProfile(data.profile);
        } else if (response.status === 404) {
          setIsAffiliate(false);
        } else {
          console.error(
            "Error checking affiliate status:",
            await response.text(),
          );
          setIsAffiliate(false);
        }
      } catch (error) {
        console.error("Error checking affiliate status:", error);
        setIsAffiliate(false);
      } finally {
        setLoading(false);
      }
    };

    checkAffiliateStatus();
  }, [user?.id, user?.is_affiliate, user?.affiliate_profile]);

  const handleAffiliateSignupSuccess = async () => {
    // Refetch user data to update affiliate status
    try {
      await refetchUser();
      setIsAffiliate(true);
    } catch (error) {
      console.error("Error refetching user:", error);
      // Fallback to reload if refetch fails
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-100">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Loading affiliate information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in</h2>
          <p className="text-muted-foreground">
            You need to be logged in to access the affiliate program.
          </p>
        </div>
      </div>
    );
  }

  // Only students can join the affiliate program
  if (user.role !== "student") {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
          <p className="text-muted-foreground">
            The affiliate program is only available for students. Your current
            role is: {user.role || "unknown"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {isAffiliate ? (
        <AffiliateDashboard />
      ) : (
        <AffiliateSignup onSignupSuccess={handleAffiliateSignupSuccess} />
      )}
    </div>
  );
}
