"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Course } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import ImageUploadWithCrop from "./image-upload";
import { COURSE_CATEGORIES } from "@/app/util/course_category";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function ManageCourseForm({ course }: { course: Course }) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || "");
  const [isActive, setIsActive] = useState(course.is_active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // keep track of the thumbnail URL from the image uploader
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    (course as any).thumbnail_url ?? ""
  );

  // add category state (primary and sub)
  const [primaryCategory, setPrimaryCategory] = useState<string>(
    (course as any).primary_category ?? ""
  );
  const [subCategory, setSubCategory] = useState<string>(
    (course as any).sub_category ?? ""
  );

  // new fields for is_free and price
  const [isFree, setIsFree] = useState((course as any).is_free ?? true);
  const [price, setPrice] = useState(
    (course as any).price ? String((course as any).price) : ""
  );

  // NEW: billing type (one_time | monthly)
  const [billingType, setBillingType] = useState<string>(
    (course as any).billing_type ?? "one_time"
  );

  // NEW: Razorpay payment connect toggle and key
  const [isRazorpayConnected, setIsRazorpayConnected] = useState<boolean>(
    (course as any).razorpay_connected ?? false
  );
  const [razorpayKey, setRazorpayKey] = useState<string>(
    (course as any).razorpay_key ?? ""
  );

  // derive selected primary category to show its children as sub-options
  const selectedCategory = COURSE_CATEGORIES.find(
    (c) => c.value === primaryCategory
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate price if not free
    if (!isFree && (!price || isNaN(Number(price)) || Number(price) <= 0)) {
      setError("Please enter a valid price for paid courses.");
      setLoading(false);
      return;
    }

    // NEW: validate razorpay key when enabled and course is paid
    if (!isFree && isRazorpayConnected && !razorpayKey) {
      setError("Please provide the Razorpay Key ID to enable Razorpay payments.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          is_active: isActive,
          thumbnail_url: thumbnailUrl === "" ? null : thumbnailUrl,
          primary_category: primaryCategory === "" ? null : primaryCategory,
          sub_category: subCategory === "" ? null : subCategory,
          is_free: isFree,
          price: isFree ? 0 : Number(price),
          // NEW: include billing type and razorpay info
          billing_type: billingType,
          razorpay_connected: isRazorpayConnected && !isFree ? isRazorpayConnected : false,
          razorpay_key: !isFree && isRazorpayConnected ? razorpayKey : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update course");
      }

      router.refresh();
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 overflow-auto">
      {error && (
        <Alert variant="destructive" className="flex items-start">
          <AlertTriangle className="mr-2 h-4 w-4 shrink-0" />
          <div>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      )}

      <div>
        <Label htmlFor="title">Course Title *</Label>
        <Textarea
          id="title"
          rows={2}
          required
          title="Course Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          title="Course Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <ImageUploadWithCrop
          value={thumbnailUrl}
          onChange={(url) => setThumbnailUrl(url ?? "")}
          showPreview={true}
          disabled={loading}
          aspectRatio={"landscape"}
        />
      </div>

      {/* Category selects: choose primary category first, then sub-category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="w-full">
          <Label className="block text-sm font-medium mb-1">Category</Label>
          <Select
            value={primaryCategory}
            onValueChange={(val) => {
              setPrimaryCategory(val);
              // reset sub-category when primary changes
              setSubCategory("");
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {COURSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full">
          <Label className="block text-sm font-medium mb-1">Sub-category</Label>
          <Select
            value={subCategory}
            onValueChange={setSubCategory}
            disabled={!primaryCategory || loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select sub-category" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {selectedCategory?.children?.map((sub) => (
                <SelectItem key={sub.value} value={sub.value}>
                  {sub.label}
                </SelectItem>
              )) ?? null}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <Checkbox
            id="is_free"
            checked={isFree}
            onCheckedChange={(v) => {
              const val = Boolean(v);
              setIsFree(val);
              // When marking as free, clear/reset any Razorpay config so it isn't submitted accidentally
              if (val) {
                setIsRazorpayConnected(false);
                setRazorpayKey("");
              }
            }}
            className="h-4 w-4 text-accent focus:ring-accent border-muted rounded"
            disabled={loading}
          />
          <Label
            htmlFor="is_free"
            className="ml-2 block text-sm text-muted-foreground"
          >
            Free Course
          </Label>
        </div>
        <div className="flex items-center">
          <Checkbox
            id="is_active"
            checked={isActive}
            onCheckedChange={(checked) => setIsActive(Boolean(checked))}
            className="h-4 w-4 text-accent focus:ring-accent border-muted rounded"
            disabled={loading}
          />
          <Label
            htmlFor="is_active"
            className="ml-2 block text-sm text-muted-foreground"
          >
            Course is active
          </Label>
        </div>
      </div>

      {/* Price input, only enabled if not free */}
      <div>
        <Label
          htmlFor="price"
          className="block text-sm font-medium text-muted-foreground mb-2"
        >
          {/* NEW: dynamic label depending on billing type */}
          {billingType === "monthly" ? "Price per month (in ₹)" : "Price (in ₹)"}
        </Label>

        {/* NEW: Billing type radio buttons */}
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

        <input
          id="price"
          type="number"
          min="0"
          step="1"
          value={isFree ? "" : price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={billingType === "monthly" ? "Enter monthly price" : "Enter course price"}
          disabled={isFree || loading}
          required={!isFree}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* NEW: Razorpay enable toggle and key input - only for paid courses */}
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
            <Label
              htmlFor="razorpay"
              className="ml-2 block text-sm text-muted-foreground"
            >
              Enable Razorpay payments
            </Label>
          </div>

          {isRazorpayConnected && (
            <div>
              <Label htmlFor="razorpay_key" className="block text-sm font-medium mb-1">
                Razorpay Key ID
              </Label>
              <input
                id="razorpay_key"
                type="text"
                value={razorpayKey}
                onChange={(e) => setRazorpayKey(e.target.value)}
                placeholder="rzp_test_XXXXXXXXXXXX"
                disabled={loading}
                className="w-full border rounded px-3 py-2"
                required={isRazorpayConnected}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add your Razorpay Key ID to enable payments. You can also connect via your dashboard later.
              </p>
            </div>
          )}
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Course"
        )}
      </Button>
    </form>
  );
}
