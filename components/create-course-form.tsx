"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ImageUploadWithCrop from "./image-upload";
import { COURSE_CATEGORIES } from "@/app/util/course_category";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useUserContext } from "@/app/provider/user-context";
import { PlusCircle, Check, XIcon, ChevronRight } from "lucide-react";
import Link from "next/link";
import Logo from "./logo";

export function CreateCourseForm() {
  const { user } = useUserContext();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // thumbnail and category states (start empty for creation)
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [primaryCategory, setPrimaryCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");

  // New fields for is_free and price
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");

  // NEW: billing type (one_time | monthly)
  const [billingType, setBillingType] = useState<string>("one_time");

  // NEW: Razorpay payment connect toggle and key
  const [isRazorpayConnected, setIsRazorpayConnected] = useState<boolean>(false);
  const [razorpayKey, setRazorpayKey] = useState<string>("");

  // Stepper state: 0=Basic,1=Category,2=Pricing,3=Review
  const [step, setStep] = useState<number>(0);

  // Refs for autofocus/select behavior
  const titleRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const priceRef = useRef<HTMLInputElement | null>(null);
  const primarySelectRef = useRef<HTMLButtonElement | null>(null);

  const stepTitles = [
    "Basic details",
    "Category",
    "Pricing & settings",
    "Review",
  ];

  const selectedCategory = COURSE_CATEGORIES.find(
    (c) => c.value === primaryCategory,
  );

  // validate the current step before moving forward
  const validateStep = () => {
    setError(null);
    // step mapping: 0=Basic,1=Category,2=Pricing
    if (step === 1) {
      if (!primaryCategory) {
        setError("Please select a primary category.");
        return false;
      }
      if (!subCategory) {
        setError("Please select a sub-category.");
        return false;
      }
    }
    if (step === 0) {
      if (!title.trim()) {
        setError("Course title is required.");
        return false;
      }
      if (!description.trim()) {
        setError("Course description is required.");
        return false;
      }
      if (!thumbnailUrl) {
        setError("Course thumbnail is required.");
        return false;
      }
    }
    if (step === 2) {
      if (typeof isFree !== "boolean") {
        setError("Course free/paid status is required.");
        return false;
      }
      if (!isFree && (!price || isNaN(Number(price)) || Number(price) <= 0)) {
        setError("Please enter a valid price for paid courses.");
        return false;
      }
    }
    return true;
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    // Validate price if not free
    if (!isFree && (!price || isNaN(Number(price)) || Number(price) <= 0)) {
      setError("Please enter a valid price for paid courses.");
      setLoading(false);
      return;
    }

    // Validate razorpay key when enabled and course is paid
    if (!isFree && isRazorpayConnected && !razorpayKey) {
      setError("Please provide the Razorpay Key ID to enable Razorpay payments.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
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
          instructor_id: user?.id,
          organization_id: user?.organization_id,
          is_free: isFree,
          price: isFree ? 0 : Number(price),
          billing_type: billingType,
          razorpay_connected: isRazorpayConnected && !isFree ? isRazorpayConnected : false,
          razorpay_key: !isFree && isRazorpayConnected ? razorpayKey : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create course");
      }

      const data = await response.json();
      setLoading(false);
      router.push(`/courses/${data.id}?ow=1`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // autofocus/select when entering a step
  useEffect(() => {
    setError(null);
    if (step === 0) {
      // Basic: focus title
      if (titleRef.current) {
        titleRef.current.focus();
        try {
          titleRef.current.select();
        } catch {}
      }
    } else if (step === 1) {
      // Category: focus primary select trigger
      try {
        primarySelectRef.current?.focus();
      } catch {}
    } else if (step === 2) {
      // Pricing: focus price
      if (priceRef.current) {
        priceRef.current.focus();
        try {
          priceRef.current.select();
        } catch {}
      }
    }
  }, [step]);

  // Show organization creation prompt if user has no organization
  if (!user?.organization_id) {
    return (
      <div className="text-center py-16">
        <div className="mb-4">
          <span className="inline-block rounded-full bg-muted p-4">
            <PlusCircle className="h-8 w-8 text-muted-foreground" />
          </span>
        </div>
        <p className="text-muted-foreground mb-2 text-lg font-medium">
          You need to create an Organization first
        </p>
        <p className="text-muted-foreground mb-6 text-sm">
          Before creating a course, please create your organization.
        </p>
        <Button onClick={() => router.push("/organization")}>
          Create your Organization
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="relative flex-1 flex overflow-auto">
        <div className="absolute top-3 right-0">
          <Button type="button" variant="destructive" onClick={() => router.back()}>
            <XIcon /> Cancel
          </Button>
        </div>
        {/* Sidebar Stepper */}
        <aside className="hidden md:block w-64 bg-background border-r border-border py-10 px-6">
          <div>
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 group"
            >
              <Logo
                width={36}
                height={36}
                textPosition="right"
                className="group"
                textClassName="text-2xl"
              />
            </Link>
            <div className="my-6">
              <span className="text-xs font-semibold text-muted-foreground tracking-widest">
                ORDER STEPS
              </span>
            </div>
            <nav aria-label="Order Steps">
              <ol className="space-y-1">
                {stepTitles.map((title, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className={`
                      group flex items-center w-full px-3 py-2 rounded-lg transition
                      text-left
                      ${
                        step === i
                          ? "bg-primary/10 text-primary font-semibold shadow-sm"
                          : "hover:bg-muted text-muted-foreground"
                      }
                      ${step > i ? "opacity-80" : ""}
                    `}
                      aria-current={step === i ? "step" : undefined}
                      onClick={() => {
                        if (i <= step) setStep(i);
                      }}
                    >
                      <span
                        className={`
                        flex items-center justify-center w-7 h-7 rounded-full border mr-3 text-sm font-medium
                        ${
                          step === i
                            ? "bg-primary text-primary-foreground border-primary"
                            : step > i
                              ? "bg-green-500 text-white border-green-500"
                              : "bg-card text-muted-foreground border-border"
                        }
                      `}
                      >
                        {step > i ? <Check className="w-4 h-4" /> : i + 1}
                      </span>
                      <span className="flex-1 truncate">{title}</span>
                      {step === i && (
                        <span className="ml-2 text-muted-foreground">
                          &rsaquo;
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-[700px] p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold">{stepTitles[step]}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 0 &&
                  "Add title, description and thumbnail to introduce your course."}
                {step === 1 &&
                  "Choose the primary category and sub-category for your course."}
                {step === 2 && "Set pricing and active status for the course."}
                {step === 3 && "Review all details before creating the course."}
              </p>
            </div>

            {/* Step Content */}
            <div className="pb-32">
              {/* Step content */}
              {step === 1 && (
                <div className="space-y-4">
                  <Label className="block text-sm font-medium mb-1">
                    Category *
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Select
                        value={primaryCategory}
                        onValueChange={(val) => {
                          setPrimaryCategory(val);
                          setSubCategory("");
                        }}
                        disabled={loading}
                        required
                      >
                        <SelectTrigger
                          className="w-full"
                          ref={primarySelectRef}
                        >
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

                    <div>
                      <Select
                        value={subCategory}
                        onValueChange={setSubCategory}
                        disabled={!primaryCategory || loading}
                        required
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
                </div>
              )}

              {step === 0 && (
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="space-y-4"
                >
                  <div>
                    <Label
                      htmlFor="title"
                      className="block text-sm font-medium text-muted-foreground mb-2"
                    >
                      Course Title *
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter course title"
                      ref={titleRef}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="description"
                      className="block text-sm font-medium text-muted-foreground mb-2"
                    >
                      Description *
                    </Label>
                    <Textarea
                      id="description"
                      rows={4}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter course description"
                      ref={descriptionRef}
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
                    {/* Hidden input for required validation */}
                    <input
                      type="text"
                      value={thumbnailUrl}
                      required
                      readOnly
                      style={{ display: "none" }}
                    />
                  </div>
                </form>
              )}

              {step === 2 && (
                <div className="space-y-4">
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
                        className="h-4 w-4 focus:ring-accent border-muted rounded"
                        disabled={loading}
                        required
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
                        onCheckedChange={(v) => setIsActive(Boolean(v))}
                        className="h-4 w-4 focus:ring-accent border-muted rounded"
                        disabled={loading}
                        required
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
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Review</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <strong>Title:</strong> {title}
                    </div>
                    <div>
                      <strong>Description:</strong> {description}
                    </div>
                    <div>
                      <strong>Category:</strong> {primaryCategory} /{" "}
                      {subCategory}
                    </div>
                    <div>
                      <strong>Price:</strong> {isFree ? "Free" : `₹${price}`}
                    </div>
                    <div>
                      <strong>Active:</strong> {isActive ? "Yes" : "No"}
                    </div>
                    {thumbnailUrl && (
                      <div>
                        <strong>Thumbnail:</strong>
                        <div className="mt-2">
                          <img
                            src={thumbnailUrl}
                            alt="thumb"
                            className="w-48 h-auto rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      {/* Fixed footer - always at bottom, centered content */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur border-t border-border py-4">
        <div className="mx-auto max-w-[1800px] px-6">
          <div className="flex justify-between w-full">
            <div>
              {step > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    setStep((s) => Math.max(0, s - 1));
                  }}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {step < 3 ? (
                <Button
                  onClick={() => {
                    if (validateStep()) setStep((s) => s + 1);
                  }}
                >
                  Next <ChevronRight />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (validateStep()) handleCreate();
                  }}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Course"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
