"use client";

import Link from "next/link";
import * as React from "react";
import { usePathname } from "next/navigation";
import { Course, UserRole } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Tag } from "lucide-react";

export type Context =
  | "public"
  | "courses-list"
  | "dashboard-admin"
  | "dashboard-student"
  | "management";

interface CourseCardProps {
  course: Course | any;
  role?: UserRole | string;
  context?: Context;
  isEnrolled?: boolean;
  className?: string;
  onEnroll?: () => void;
}

/**
 * Reusable CourseCard
 * - Behavior changes based on `role` and `context` props
 * - Clicks navigate to role-appropriate pages by default
 */
export function CourseCard({
  course,
  role = "student",
  context = "public",
  isEnrolled = false,
  className = "",
  onEnroll,
}: CourseCardProps) {
  const title = course?.title || "Untitled";
  const desc = course?.description || "No description";
  const thumb = course?.thumbnail_url ?? "/default-thumbnail.png";
  const lessonsCount = (course.lessons as any)?.[0]?.count || 0;
  const org = course.organization;
  const price = course.is_free ? "Free" : `₹${course.price}`;
  const category = course.primary_category;
  const subCategory = course.sub_category;
  const pathname = usePathname();
  const baseHref = pathname === "/" ? "/dashboard" : `/courses/${course.id}`;
  // Only append the ow=1 query param when linking to the course detail page
  // and when the current user owns the course. This keeps other navigation
  // (like going to /dashboard) unchanged.
  const href =
    course?.isOwned && baseHref.startsWith("/courses/")
      ? `${baseHref}?ow=1`
      : baseHref;

  return (
    <Card
      className={`rounded-2xl border bg-card shadow-sm hover:shadow-lg transition-shadow duration-200 max-w-sm ${className}`}
    >
      <Link href={href} className="block">
        <div className="relative rounded-t-2xl overflow-hidden">
          <img
            src={thumb}
            alt={title}
            className="object-cover w-full h-36 md:h-40 lg:h-44 xl:h-48"
          />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between gap-2 mb-2 min-h-8">
            <div className="flex items-center gap-2">
              {org?.logo_url && (
                <img
                  src={org.logo_url}
                  alt={org.name}
                  className="w-6 h-6 rounded-full border bg-card object-cover"
                />
              )}
              {org?.name && (
                <span className="text-sm font-medium truncate">{org.name}</span>
              )}
              {course?.isOwned && (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-1 rounded whitespace-nowrap"
                >
                  Your Course
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <BookOpen className="h-4 w-4 mr-1" />
              <span className="text-xs">{lessonsCount} lessons</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-base font-semibold line-clamp-2 flex-1 text-card-foreground">
              {title}
            </h2>
            <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground font-medium ml-2 whitespace-nowrap">
              {price}
            </span>
          </div>
          <div className="text-xs text-muted-foreground line-clamp-2 mb-2 min-h-8 max-h-8 overflow-hidden">
            {desc}
          </div>
          <div className="flex flex-wrap gap-2 mb-2 min-h-7">
            {category && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {category}
              </Badge>
            )}
            {subCategory && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {subCategory}
              </Badge>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}

export default CourseCard;
