import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const MarkdownEditor = dynamic(() => import("@/components/MarkdownEditor"), {
  ssr: false,
});

interface DetailsCourseStepProps {
  courseId: string;
  requirements: string;
  setRequirements: (v: string) => void;
  expectations: string;
  setExpectations: (v: string) => void;
}

const DetailsCourseStep: FC<DetailsCourseStepProps> = ({
  courseId,
  requirements,
  setRequirements,
  expectations,
  setExpectations,
}) => {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await toast.promise(
        (async () => {
          const res = await fetch(`/api/courses/${courseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requirements,
              expectations,
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.error || "Failed to save details");
          }
        })(),
        {
          loading: "Saving details...",
          success: "Details saved",
          error: "Failed to save details",
        },
      );
    } catch (e) {
      // handled by toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <div>
        <Label className="mb-2 text-xl font-bold" htmlFor="requirements">
          What is required for learn?
        </Label>
        <p className="mb-3">
          List the required skills, experience, tools or equipment learners
          should have prior to taking your course. If there are no requirements,
          use this space as an opportunity to lower the barrier for beginners.
        </p>
        <MarkdownEditor
          value={requirements}
          onChange={setRequirements}
          placeholder="List any prerequisites, tools, or knowledge needed for this course..."
          textareaName="requirements"
        />
      </div>
      <div>
        <Label className="mb-2 mt-9 text-xl font-bold" htmlFor="expectations">
          What you will learn in the detail course?
        </Label>
        <p className="mb-3">
          Describe the skills, knowledge, or competencies learners will gain
          after completing your course.
        </p>
        <MarkdownEditor
          value={expectations}
          onChange={setExpectations}
          placeholder="Describe what students will learn or achieve after completing this course..."
          textareaName="expectations"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Details"}
        </Button>
      </div>
    </form>
  );
};

export default DetailsCourseStep;
