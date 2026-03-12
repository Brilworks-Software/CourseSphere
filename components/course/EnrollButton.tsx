"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Loader2, TriangleAlert, X } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAffiliateCode } from "@/components/affiliate/AffiliateTracker";

// Extend window to include Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_ENABLED = process.env.NEXT_PUBLIC_RAZORPAY_ENABLED === "true";

export default function EnrollButton({
  courseId,
  userId,
  isFree,
  price,
  courseName,
  userEmail,
  userName,
}: {
  courseId: string;
  userId: string;
  isFree?: boolean;
  price?: number | null;
  courseName?: string;
  userEmail?: string;
  userName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [referralDiscount, setReferralDiscount] = useState<any>(null);
  const [checkingReferral, setCheckingReferral] = useState(false);

  const { getAffiliateCode } = useAffiliateCode();

  const handleApplyCoupon = async () => {
    if (!couponCode) return;

    // Check if referral discount is already applied
    if (referralDiscount) {
      setError(
        "Cannot apply coupon code when referral discount is active. Only one discount code can be applied at a time.",
      );
      return;
    }

    setApplyingCoupon(true);
    setError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupon: couponCode, courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid coupon");

      setAppliedCoupon(data);
    } catch (err: any) {
      setError(err.message);
      setAppliedCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");

    // After removing coupon, check if referral discount should be applied
    const affiliateCode = getAffiliateCode();
    if (affiliateCode && !referralDiscount) {
      // Trigger referral discount check
      const checkReferralDiscount = async () => {
        try {
          const res = await fetch("/api/affiliate/validate-discount", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              affiliateCode,
              courseId,
              userId,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setReferralDiscount(data.discount);
          }
        } catch (err) {
          console.log("Referral discount check failed:", err);
        }
      };

      checkReferralDiscount();
    }
  };

  // Check for referral discount on component mount
  React.useEffect(() => {
    const checkReferralDiscount = async () => {
      const affiliateCode = getAffiliateCode();
      if (!affiliateCode || !courseId || !userId || isFree) return;

      // Don't apply referral discount if coupon is already applied
      if (appliedCoupon) {
        console.log("Coupon already applied, skipping referral discount");
        return;
      }

      setCheckingReferral(true);
      try {
        const res = await fetch("/api/affiliate/validate-discount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliateCode,
            courseId,
            userId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setReferralDiscount(data.discount);
        }
      } catch (err) {
        // Silently fail - referral discount is optional
        console.log("Referral discount check failed:", err);
      } finally {
        setCheckingReferral(false);
      }
    };

    checkReferralDiscount();
  }, [courseId, userId, isFree, appliedCoupon, getAffiliateCode]);

  // ─── Free enroll (existing flow) ─────────────────────────────────────────
  const handleFreeEnroll = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/student/courses/enroll", {
        method: "POST",
        body: JSON.stringify({ courseId, userId }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "[EnrollButton] Enrollment failed - status:",
          response.status,
          "error:",
          errorData,
        );
        setError("Enrollment failed. Please try again.");
        setLoading(false);
        return;
      }

      globalThis.location.reload();
    } catch (err: any) {
      console.error("[EnrollButton] Free enrollment error:", err);
      setError(err?.message ?? "Enrollment failed. Please try again.");
      setLoading(false);
    }
  };

  // ─── Paid enroll via Razorpay ─────────────────────────────────────────────
  const handlePaidEnroll = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get Affiliate ID if it exists
      const affiliateCode = getAffiliateCode();

      // 2. Create order on server
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({
          courseId,
          userId,
          couponCode: appliedCoupon?.valid ? couponCode : undefined,
          affiliateCode: affiliateCode || undefined,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        console.error(
          "[EnrollButton] Failed to create order - status:",
          orderRes.status,
          "error:",
          orderData.error,
        );
        setError(orderData.error ?? "Failed to create payment order.");
        setLoading(false);
        return;
      }

      const { orderId, amount, currency, key } = orderData;

      // 2. Open Razorpay checkout
      const options = {
        key,
        amount,
        currency,
        name: "CourseSphere",
        description: courseName ?? "Course Purchase",
        order_id: orderId,
        prefill: {
          email: userEmail ?? "",
          name: userName ?? "",
        },
        theme: { color: "#6366f1" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          // 3. Verify payment on server
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
            headers: { "Content-Type": "application/json" },
          });

          const verifyData = await verifyRes.json();

          if (verifyRes.ok && verifyData.success) {
            globalThis.location.reload();
          } else {
            console.error(
              "[EnrollButton] Payment verification failed - error:",
              verifyData.error,
            );
            setError("Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let RazorpayConstructor = (globalThis as any).Razorpay;

      // If the checkout script isn't loaded for some reason, load it dynamically
      if (!RazorpayConstructor) {
        const scriptSrc = "https://checkout.razorpay.com/v1/checkout.js";
        try {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector(
              `script[src="${scriptSrc}"]`,
            );
            if (existing) {
              // If the script tag exists but Razorpay isn't yet attached, poll briefly
              if ((globalThis as any).Razorpay) {
                return resolve();
              }
              let waited = 0;
              const iv = setInterval(() => {
                if ((globalThis as any).Razorpay) {
                  clearInterval(iv);
                  return resolve();
                }
                waited += 50;
                if (waited > 3000) {
                  clearInterval(iv);
                  console.error(
                    "[EnrollButton] Razorpay not available after 3s timeout",
                  );
                  return reject(
                    new Error("Razorpay not available after script load."),
                  );
                }
              }, 50);
              return;
            }

            const s = document.createElement("script");
            s.src = scriptSrc;
            s.async = true;
            s.onload = () => {
              // Poll for the global to be set (Razorpay script may take a tick)
              const start = Date.now();
              const poll = setInterval(() => {
                if ((globalThis as any).Razorpay) {
                  clearInterval(poll);
                  return resolve();
                }
                if (Date.now() - start > 3000) {
                  clearInterval(poll);
                  console.error(
                    "[EnrollButton] Razorpay not available after script load",
                  );
                  return reject(
                    new Error("Razorpay not available after script load."),
                  );
                }
              }, 50);
            };
            s.onerror = () => {
              console.error(
                "[EnrollButton] Failed to load Razorpay script from:",
                scriptSrc,
              );
              reject(new Error("Failed to load Razorpay script."));
            };
            document.body.appendChild(s);
          });

          // Refresh constructor reference after load
          RazorpayConstructor = (globalThis as any).Razorpay;
        } catch (e: any) {
          console.error(
            "[EnrollButton] Error loading Razorpay script - error:",
            e?.message,
          );
          setError(
            e?.message ??
              "Payment script not loaded. Please refresh and try again.",
          );
          setLoading(false);
          return;
        }
      }

      const rzp = new RazorpayConstructor(options);
      rzp.on("payment.failed", (response: any) => {
        console.error(
          "[EnrollButton] Razorpay payment failed - error:",
          response?.error,
        );
        setError(
          response?.error?.description ?? "Payment failed. Please try again.",
        );
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error("[EnrollButton] Paid enrollment error:", err);
      setError(err?.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  // Paid course but Razorpay is disabled via feature flag
  if (!isFree && !RAZORPAY_ENABLED) {
    return (
      <Button type="button" className="w-full" disabled>
        Purchase Unavailable
      </Button>
    );
  }

  const isPaid = !isFree && price && price > 0;

  let label: string;
  // Calculate display price: start with base price, apply referral discount, then coupon discount
  let currentPrice = price || 0;
  let totalSavings = 0;

  // Apply referral discount first (10%)
  if (referralDiscount && !isFree) {
    currentPrice = referralDiscount.finalPrice;
    totalSavings += referralDiscount.discountAmount;
  }

  // Apply coupon discount on top of referral discount
  const displayPrice = appliedCoupon ? appliedCoupon.final_price : currentPrice;
  if (appliedCoupon) {
    totalSavings += appliedCoupon.discount_amount;
  }

  if (loading) {
    label = isPaid ? "Processing..." : "Enrolling...";
  } else if (isFree) {
    label = "Enroll for Free";
  } else if (displayPrice) {
    label = `Buy Course — ₹${displayPrice.toLocaleString("en-IN")}`;
  } else {
    label = "Enroll in Course";
  }

  return (
    <div className="w-full space-y-4">
      {/* Referral Discount Display */}
      {referralDiscount && !isFree && (
        <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                🎉 Referral Discount Applied!
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-500">
                10% off with code: {referralDiscount.affiliateCode}
              </span>
            </div>
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              -₹{referralDiscount.discountAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="space-y-2">
          {appliedCoupon ? (
            <div className="flex items-center justify-between p-2.5 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  "{couponCode}" Applied
                </span>
                <span className="text-xs text-green-600 dark:text-green-500">
                  Additional ₹{appliedCoupon.discount_amount} off
                </span>
              </div>
              <button
                onClick={removeCoupon}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : referralDiscount ? (
            // Show message when referral discount is active
            <div className="p-2.5 border rounded-lg bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <div className="text-center">
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  Coupon codes cannot be used with referral discounts. Only one
                  discount code can be applied at a time.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={loading || applyingCoupon}
                className="h-9"
              />
              <Button
                variant="secondary"
                className="h-9 px-3 shrink-0"
                onClick={handleApplyCoupon}
                disabled={!couponCode || loading || applyingCoupon}
              >
                {applyingCoupon ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Price Breakdown */}
      {(referralDiscount || appliedCoupon) && !isFree && (
        <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Original Price:</span>
            <span className="line-through text-muted-foreground">
              ₹{price?.toLocaleString("en-IN")}
            </span>
          </div>

          {referralDiscount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-600 dark:text-blue-400">
                Referral Discount (10%):
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                -₹{referralDiscount.discountAmount.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {appliedCoupon && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">
                Coupon Discount:
              </span>
              <span className="text-green-600 dark:text-green-400">
                -₹{appliedCoupon.discount_amount.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-semibold">Final Price:</span>
            <span className="font-semibold text-lg text-primary">
              ₹{displayPrice.toLocaleString("en-IN")}
            </span>
          </div>

          {totalSavings > 0 && (
            <div className="text-center">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                You save ₹{totalSavings.toLocaleString("en-IN")} total!
              </span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Button
          type="button"
          className="w-full"
          onClick={isPaid ? handlePaidEnroll : handleFreeEnroll}
          disabled={loading}
        >
          {label}
        </Button>
        {error && (
          <Alert variant="destructive" className="mt-2">
            <TriangleAlert className="h-4 w-4 mt-0.5 text-destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
