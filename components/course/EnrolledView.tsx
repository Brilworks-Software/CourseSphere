import { Card } from "@/components/ui/card";
import { useState } from "react";
import Tabs from "@/components/course/StudentSingleCourseTabs";
import CurriculumAccordion from "@/components/course/CurriculumAccordion";
import MarkCompleteButton from "@/components/course/MarkCompleteButton";
import CourseCompletionBanner from "@/components/course/CourseCompletionBanner";
import { downloadCertificatePDF } from "@/components/certificate/certificate-pdf";

interface EnrolledViewProps {
  course: any;
  instructor: any;
  organization: any;
  currentLesson: any;
  allLessons: any[];
  signedVideoUrl: string;
  sections: any[];
  setLessonId: (lessonId: string) => void;
  lessonProgress: Record<string, { is_completed: boolean }>;
  isCourseCompleted: boolean;
  certificate: any | null;
  studentId: string;
  onMarkComplete: (lessonId: string) => Promise<void>;
  onCertificateIssued?: (cert: any) => void;
}

export default function EnrolledView({
  course,
  instructor,
  organization,
  currentLesson,
  allLessons,
  signedVideoUrl,
  sections,
  setLessonId,
  lessonProgress,
  isCourseCompleted,
  certificate,
  studentId,
  onMarkComplete,
  onCertificateIssued,
}: EnrolledViewProps) {
  const [activeTab, setActiveTab] = useState("Overview");

  function handleViewCertificate() {
    setActiveTab("Certificate");
  }

  async function handleDownloadCertificate() {
    try {
      // Prefer explicit certificate data if available
      const cert = certificate as any;
      const certificateNumber =
        cert?.certificate_number ||
        cert?.certificateNumber ||
        cert?.certificateId ||
        "";
      const studentName = cert?.student_name || cert?.studentName || "Student";
      const courseName =
        cert?.course_name || cert?.courseName || course?.title || "Course";
      const instructorName =
        cert?.instructor_name || cert?.instructorName || instructor?.name || "";
      const organizationName =
        cert?.organization_name ||
        cert?.organizationName ||
        (organization?.name as string) ||
        "CourseSphere";
      const issuedAt =
        cert?.issued_at ||
        cert?.issuedAt ||
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      const totalHours = cert?.total_hours || cert?.totalHours || undefined;
      const logoUrl =
        (course?.organization as any)?.logo_url ||
        (organization as any)?.logo_url ||
        (course as any)?.logoUrl ||
        undefined;

      await downloadCertificatePDF({
        certificateNumber,
        studentName,
        courseName,
        instructorName,
        organizationName,
        issuedAt,
        totalHours,
        logoUrl,
      });
    } catch (err) {
      console.error("Failed to download certificate", err);
    }
  }

  const currentLessonCompleted = currentLesson?.id
    ? !!lessonProgress[currentLesson.id]?.is_completed
    : false;

  return (
    <div className="space-y-4 p-4 max-w-450 mx-auto">
      {/* Course completion banner */}
      {isCourseCompleted && (
        <CourseCompletionBanner
          onViewCertificate={handleViewCertificate}
          onDownloadCertificate={handleDownloadCertificate}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <Card className="overflow-hidden">
            <div className="p-0">
              {currentLesson && allLessons ? (
                <div className="w-full">
                  <div className="aspect-video overflow-hidden">
                    {/* Simple HTML5 video player */}
                    <video
                      src={signedVideoUrl || ""}
                      controls
                      controlsList="nodownload"
                      preload="metadata"
                      className="w-full h-full"
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

          {/* Lesson title + Mark Complete button */}
          {currentLesson && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h2 className="font-semibold text-base leading-snug">
                  {currentLesson.title}
                </h2>
                {currentLesson.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {currentLesson.description}
                  </p>
                )}
              </div>
              <MarkCompleteButton
                lessonId={currentLesson.id}
                isCompleted={currentLessonCompleted}
                onMarkComplete={onMarkComplete}
              />
            </div>
          )}

          <Card>
            <div className="p-4">
              <Tabs
                course={course}
                instructor={instructor}
                organization={organization}
                isCourseCompleted={isCourseCompleted}
                certificate={certificate}
                studentId={studentId}
                onCertificateIssued={onCertificateIssued}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-23">
            <CurriculumAccordion
              sections={sections}
              currentLessonId={currentLesson?.id}
              onLessonSelect={setLessonId}
              lessonProgress={lessonProgress}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
