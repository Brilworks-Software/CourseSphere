import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Layers, Video, PlayCircle, CheckCircle2, Circle } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { formatHMS } from "@/lib/utils";

interface CurriculumAccordionProps {
  sections: any[];
  currentLessonId?: string;
  onLessonSelect?: (lessonId: string) => void;
  lessonProgress?: Record<string, { is_completed: boolean }>;
}

export default function CurriculumAccordion({
  sections,
  currentLessonId,
  onLessonSelect,
  lessonProgress = {},
}: CurriculumAccordionProps) {
  const [openSections, setOpenSections] = useState<string[]>(() =>
    sections.map((s: any) => s.id)
  );

  useEffect(() => {
    setOpenSections((prev) => {
      if (prev.length === 0 && sections.length > 0) {
        return sections.map((s: any) => s.id);
      }
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
      {sections?.map((section) => {
        const sectionLessons = section.lessons || [];
        const completedInSection = sectionLessons.filter(
          (l: any) => lessonProgress[l.id]?.is_completed
        ).length;
        const allDone =
          sectionLessons.length > 0 &&
          completedInSection === sectionLessons.length;

        return (
          <AccordionItem
            key={section.id}
            value={section.id}
            className="mb-2 border border-border rounded-lg bg-card overflow-hidden"
          >
            <AccordionTrigger className="flex-1 min-w-0 bg-card px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Layers className="w-5 h-5 min-w-6 text-primary" />
                <span className="font-semibold text-base flex-1 text-left">{section.title}</span>
                {section.description && (
                  <span className="ml-2 text-xs text-muted-foreground italic">
                    {section.description}
                  </span>
                )}
                {sectionLessons.length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap pl-2">
                    {completedInSection}/{sectionLessons.length}
                    {allDone && (
                      <CheckCircle2 className="inline-block w-3.5 h-3.5 text-green-500 ml-1 -mt-0.5" />
                    )}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-card">
              <div className="space-y-2 p-3">
                {sectionLessons.length ? (
                  sectionLessons.map((lesson: any) => {
                    const isCompleted = !!lessonProgress[lesson.id]?.is_completed;
                    const isOpened = lesson.id in lessonProgress;
                    const isCurrent = currentLessonId === lesson.id;

                    return (
                      <Button
                        key={lesson.id}
                        variant={isCurrent ? "secondary" : "ghost"}
                        className={clsx(
                          "flex items-center gap-2 w-full justify-start px-3 py-2",
                          isCurrent && "border border-primary text-primary font-semibold"
                        )}
                        onClick={() => onLessonSelect?.(lesson.id)}
                      >
                        {/* Progress icon */}
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 min-w-4 text-green-500 flex-shrink-0" />
                        ) : isCurrent ? (
                          <PlayCircle className="w-4 h-4 min-w-4 text-primary flex-shrink-0" />
                        ) : isOpened ? (
                          <Circle className="w-4 h-4 min-w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          lesson.video_url && (
                            <Video className="w-4 h-4 min-w-4 text-primary flex-shrink-0" />
                          )
                        )}

                        <span className="truncate">{lesson.title}</span>

                        {lesson.duration ? (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {formatHMS(lesson.duration)}
                          </span>
                        ) : null}
                      </Button>
                    );
                  })
                ) : (
                  <div className="text-xs text-muted-foreground italic">
                    No lessons in this section.
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
