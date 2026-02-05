import { Card } from "@/components/ui/card";
import Tabs from "@/components/course/StudrntSingleCourseTabs";
import CurriculumAccordion from "@/components/course/CurriculumAccordion";

interface EnrolledViewProps {
  course: any;
  instructor: any;
  organization: any;
  currentLesson: any;
  allLessons: any[];
  signedVideoUrl: string;
  sections: any[];
  setLessonId: (lessonId: string) => void;
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
}: EnrolledViewProps) {
  return (
    <div className="space-y-8 p-4 max-w-450 mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <div className="p-0">
              {currentLesson && allLessons ? (
                <div className="w-full">
                  <div className="aspect-video">
                    {/* Simple HTML5 video player */}
                    <video
                      src={signedVideoUrl || ""}
                      controls
                      controlsList="nodownload"
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
          <Card>
            <div className="p-4">
              <Tabs
                course={course}
                instructor={instructor}
                organization={organization}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
