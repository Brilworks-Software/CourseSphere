"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Video, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/loader";
import { useUserContext } from "@/app/provider/user-context";
import HtmlPreview from "@/components/html-preview";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import clsx from "clsx";

export default function AdminSingleCourse({ id }: { id: string }) {
  const { user } = useUserContext();
  const [course, setCourse] = useState<any>(null);
  // Store sections (with lessons) instead of flat lessons
  const [sections, setSections] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const fetchCourseAndSections = async () => {
      try {
        const params = new URLSearchParams({
          courseId: String(id),
          userId: String(user.id),
          role: String(user.role),
        });
        const res = await fetch(`/api/admin/courses?${params.toString()}`);
        if (!res.ok) {
          router.replace("/dashboard/courses");
          return;
        }
        const data = await res.json();
        setCourse(data);
        setSections(data.sections || []);
      } catch {
        router.replace("/dashboard/courses");
      }
    };
    fetchCourseAndSections();
  }, [user, id, router]);

  if (!user || !course) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  // Helpers
  const allLessons = sections.flatMap((s: any) => s.lessons || []);
  const totalDuration = allLessons.reduce((acc, l) => acc + (l.duration || 0), 0);
  const totalLectures = allLessons.length;

  // Accordion for sections/lessons (view-only, no add/delete)
  function CurriculumAccordion({ sections }: { sections: any[] }) {
    const [openSections, setOpenSections] = useState<string[]>(() =>
      sections.map((s: any) => s.id)
    );
    useEffect(() => {
      setOpenSections(sections.map((s: any) => s.id));
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
        {sections?.map((section: any) => (
          <AccordionItem
            key={section.id}
            value={section.id}
            className="mb-2 border border-border rounded-lg bg-card overflow-hidden"
          >
            <AccordionTrigger className="flex-1 min-w-0 bg-card px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-5 h-5 min-w-6 text-primary" />
                <span className="font-semibold text-base">{section.title}</span>
                {section.description && (
                  <span className="ml-2 text-xs text-muted-foreground ">
                    {section.description}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-card">
              <div className="space-y-2 p-3">
                {section.lessons?.length ? (
                  section.lessons.map((lesson: any, idx: number) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 px-2 py-2 rounded hover:bg-muted/40 transition"
                    >
                      <div className="shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-card-foreground line-clamp-2 overflow-hidden leading-tight">
                          {lesson.title}
                        </h3>
                        {lesson.duration && (
                          <p className="text-sm text-muted-foreground">
                            Duration: {Math.floor(lesson.duration / 60)}:
                            {String(lesson.duration % 60).padStart(2, "0")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground italic">
                    No lessons in this section.
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  return (
    <div className="relative space-y-10 bg-background min-h-screen">
      {/* Back link */}
      <div className="bg-accent/60 mx-auto p-6 rounded-b-2xl shadow-sm border-b">
        <div className="max-w-7xl mx-auto relative">
          <Link
            href="/dashboard/courses"
            className="text-primary hover:underline mb-4 inline-flex items-center gap-1"
          >
            {/* Add a left arrow for better UX */}
            <span className="mr-1">&larr;</span> Back to courses
          </Link>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mt-2">
            <div>
              <Badge
                variant={course.is_active ? "default" : "destructive"}
                className="mb-2"
              >
                {course.is_active ? "Active" : "Inactive"}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mt-1 text-foreground tracking-tight">
                {course.title}
              </h1>
              <div className="text-muted-foreground text-base mt-2">
                {course.subtitle}
              </div>
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/dashboard/courses/manage/${course.id}`)
                }
                className="ml-2"
              >
                <Pencil className="h-5 w-5 mr-2" /> Edit Course
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-muted-foreground text-sm">
            <span>
              Created by{" "}
              <span className="font-medium">{course.author || "Unknown"}</span>
            </span>
            <span>• {totalLectures} lectures</span>
            <span>
              • {Math.floor(totalDuration / 60)}h {totalDuration % 60}m total
            </span>
            <span>• Level: {course.level}</span>
            <span>• Language: {course.language?.toUpperCase()}</span>
          </div>
          {/* Thumbnail and quick info */}
          <div className="flex flex-col md:flex-row gap-10 mt-6">
            <div className="flex-1">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title || "Course thumbnail"}
                  className="w-full max-w-lg h-64 object-cover rounded-xl border shadow-lg"
                />
              ) : (
                <div className="w-full max-w-lg h-64 bg-muted rounded-xl flex items-center justify-center text-sm text-muted-foreground border">
                  No image
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto space-y-10 px-2 md:px-0">
        {/* What you'll learn */}
        {course.expectations && (
          <div className="bg-muted/60 rounded-xl p-6 border shadow-sm">
            <div className="font-semibold text-lg mb-3">What you'll learn</div>
            <HtmlPreview html={course.expectations} />
          </div>
        )}

        {/* Requirements */}
        {course.requirements && (
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="font-semibold text-lg mb-2">Requirements</div>
            <HtmlPreview
              className="text-base text-muted-foreground"
              html={course.requirements}
            />
          </div>
        )}

        {/* Description */}
        <div className="bg-card rounded-xl p-6 border shadow-sm">
          <div className="font-semibold text-lg mb-2">Description</div>
          <HtmlPreview
            className="prose max-w-none text-base"
            html={course.description}
          />
        </div>

        {/* Lessons/Course Content */}
        <div className="bg-card rounded-xl p-6 border shadow-sm">
          <div className="font-semibold text-lg mb-2">Course content</div>
          <div className="rounded-lg border border-border overflow-hidden">
            {sections && sections.length > 0 ? (
              <CurriculumAccordion sections={sections} />
            ) : (
              <div className="text-center py-8">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No sections/lessons yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
