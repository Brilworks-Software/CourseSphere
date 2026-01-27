"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Clock, FileText, Play } from "lucide-react";

// helpers
function totalSecondsFromCourse(course: any) {
  try {
    const lessons = course?.lessons ?? [];
    if (!lessons.length) return 0;

    // Sum raw durations (unknown unit)
    const sumRaw = lessons.reduce((sum: number, l: any) => sum + (Number(l.duration) || 0), 0);
    const avgRaw = sumRaw / lessons.length;

    // Heuristic:
    // - If average raw duration > 10 -> likely durations are in seconds (e.g. 60, 120).
    // - Otherwise treat raw as minutes.
    const likelySeconds = avgRaw > 10;

    if (likelySeconds) {
      // durations are seconds already
      return Math.round(sumRaw);
    } else {
      // durations provided as minutes -> convert to seconds
      return Math.round(sumRaw * 60);
    }
  } catch (e) {
    return 0;
  }
}

function formatHMS(totalSeconds: number) {
  if (totalSeconds === null || totalSeconds === undefined) return "—";
  if (totalSeconds <= 0) return "0s";

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  // Build a compact label depending on available units
  if (h > 0) {
    // include seconds only if no minutes (rare) or you want finer detail; keep h and m
    return s ? `${h}h ${m}m ${s}s` : `${h}h ${m}m`;
  }
  if (m > 0) {
    return s ? `${m}m ${s}s` : `${m}m`;
  }
  return `${s}s`;
}

export default function Tabs({ course, instructor, organization }: any) {
  const tabs = ["Overview"];
  const [active, setActive] = useState(tabs[0]);

  // compute derived values (updated to use seconds)
  const lessonsCount = (course?.lessons ?? []).length;
  const totalSeconds = totalSecondsFromCourse(course);
  const formattedTotal = formatHMS(totalSeconds);
  const reviewsCount = Number(course?.reviews_count ?? 0);
  const studentsCount = Number(course?.students_count ?? (course?.enrollment ? 1 : 0));
  const rating = course?.rating ?? 4.4;

  // small formatter
  const nf = new Intl.NumberFormat();

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b pb-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-3 py-1 text-sm rounded ${active === t ? "font-medium border-b-2 border-primary" : "text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        {active === "Overview" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="flex-1">
                {/* Overview badge + title */}
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold">{course?.title || "Untitled course"}</h2>
                </div>

                {/* rating row */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-foreground">{rating}</span>
                      <span className="text-muted-foreground">• {nf.format(reviewsCount)} ratings</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-foreground">{nf.format(studentsCount)}</span>
                      <span className="text-muted-foreground">students</span>
                    </div>
                  </div>

                </div>

                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{course?.description || "No description available."}</p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-base font-semibold">What you'll learn</h4>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      <li>Use specific steps to immediately increase productivity.</li>
                      <li>Avoid common time-management traps.</li>
                      <li>Build real-world projects and gain practical experience.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-base font-semibold">Course details</h4>
                    <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <Play className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">{lessonsCount} Lectures</div>
                          <div className="text-xs text-muted-foreground">Short lessons for quick learning</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">{formattedTotal}</div>
                          <div className="text-xs text-muted-foreground">Total video time</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">Language: {course?.language ?? "English"}</div>
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
                    <img src={instructor?.profile_picture_url} alt={instructor?.first_name || instructor?.email} className="w-12 h-12 border border-border rounded-full object-cover" />
                    <div>
                      <div className="text-lg font-medium">{(instructor?.first_name || "") + (instructor?.last_name ? ` ${instructor.last_name}` : "") || instructor?.email}</div>
                      {/* <div className="text-sm text-muted-foreground">{instructor?.role}</div> */}
                      {instructor?.bio && <p className="mt-2 text-sm text-muted-foreground">{instructor.bio}</p>}
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
                    <img src={organization?.logo_url || organization?.thumbnail_url} alt={organization?.name} className="w-12 h-12 border border-border rounded-full object-cover" />
                    <div>
                      <div className="text-lg font-medium">{organization?.name}</div>
                      {/* {organization?.slug && <div className="text-sm text-muted-foreground">{organization.slug}</div>} */}
                      {organization?.description && <p className="mt-2 text-sm text-muted-foreground">{organization.description}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {active === "Announcements" && (
          <div className="text-sm text-muted-foreground">Announcements will appear here.</div>
        )}
        {active === "Reviews" && (
          <div className="text-sm text-muted-foreground">Course reviews placeholder.</div>
        )}
        {active === "Learning tools" && (
          <div className="text-sm text-muted-foreground">Learning tools: reminders, resources, etc.</div>
        )}
      </div>
    </div>
  );
}
