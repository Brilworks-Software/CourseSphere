import React from "react";
import HtmlPreview from "@/components/html-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Users, Clock, FileText, Play } from "lucide-react";

export default function OverviewTab({
  course,
  instructor,
  organization,
  lessonsCount,
  formattedTotal,
  rating,
  reviewsCount,
  studentsCount,
  lecture_count,
  total_video_time,
}: any) {
  const nf = new Intl.NumberFormat();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              {course?.title || "Untitled course"}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-foreground">{rating}</span>
                <span className="text-muted-foreground">
                  • {nf.format(reviewsCount)} ratings
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-foreground">
                  {nf.format(studentsCount)}
                </span>
                <span className="text-muted-foreground">students</span>
              </div>
            </div>
          </div>
          {course?.description && (
            <div className="mt-4">
              <HtmlPreview html={course.description} />
            </div>
          )}
          {course?.requirements && (
            <div className="mt-6">
              <h4 className="text-base font-semibold mb-2">Requirements</h4>
              <HtmlPreview html={course.requirements} />
            </div>
          )}
          {course?.expectations && (
            <div className="mt-6">
              <h4 className="text-base font-semibold mb-2">
                What you'll learn
              </h4>
              <HtmlPreview html={course.expectations} />
            </div>
          )}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-base font-semibold">Course details</h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Play className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">
                      {lecture_count ?? lessonsCount} Lectures
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Short lessons for quick learning
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">
                      {total_video_time}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total video time
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">
                      Language: {course?.language ?? "English"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-background">
          <CardHeader>
            <CardTitle className="text-base">Instructor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img
                src={instructor?.profile_picture_url}
                alt={instructor?.first_name || instructor?.email}
                className="w-12 h-12 border border-border rounded-full object-cover"
              />
              <div>
                <div className="text-lg font-medium">
                  {(instructor?.first_name || "") +
                    (instructor?.last_name ? ` ${instructor.last_name}` : "") ||
                    instructor?.email}
                </div>
                {instructor?.bio && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {instructor.bio}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background">
          <CardHeader>
            <CardTitle className="text-base">Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img
                src={organization?.logo_url || organization?.thumbnail_url}
                alt={organization?.name}
                className="w-12 h-12 border border-border rounded-full object-cover"
              />
              <div>
                <div className="text-lg font-medium">{organization?.name}</div>
                {organization?.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {organization.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
