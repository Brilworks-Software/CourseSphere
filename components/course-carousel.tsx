"use client";
import React from "react";
import { CourseCard } from "@/components/course-card";
import type { Context } from "@/components/course-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

type Course = any;

interface CourseCarouselProps {
  courses: Course[];
  role?: "student" | "instructor" | string;
  context?: Context;
  isEnrolled?: boolean;
}

export default function CourseCarousel({
  courses,
  role,
  context,
  isEnrolled,
}: CourseCarouselProps) {
  if (!courses || courses.length === 0) return null;

  return (
    <Carousel
      className="w-full"
      showArrows={true}
      header={
          <>
            <h2 className="text-xl font-bold text-foreground">My Enrolled Courses</h2>
          </>
        }
      // You can pass a header prop if needed
    >
      <CarouselContent>
        {courses.map((course: any) => (
          <CarouselItem
            key={course.id}
            className="md:basis-1/2 lg:basis-1/4"
          >
            <CourseCard
              course={course}
              role={role}
              context={context}
              isEnrolled={!!isEnrolled}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* Arrows are rendered by Carousel when showArrows is true */}
    </Carousel>
  );
}
