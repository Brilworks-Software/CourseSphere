import type { Course } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import DetailsCourseStep from "@/components/manage-course-form/DetailsCourseStep";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { BasicDetailsStep } from "./manage-course-form/BasicDetailsStep";
import { PricingStep } from "./manage-course-form/PricingStep";
import { CurriculumStep } from "./manage-course-form/CurriculumStep";
import { toast } from "sonner";
import AnnouncementStep from "./manage-course-form/AnnouncementStep";

export function ManageCourseForm({ course }: { course: Course }) {
  // Basic details
  const [title, setTitle] = useState(course.title);
  const [subtitle, setSubtitle] = useState((course as any).subtitle ?? "");
  const [description, setDescription] = useState(course.description || "");
  const [language, setLanguage] = useState((course as any).language ?? "en");
  const [level, setLevel] = useState((course as any).level ?? "");
  const [isActive, setIsActive] = useState(course.is_active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Billing type for PricingStep
  const [billingType, setBillingType] = useState<string>((course as any).billing_type ?? "one_time");

  // Category details
  const [primaryCategory, setPrimaryCategory] = useState<string>((course as any).primary_category ?? "");
  const [subCategory, setSubCategory] = useState<string>((course as any).sub_category ?? "");

  // Image fields
  const [thumbnailUrl, setThumbnailUrl] = useState<string>((course as any).thumbnail_url ?? "");

  // Status fields
  const [status, setStatus] = useState((course as any).status ?? "draft");
  const [lastSubmittedAt, setLastSubmittedAt] = useState((course as any).last_submitted_at ?? "");
  const [publishedAt, setPublishedAt] = useState((course as any).published_at ?? "");

  // is_free and price
  const [isFree, setIsFree] = useState((course as any).is_free ?? true);
  const [price, setPrice] = useState((course as any).price ? String((course as any).price) : "");

  // Razorpay
  const [isRazorpayConnected, setIsRazorpayConnected] = useState<boolean>((course as any).razorpay_connected ?? false);
  const [razorpayKey, setRazorpayKey] = useState<string>((course as any).razorpay_key ?? "");

  // Add requirements and expectations fields
  const [requirements, setRequirements] = useState((course as any).requirements ?? "");
  const [expectations, setExpectations] = useState((course as any).expectations ?? "");

  // Stepper state: 0=Basic,1=Category,2=Pricing,3=Review
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const stepParam = searchParams?.get("step");
  const [step, setStep] = useState<number>(stepParam ? parseInt(stepParam, 10) : 0);

  // Refs for autofocus/select behavior
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const primarySelectRef = useRef<HTMLButtonElement>(null);

  const stepTitles = [
    "Basic details",
    "Pricing & settings",
    "Curriculum",
    "Details",
    "Announcements",
  ];

  // Removed unused selectedCategory and COURSE_CATEGORIES from parent

  // validate the current step before moving forward
  const validateStep = () => {
    setError(null);
    if (step === 1) {
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

  const handleUpdate = async () => {
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

    await toast.promise(
      (async () => {
        try {
          const response = await fetch(`/api/courses/${course.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: course.id,
              title,
              subtitle,
              description,
              language,
              level,
              is_active: isActive,
              thumbnail_url: thumbnailUrl === "" ? null : thumbnailUrl,
              primary_category: primaryCategory === "" ? null : primaryCategory,
              sub_category: subCategory === "" ? null : subCategory,
              status,
              last_submitted_at: lastSubmittedAt || null,
              published_at: publishedAt || null,
              is_free: isFree,
              price: isFree ? 0 : Number(price),
              razorpay_connected: isRazorpayConnected && !isFree ? isRazorpayConnected : false,
              razorpay_key: !isFree && isRazorpayConnected ? razorpayKey : null,
              organization_id: (course as any).organization_id || null,
              instructor_id: (course as any).instructor_id || null,
              requirements,
              expectations,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to update course");
          }

          setLoading(false);
          router.refresh();
        } catch (err: any) {
          setError(err.message);
          setLoading(false);
          throw err;
        }
      })(),
      {
        loading: "Updating course...",
        success: "Course updated successfully!",
        error: "Failed to update course.",
      }
    );
  };

  // autofocus/select when entering a step
  // Update step from URL on mount
  useEffect(() => {
    if (stepParam && !isNaN(Number(stepParam))) {
      setStep(parseInt(stepParam, 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepParam]);

  // Update URL when step changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("step", String(step));
      const newUrl = `${pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, [step, pathname]);

  useEffect(() => {
    setError(null);
    if (step === 0) {
      if (titleRef.current) {
        titleRef.current.focus();
        try { titleRef.current.select(); } catch {}
      }
    } else if (step === 1) {
      try { primarySelectRef.current?.focus(); } catch {}
    } else if (step === 2) {
      if (priceRef.current) {
        priceRef.current.focus();
        try { priceRef.current.select(); } catch {}
      }
    }
  }, [step]);

  return (
    <div className="h-full flex flex-col bg-background">
      <main className="flex-1 flex">
        {/* Sidebar Stepper */}
        <aside className="hidden md:block w-64 bg-background border-r border-border px-6 min-h-[80vh] sticky top-0">
          <div className="mb-6 flex items-center gap-4">
            <Link href={`/courses/${course.id}?ow=1`}>
              <Button variant="ghost"><ChevronLeft /> Back</Button>
            </Link>
          </div>
          <div>
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
                      onClick={() => { setStep(i); }}
                    >
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
        <section className="flex-1 flex flex-col items-center overflow-auto">
          <div className="w-full max-w-225 p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold">{stepTitles[step]}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 0 && "Edit title, description and thumbnail for your course."}
                {step === 1 && "Edit the primary category and sub-category for your course."}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="flex items-start mb-4">
                <AlertTriangle className="mr-2 h-4 w-4 shrink-0" />
                <div>
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </div>
              </Alert>
            )}

            {/* Step Content */}
            <div className="pb-32">
              {step === 0 && (
                <BasicDetailsStep
                  title={title}
                  setTitle={setTitle}
                  subtitle={subtitle}
                  setSubtitle={setSubtitle}
                  description={description}
                  setDescription={setDescription}
                  language={language}
                  setLanguage={setLanguage}
                  level={level}
                  setLevel={setLevel}
                  primaryCategory={primaryCategory}
                  setPrimaryCategory={setPrimaryCategory}
                  subCategory={subCategory}
                  setSubCategory={setSubCategory}
                  thumbnailUrl={thumbnailUrl}
                  setThumbnailUrl={setThumbnailUrl}
                  loading={loading}
                  titleRef={titleRef}
                  descriptionRef={descriptionRef}
                  primarySelectRef={primarySelectRef}
                />
              )}
              {step === 1 && (
                <PricingStep
                  isFree={isFree}
                  setIsFree={setIsFree}
                  isActive={isActive}
                  setIsActive={setIsActive}
                  price={price}
                  setPrice={setPrice}
                  billingType={billingType}
                  setBillingType={setBillingType}
                  isRazorpayConnected={isRazorpayConnected}
                  setIsRazorpayConnected={setIsRazorpayConnected}
                  razorpayKey={razorpayKey}
                  setRazorpayKey={setRazorpayKey}
                  loading={loading}
                  priceRef={priceRef}
                />
              )}
              {step === 2 && (
                <CurriculumStep courseId={course.id} />
              )}
              {step === 3 && (
                <DetailsCourseStep
                  requirements={requirements}
                  setRequirements={setRequirements}
                  expectations={expectations}
                  setExpectations={setExpectations}
                />
              )}
              {step === 4 && (
                <>
                  {/* @ts-ignore: instructor_id may be undefined for some old courses, fallback to empty string */}
                  <AnnouncementStep courseId={course.id} instructorId={(course as any).instructor_id || ""} />
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      {/* Fixed footer - always at bottom, centered content */}
      <footer className="fixed bottom-0 left-0 z-50 right-0 bg-card/80 backdrop-blur border-t border-border py-4">
        <div className="mx-auto max-w-450 px-6">
          <div className="flex justify-end w-full">
            <div>
                <Button
                  onClick={() => {
                    if (validateStep()) handleUpdate();
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Course"
                  )}
                </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
