import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import HtmlPreview from "@/components/html-preview";
import EnrollButton from "@/components/course/EnrollButton";
import OrganizationBanner from "@/components/course/OrganizationBanner";
import CurriculumAccordion from "@/components/course/CurriculumAccordion";
import InstructorCard from "@/components/course/InstructorCard";

interface EnrollmentViewProps {
  course: any;
  allLessons: any[];
  totalDurationSeconds: number;
  formatDuration: (secs: number) => string;
  id: string;
  user: any;
}

export default function EnrollmentView({
  course,
  allLessons,
  totalDurationSeconds,
  formatDuration,
  id,
  user,
}: EnrollmentViewProps) {
  return (
    <div className="space-y-8 bg-background px-2 md:px-6 py-6">
      <div className="max-w-7xl mx-auto bg-card rounded-xl p-6 border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <Badge
              variant={course?.is_active ? "default" : "destructive"}
              className="mb-2"
            >
              {course?.is_active ? "Active" : "Inactive"}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mt-1 text-foreground tracking-tight">
              {course?.title}
            </h1>
            {course?.subtitle && (
              <div className="text-muted-foreground text-base mt-2">
                {course.subtitle}
              </div>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-muted-foreground text-sm">
              <span>
                Created by{" "}
                <span className="font-medium">
                  {course?.author || course?.instructor_name || "Unknown"}
                </span>
              </span>
              <span>• {allLessons?.length || 0} lectures</span>
              <span>
                • {Math.floor(totalDurationSeconds / 3600)}h{" "}
                {Math.floor(totalDurationSeconds / 60) % 60}m total
              </span>
              <span>• Level: {course?.level || "-"}</span>
              <span>• Language: {course?.language?.toUpperCase() || "-"}</span>
            </div>
          </div>

          <div className="w-full md:w-80">
            {course?.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course?.title || "Course thumbnail"}
                className="w-full h-48 object-cover rounded-xl border shadow-lg"
              />
            ) : (
              <div className="w-full h-48 bg-muted rounded-xl flex items-center justify-center text-sm text-muted-foreground border">
                No image
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-4">
            {course?.expectations && (
              <div className="bg-muted/60 rounded-xl p-4 border">
                <div className="font-semibold text-lg mb-2">
                  What you'll learn
                </div>
                <HtmlPreview html={course.expectations} />
              </div>
            )}

            {course?.requirements && (
              <div>
                <div className="font-semibold text-lg mb-2">Requirements</div>
                <HtmlPreview
                  className="text-base text-muted-foreground"
                  html={course.requirements}
                />
                </div>
            )}

              <div className="font-semibold text-lg mb-2">Description</div>
              <HtmlPreview
                className="prose max-w-none text-base"
                html={course.description}
              />
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="border rounded-xl p-4 bg-card">
              <InstructorCard instr={course?.instructor || {}} />
              <div className="mt-4">
                <div className="text-sm text-muted-foreground">Lessons</div>
                <div className="font-medium text-foreground">
                  {allLessons?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Total Duration
                </div>
                <div className="font-medium text-foreground">
                  {formatDuration(totalDurationSeconds)}
                </div>
                <div className="text-sm text-muted-foreground mt-2">Price</div>
                <div className="font-medium text-foreground">
                  {course?.is_free ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    <span>₹{course?.price}</span>
                  )}
                </div>
              </div>
              <div className="mt-4">
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
        </div>

        {/* Course content / curriculum */}
        <div className="mt-6">
          <div className="font-semibold text-lg mb-3">Course content</div>
          <div className="rounded-lg border border-border overflow-hidden">
            {course?.sections && course.sections.length > 0 ? (
              <CurriculumAccordion sections={course.sections} />
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  No sections/lessons yet.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <OrganizationBanner organization={course?.organization} />
      </div>
    </div>
  );
}
