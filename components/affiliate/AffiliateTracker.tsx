"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * AffiliateTracker - Captures affiliate referral codes from URL and stores them
 * Should be placed in the root layout or course pages
 */
export default function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const referralCode = searchParams.get("ref");

    if (referralCode) {
      // Store affiliate code in localStorage for later use
      localStorage.setItem("affiliate_ref", referralCode);
      localStorage.setItem("affiliate_ref_timestamp", Date.now().toString());

      // Track the click if we're on a course page
      const currentPath = window.location.pathname;
      const courseMatch = currentPath.match(/\/course\/([^\/]+)/);

      if (courseMatch) {
        trackAffiliateClick(referralCode, courseMatch[1]);
      }
    }
  }, [searchParams]);

  const trackAffiliateClick = async (
    referralCode: string,
    courseId: string,
  ) => {
    try {
      // Get user's IP and user agent for tracking
      const userAgent = navigator.userAgent;

      await fetch("/api/affiliate/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralCode,
          courseId,
          userAgent,
        }),
      });
    } catch (error) {
      console.error("Failed to track affiliate click:", error);
    }
  };

  // This component doesn't render anything visible
  return null;
}

/**
 * Hook to get stored affiliate referral code
 */
export function useAffiliateCode() {
  const getAffiliateCode = () => {
    if (typeof window === "undefined") return null;

    const code = localStorage.getItem("affiliate_ref");
    const timestamp = localStorage.getItem("affiliate_ref_timestamp");

    // Expire affiliate codes after 30 days
    if (code && timestamp) {
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      const storedTime = parseInt(timestamp);

      if (Date.now() - storedTime > thirtyDaysInMs) {
        localStorage.removeItem("affiliate_ref");
        localStorage.removeItem("affiliate_ref_timestamp");
        return null;
      }

      return code;
    }

    return null;
  };

  const clearAffiliateCode = () => {
    localStorage.removeItem("affiliate_ref");
    localStorage.removeItem("affiliate_ref_timestamp");
  };

  return { getAffiliateCode, clearAffiliateCode };
}
