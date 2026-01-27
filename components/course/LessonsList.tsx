"use client";
import React from "react";
import Link from "next/link";
import { Play, Clock } from "lucide-react";

export default function LessonsList({ lessons, currentLessonId, courseId }: any) {
  return (
    <div className="sticky top-20">
      <div>
        <div>
          <div className="flex flex-col gap-3">
            {lessons && lessons.length > 0 ? (
              lessons.map((lesson: any, index: number) => (
                <Link
                  key={lesson.id}
                  href={`/courses/${courseId}?lesson=${lesson.id}`}
                  className={`group border rounded-lg px-4 py-3 flex items-center gap-4 transition hover:bg-accent/30 ${
                    currentLessonId === lesson.id ? "ring-2 ring-primary bg-accent/10" : ""
                  }`}
                >
                  <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-muted">
                    <Play className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground group-hover:underline">
                      {index + 1}. {lesson.title}
                    </div>
                    {lesson.duration && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3 inline" />
                        {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, "0")}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No lessons available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
