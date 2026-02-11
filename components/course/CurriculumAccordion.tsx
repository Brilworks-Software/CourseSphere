import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Layers, Video, PlayCircle } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { formatHMS } from "@/lib/utils";

interface CurriculumAccordionProps {
  sections: any[];
  currentLessonId?: string;
  onLessonSelect?: (lessonId: string) => void;
}

export default function CurriculumAccordion({
  sections,
  currentLessonId,
  onLessonSelect,
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
                        {formatHMS(lesson.duration)}
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
