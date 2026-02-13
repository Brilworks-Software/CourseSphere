"use client";

import Link from "next/link";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Course, UserRole } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Tag } from "lucide-react";
import { useUserContext } from "@/app/provider/user-context";
import { formatSentenceCase } from "@/lib/utils";

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
  isMyCourse?: boolean;
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
  isMyCourse = false,
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
  const href =
    course?.isOwned && baseHref.startsWith("/courses/")
      ? `${baseHref}?ow=1`
      : baseHref;

  const { user } = useUserContext();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = React.useState(false);

  const handleProceedToLogin = () => {
    const loginUrl = `/login${href ? `?next=${encodeURIComponent(href)}` : ""}`;
    router.push(loginUrl);
  };

  // Extract card inner content so we don't duplicate markup
  const CardInner = (
    <>
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
        <div className="flex items-top gap-2 mb-2 h-[50px]">
          <h2 className="text-base font-semibold line-clamp-2 flex-1 text-card-foreground">
            {title}
          </h2>
          <Badge className="h-fit">{price}</Badge>
        </div>
        {/* <div className="text-xs text-muted-foreground line-clamp-2 mb-2 min-h-8 max-h-8 overflow-hidden">
          {desc}
        </div> */}
        <div className="flex flex-wrap gap-2 mb-2 min-h-7">
          {category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {formatSentenceCase(category)}
            </Badge>
          )}
          {subCategory && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {formatSentenceCase(subCategory)}
            </Badge>
          )}
        </div>
      </div>
    </>
  );

  return (
    <Card
      className={`rounded-lg border bg-card shadow-sm hover:shadow-lg transition-shadow duration-200 max-w-lg ${className}`}
    >
      {/* If user is logged in, navigate normally. Otherwise show modal on click */}
      {user ? (
        <Link href={href} className="block">
          {CardInner}
        </Link>
      ) : (
        <button
          onClick={() => setShowLoginModal(true)}
          className="block text-left w-full"
          aria-haspopup="dialog"
        >
          {CardInner}
        </button>
      )}

      {/* Simple login prompt modal shown when unauthenticated users click the card */}
      {showLoginModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="relative max-w-md w-full bg-background border rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">
              Please log in to access this course
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please login or create an account to access the course content.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 rounded-md border bg-card hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToLogin}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:brightness-95 transition"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default CourseCard;
