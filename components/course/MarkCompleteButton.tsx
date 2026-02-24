"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkCompleteButtonProps {
  lessonId: string;
  isCompleted: boolean;
  onMarkComplete: (lessonId: string) => Promise<void>;
}

export default function MarkCompleteButton({
  lessonId,
  isCompleted,
  onMarkComplete,
}: MarkCompleteButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (isCompleted || loading) return;
    setLoading(true);
    try {
      await onMarkComplete(lessonId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={isCompleted ? "outline" : "default"}
      className={cn(
        "gap-2 transition-all",
        isCompleted && "border-green-500 text-green-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 cursor-default"
      )}
      onClick={handleClick}
      disabled={isCompleted || loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isCompleted ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : null}
      {isCompleted ? "Completed" : "Mark as Complete"}
    </Button>
  );
}
