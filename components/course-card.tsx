import Link from "next/link";
import * as React from "react";
import { Course, UserRole } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, User } from "lucide-react";

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
  const lessonsCount =
    (course.lessons as any)?.[0]?.count || (course._count?.lessons ?? 0);

  // Determine where the card should link when clicked
  const href = `/courses/${course.id}`;

  return (
    <Card className={`overflow-hidden max-w-96 ${className}`}>
      <Link href={href} className="no-underline block">
        <div className="p-2">
          <div>
            <img
              src={thumb}
              alt={title}
              className="rounded-sm object-cover max-h-60 aspect-video w-full"
            />
          </div>
          <CardContent className="p-0 pt-2">
            <CardTitle className="text-lg h-14">{title}</CardTitle>
            <div className="flex items-center text-sm mt-3 text-muted-foreground gap-4">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span>{course.instructor?.name || "Unknown"}</span>
              </div>

              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                <span>{lessonsCount} lessons</span>
              </div>
            </div>
            {/* <p className="text-sm text-muted-foreground line-clamp-2">{desc}</p> */}
          </CardContent>
        </div>
      </Link>

      {/* <CardFooter className="pt-0">
        <div className="flex w-full gap-2">
          {(context === "dashboard-admin" || context === "management") && (
            <>
              <Link href={`/courses/${course.id}`} className="w-full">
                <Button className="w-full" variant="secondary">
                  Manage
                </Button>
              </Link>
              <Badge
                className="whitespace-nowrap"
                variant={course.is_active ? "default" : "destructive"}
              >
                {course.is_active ? "Active" : "Inactive"}
              </Badge>
            </>
          )}

          {context === "public" && (
            <>
              {isEnrolled ? (
                <Link href={`/courses/${course.id}`} className="w-full">
                  <Button className="w-full" variant="secondary">
                    Continue Learning
                  </Button>
                </Link>
              ) : (
                // if onEnroll is provided call it, otherwise navigate to course page
                <div className="w-full">
                  {onEnroll ? (
                    <Button className="w-full" onClick={onEnroll}>
                      Enroll
                    </Button>
                  ) : (
                    <Link href={`/courses/${course.id}`} className="w-full">
                      <Button className="w-full">View Course</Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {context === "dashboard-student" && (
            <Link href={`/courses/${course.id}`} className="w-full">
              <Button className="w-full" variant="secondary">
                Open
              </Button>
            </Link>
          )}
        </div>
      </CardFooter> */}
    </Card>
  );
}

export default CourseCard;
