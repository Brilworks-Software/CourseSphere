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
import AnnouncementStep from "./manage-course-form/AnnouncementStep";
import LiveStreamStep from "./manage-course-form/LiveStreamStep";

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
  const [billingType, setBillingType] = useState<string>(
    (course as any).billing_type ?? "one_time",
  );

  // Category details
  const [primaryCategory, setPrimaryCategory] = useState<string>(
    (course as any).primary_category ?? "",
  );
  const [subCategory, setSubCategory] = useState<string>(
    (course as any).sub_category ?? "",
  );

  // Image fields
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    (course as any).thumbnail_url ?? "",
  );

  // is_free and price
  const [isFree, setIsFree] = useState((course as any).is_free ?? true);
  const [price, setPrice] = useState(
    (course as any).price ? String((course as any).price) : "",
  );

  // Razorpay
  const [isRazorpayConnected, setIsRazorpayConnected] = useState<boolean>(
    (course as any).razorpay_connected ?? false,
  );
  const [razorpayKey, setRazorpayKey] = useState<string>(
    (course as any).razorpay_key ?? "",
  );

  // Add requirements and expectations fields
  const [requirements, setRequirements] = useState(
    (course as any).requirements ?? "",
  );
  const [expectations, setExpectations] = useState(
    (course as any).expectations ?? "",
  );

  // Stepper state: 0=Basic,1=Category,2=Pricing,3=Review
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const stepParam = searchParams?.get("step");
  const [step, setStep] = useState<number>(
    stepParam ? parseInt(stepParam, 10) : 0,
  );

  // Refs for autofocus/select behavior
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const primarySelectRef = useRef<HTMLButtonElement>(null);

  const stepTitles = [
    "Basic details",
    "Pricing & settings",
    "Curriculum",
    "Live stream",
    "Details",
    "Announcements",
  ];

  // Removed unused selectedCategory and COURSE_CATEGORIES from parent

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
        try {
          titleRef.current.select();
        } catch {}
      }
    } else if (step === 1) {
      try {
        primarySelectRef.current?.focus();
      } catch {}
    } else if (step === 2) {
      if (priceRef.current) {
        priceRef.current.focus();
        try {
          priceRef.current.select();
        } catch {}
      }
    }
  }, [step]);

  // Stepper Navigation Component
  function StepperNav({
    step,
    setStep,
  }: {
    step: number;
    setStep: (i: number) => void;
  }) {
    return (
      <nav aria-label="Order Steps">
        <ol className="flex md:flex-col gap-1 md:space-y-1 w-full overflow-x-auto md:overflow-visible">
          {stepTitles.map((title, i) => (
            <li key={i} className="flex-1 min-w-[120px]">
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
                  ${step === i ? "border-b-2 md:border-b-0 border-primary" : ""}
                `}
                aria-current={step === i ? "step" : undefined}
                onClick={() => setStep(i)}
              >
                <span className="flex-1 truncate">{title}</span>
                {step === i && (
                  <span className="ml-2 text-muted-foreground md:block hidden">
                    &rsaquo;
                  </span>
                )}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Mobile Stepper Header */}
      <div className="md:hidden w-full px-2 pt-2 pb-1 bg-background sticky top-0 z-20 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/courses/${course.id}?ow=1`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <span className="font-semibold text-base">{stepTitles[step]}</span>
        </div>
        <StepperNav step={step} setStep={setStep} />
      </div>
      <main className="flex-1 flex h-full relative overflow-x-auto">
        {/* Sidebar Stepper (Desktop) */}
        <div className="hidden md:block w-64 h-auto px-6 sticky top-0">
          <div className="mb-6 flex items-center gap-4">
            <Link href={`/courses/${course.id}?ow=1`}>
              <Button variant="ghost">
                <ChevronLeft /> Back
              </Button>
            </Link>
          </div>
          <StepperNav step={step} setStep={setStep} />
        </div>
        {/* Main Content */}
        <section className="flex-1 flex flex-col items-center h-full overflow-y-auto">
          <div className="w-full max-w-225 p-6">
            {/* Header (hide on mobile, show on desktop) */}
            <div className="mb-6 hidden md:block">
              <h2 className="text-lg font-semibold">{stepTitles[step]}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 0 &&
                  "Edit title, description and thumbnail for your course."}
                {step === 1 &&
                  "Edit the primary category and sub-category for your course."}
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
            <div className="pb-6">
              {step === 0 && (
                <BasicDetailsStep
                  courseId={course.id}
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
                  courseId={course.id}
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
              {step === 2 && <CurriculumStep courseId={course.id} />}
              {step === 3 && (
                <LiveStreamStep
                  courseId={course.id}
                  instructorId={(course as any).instructor_id || ""}
                />
              )}
              {step === 4 && (
                <DetailsCourseStep
                  courseId={course.id}
                  requirements={requirements}
                  setRequirements={setRequirements}
                  expectations={expectations}
                  setExpectations={setExpectations}
                />
              )}
              {step === 5 && (
                <>
                  <AnnouncementStep
                    courseId={course.id}
                    instructorId={(course as any).instructor_id || ""}
                  />
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
