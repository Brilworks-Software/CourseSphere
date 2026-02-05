import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface PricingStepProps {
  courseId: string;
  isFree: boolean;
  setIsFree: (v: boolean) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  price: string;
  setPrice: (v: string) => void;
  billingType: string;
  setBillingType: (v: string) => void;
  isRazorpayConnected: boolean;
  setIsRazorpayConnected: (v: boolean) => void;
  razorpayKey: string;
  setRazorpayKey: (v: string) => void;
  loading: boolean;
  priceRef: RefObject<HTMLInputElement | null>;
}

export function PricingStep({
  courseId, isFree, setIsFree, isActive, setIsActive, price, setPrice, billingType, setBillingType,
  isRazorpayConnected, setIsRazorpayConnected, razorpayKey, setRazorpayKey, loading, priceRef
}: PricingStepProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await toast.promise(
        (async () => {
          // basic validations
          if (!isFree && (!price || isNaN(Number(price)) || Number(price) <= 0)) {
            throw new Error("Please enter a valid price for paid courses.");
          }
          if (!isFree && isRazorpayConnected && !razorpayKey) {
            throw new Error("Please provide the Razorpay Key ID to enable Razorpay payments.");
          }

          const res = await fetch(`/api/courses/${courseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              is_free: isFree,
              price: isFree ? 0 : Number(price),
              billing_type: billingType,
              is_active: isActive,
              razorpay_connected: isRazorpayConnected && !isFree ? isRazorpayConnected : false,
              razorpay_key: !isFree && isRazorpayConnected ? razorpayKey : null,
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.error || "Failed to save pricing");
          }
        })(),
        {
          loading: "Saving pricing...",
          success: "Pricing saved",
          error: "Failed to save pricing",
        }
      );
    } catch (e) {
      // handled by toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <Checkbox
            id="is_free"
            checked={isFree}
            onCheckedChange={(v) => {
              const val = Boolean(v);
              setIsFree(val);
              if (val) {
                setIsRazorpayConnected(false);
                setRazorpayKey("");
              }
            }}
            className="h-4 w-4 focus:ring-accent border-muted rounded"
            disabled={loading}
            required
          />
          <Label htmlFor="is_free" className="ml-2 block text-sm text-muted-foreground">
            Free Course
          </Label>
        </div>
        <div className="flex items-center">
          <Checkbox
            id="is_active"
            checked={isActive}
            onCheckedChange={(v) => setIsActive(Boolean(v))}
            className="h-4 w-4 focus:ring-accent border-muted rounded"
            disabled={loading}
            required
          />
          <Label htmlFor="is_active" className="ml-2 block text-sm text-muted-foreground">
            Course is active
          </Label>
        </div>
      </div>
      <div>
        <Label htmlFor="price" className="block text-sm font-medium text-muted-foreground mb-2">
          {billingType === "monthly" ? "Price per month (in ₹)" : "Price (in ₹)"}
        </Label>
        <div className="flex items-center space-x-4 mb-2">
          <label className="inline-flex items-center space-x-2">
            <input
              type="radio"
              name="billingType"
              value="one_time"
              checked={billingType === "one_time"}
              onChange={() => setBillingType("one_time")}
              disabled={loading}
            />
            <span className="text-sm">One-time</span>
          </label>
          <label className="inline-flex items-center space-x-2">
            <input
              type="radio"
              name="billingType"
              value="monthly"
              checked={billingType === "monthly"}
              onChange={() => setBillingType("monthly")}
              disabled={loading}
            />
            <span className="text-sm">Monthly</span>
          </label>
        </div>
        <Input
          id="price"
          type="number"
          min="0"
          step="1"
          value={isFree ? "" : price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={billingType === "monthly" ? "Enter monthly price" : "Enter course price"}
          disabled={isFree || loading}
          required={!isFree}
          ref={priceRef}
        />
      </div>
      {!isFree && (
        <div className="space-y-2">
          <div className="flex items-center">
            <Checkbox
              id="razorpay"
              checked={isRazorpayConnected}
              onCheckedChange={(v) => setIsRazorpayConnected(Boolean(v))}
              className="h-4 w-4 text-accent focus:ring-accent border-muted rounded"
              disabled={loading}
            />
            <Label htmlFor="razorpay" className="ml-2 block text-sm text-muted-foreground">
              Enable Razorpay payments
            </Label>
          </div>
          {isRazorpayConnected && (
            <div>
              <Label htmlFor="razorpay_key" className="block text-sm font-medium mb-1">
                Razorpay Key ID
              </Label>
              <Input
                id="razorpay_key"
                type="text"
                value={razorpayKey}
                onChange={(e) => setRazorpayKey(e.target.value)}
                placeholder="rzp_test_XXXXXXXXXXXX"
                disabled={loading}
                required={isRazorpayConnected}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add your Razorpay Key ID to enable payments. You can also connect via your dashboard later.
              </p>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading || saving}>
          {saving ? "Saving..." : "Save Pricing & Settings"}
        </Button>
      </div>
    </div>
  );
}
