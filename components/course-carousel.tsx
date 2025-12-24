"use client";
import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import type { Context } from "@/components/course-card"; // add this import

type Course = any;

interface CourseCarouselProps {
  courses: Course[];
  role?: "student" | "instructor" | string;
  context?: Context; // update type here
  isEnrolled?: boolean;
}

export default function CourseCarousel({
  courses,
  role,
  context,
  isEnrolled,
}: CourseCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.9);
    const to =
      direction === "left" ? el.scrollLeft - amount : el.scrollLeft + amount;
    el.scrollTo({ left: to, behavior: "smooth" });
  };

  if (!courses || courses.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Previous"
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background"
      >
        <ChevronLeft className="h-5 w-5 text-foreground" />
      </button>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth px-8 py-2 hide-scrollbar"
        role="list"
      >
        {courses.map((course: any) => (
          <div
            key={course.id}
            className="min-w-[260px] md:min-w-[320px] flex-shrink-0"
          >
            <CourseCard
              course={course}
              role={role}
              context={context}
              isEnrolled={!!isEnrolled}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Next"
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background"
      >
        <ChevronRight className="h-5 w-5 text-foreground" />
      </button>
    </div>
  );
}
