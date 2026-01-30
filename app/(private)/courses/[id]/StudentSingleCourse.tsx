"use client";
import { useEffect, useState } from "react";
import { VideoPlayer } from "@/components/video-player";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Loader from "@/components/loader";
import { useUserContext } from "@/app/provider/user-context";
import EnrollButton from "@/components/course/EnrollButton";
import Tabs from "@/components/course/StudrntSingleCourseTabs";
import LessonsList from "@/components/course/LessonsList";
import CourseHeader from "@/components/course/CourseHeader";
import InstructorCard from "@/components/course/InstructorCard";
import OrganizationBanner from "@/components/course/OrganizationBanner";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Video, Layers, ChevronDown, ChevronRight, PlayCircle } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import HtmlPreview from "@/components/html-preview";

export default function StudentSingleCourse({
  id,
  searchParams,
}: {
  id: string;
  searchParams?: { lesson?: string } | Promise<{ lesson?: string }>;
}) {
  // Guard clause: don't render or fetch if id is not available
  if (!id) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  // --- unwrap searchParams if it's a Promise ---
  const [lessonId, setLessonId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (searchParams instanceof Promise) {
      searchParams.then((params) => {
        if (!cancelled) setLessonId(params?.lesson);
      });
    } else {
      setLessonId(searchParams?.lesson);
    }
    return () => {
      cancelled = true;
    };
  }, [searchParams]);
  // --------------------------------------------------

  const { user } = useUserContext();

  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Only fetch if user and id are available
    if (!user || !id) return;
    setLoading(true);
    fetch(`/api/student/courses?courseId=${id}&studentId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setCourse(data);
        setSections(data.sections || []);
        setEnrollment(data.enrollment);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, user]);
  if (loading || !user || !id) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  const isEnrolled = !!enrollment;
  // Get current lesson
  const allLessons = sections.flatMap((s: any) => s.lessons || []);
  const currentLesson = lessonId
    ? allLessons.find((l: any) => l.id === lessonId)
    : allLessons[0];

  // compute total duration (seconds) and formatter
  const totalDurationSeconds =
    allLessons?.reduce((acc: number, l: any) => acc + (l?.duration || 0), 0) || 0;

  const formatDuration = (secs: number) => {
    if (!secs) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // CurriculumAccordion for student view
  function CurriculumAccordion({
    sections,
    currentLessonId,
    onLessonSelect,
  }: {
    sections: any[];
    currentLessonId?: string;
    onLessonSelect?: (lessonId: string) => void;
  }) {
    // Only set openSections on initial mount, not on every sections change
    const [openSections, setOpenSections] = useState<string[]>(() =>
      sections.map((s: any) => s.id)
    );

    // Only update openSections if sections length changes (e.g. after refetch), not on every render
    useEffect(() => {
      setOpenSections((prev) => {
        // If sections length changed (e.g. after enroll), update openSections
        if (prev.length === 0 && sections.length > 0) {
          return sections.map((s: any) => s.id);
        }
        // If a section was removed, remove it from openSections
        const validIds = sections.map((s: any) => s.id);
        return prev.filter((id) => validIds.includes(id));
      });
    }, [sections.length]);

    const handleValueChange = (values: string[] | string) => {
      setOpenSections(Array.isArray(values) ? values : [values]);
    };

    return (
      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={handleValueChange}
        className="mb-4"
      >
        {sections?.map((section) => (
          <AccordionItem key={section.id} value={section.id} className="mb-2 border border-border rounded-lg bg-card overflow-hidden">
            <AccordionTrigger className="flex-1 min-w-0 bg-card px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-5 h-5 text-primary" />
                <span className="font-semibold text-base ">{section.title}</span>
                {section.description && (
                  <span className="ml-2 text-xs text-muted-foreground italic ">{section.description}</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-card">
              <div className="space-y-2 p-3">
                {section.lessons?.length ? (
                  section.lessons.map((lesson: any) => (
                    <Button
                      key={lesson.id}
                      variant={currentLessonId === lesson.id ? "secondary" : "ghost"}
                      className={clsx(
                        "flex items-center gap-2 w-full justify-start px-3 py-2",
                        currentLessonId === lesson.id
                          ? "border border-primary text-primary font-semibold"
                          : ""
                      )}
                      onClick={() => onLessonSelect?.(lesson.id)}
                    >
                      {currentLessonId === lesson.id ? (
                        <PlayCircle className="w-4 h-4 text-primary" />
                      ) : (
                        lesson.video_url && <Video className="w-4 h-4 text-primary" />
                      )}
                      <span className="truncate">{lesson.title}</span>
                      {lesson.duration ? (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, "0")}
                        </span>
                      ) : null}
                    </Button>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground italic">No lessons in this section.</div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  // If student and not enrolled, show enrollment option (reuse InstructorCard + CourseHeader)
  if (user?.role === "student" && !isEnrolled) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mx-auto">
          {/* Use CourseHeader component for thumbnail + meta */}
          <CardHeader>
            <CourseHeader course={course} />
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Instructor Card */}
              <InstructorCard instr={course?.instructor || {}} />

              {/* Course Summary + Enroll Button */}
              <div className="col-span-2 md:col-span-2 border  p-4 flex flex-col gap-4">
                {/* Render course description as HTML */}
                {course?.description && (
                  <HtmlPreview html={course.description} className="mb-4" />
                )}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Lessons</div>
                    <div className="font-medium text-foreground">
                      {allLessons?.length || 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Total Duration
                    </div>
                    <div className="font-medium text-foreground">
                      {formatDuration(totalDurationSeconds)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Price</div>
                    <div className="font-medium text-foreground">
                      {course?.is_free ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <span>₹{course?.price}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <EnrollButton
                    courseId={id}
                    userId={user.id}
                    isFree={!!course?.is_free}
                    price={course?.price}
                  />
                  <div className="text-xs text-muted-foreground mt-2">
                    {course?.is_free
                      ? "This course is free — enroll now to get immediate access."
                      : "Secure checkout — you will get full access to all lessons after enrolling."}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization banner */}
        <div className="mt-6">
          <OrganizationBanner organization={course?.organization} />
        </div>
      </div>
    );
  }

  // Enrolled view: show CourseHeader, video + tabs and lessons list
  return (
    <div className="space-y-8 p-4 max-w-[1800px] mx-auto">
      {/* <CourseHeader course={course} /> */}

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <div className="p-0">
              {currentLesson && allLessons ? (
                <div className="w-full">
                  <div className="aspect-video">
                    <VideoPlayer
                      lesson={currentLesson}
                      lessons={allLessons}
                      courseId={id}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No lessons available for this course
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <Tabs
                course={course}
                instructor={course?.instructor}
                organization={course?.organization}
              />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {/* Make the curriculum list sticky on large screens */}
          <div className="lg:sticky lg:top-23">
            <CurriculumAccordion
              sections={sections}
              currentLessonId={currentLesson?.id}
              onLessonSelect={(lessonId) => setLessonId(lessonId)}
            />
          </div>
        </div>
      </div>

    </div>
  );
}

