import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import CourseHeader from "@/components/course/CourseHeader";
import InstructorCard from "@/components/course/InstructorCard";
import HtmlPreview from "@/components/html-preview";
import EnrollButton from "@/components/course/EnrollButton";
import OrganizationBanner from "@/components/course/OrganizationBanner";

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
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mx-auto">
        <CardHeader>
          <CourseHeader course={course} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InstructorCard instr={course?.instructor || {}} />
            <div className="col-span-2 md:col-span-2 border  p-4 flex flex-col gap-4">
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
                  <div className="text-sm text-muted-foreground">Total Duration</div>
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
      <div className="mt-6">
        <OrganizationBanner organization={course?.organization} />
      </div>
    </div>
  );
}
