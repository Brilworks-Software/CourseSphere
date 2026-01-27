"use client";
import React, { useState, useEffect } from "react";

export default function CourseHeader({ course }: any) {
  const [isThumbOpen, setIsThumbOpen] = useState(false);
  const [thumbLoading, setThumbLoading] = useState(true);
  const [thumbError, setThumbError] = useState(false);

  useEffect(() => {
    if (!isThumbOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsThumbOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isThumbOpen]);

  return (
    <div className="overflow-hidden">
      <div className="flex flex-col md:flex-row relative">
        {course?.thumbnail_url ? (
          <div className="md:w-1/2 w-full aspect-video bg-muted flex items-center justify-center relative">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsThumbOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setIsThumbOpen(true);
              }}
              aria-label="Open course thumbnail"
              className="w-full h-full cursor-pointer relative"
            >
              {thumbLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 animate-pulse rounded bg-muted-foreground/30" />
                </div>
              )}
              <img
                src={course.thumbnail_url}
                alt={course?.title || "Course Thumbnail"}
                loading="lazy"
                onLoad={() => setThumbLoading(false)}
                onError={() => {
                  setThumbLoading(false);
                  setThumbError(true);
                }}
                className="object-cover w-full h-full rounded-none"
              />
              {!thumbError && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/40 text-white px-3 py-1 rounded-full text-sm">View</div>
                </div>
              )}
              {thumbError && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Image unavailable</div>
              )}
            </div>
          </div>
        ) : (
          <div className="md:w-1/2 w-full aspect-video bg-muted flex items-center justify-center">
            <div className="text-sm text-muted-foreground">No thumbnail</div>
          </div>
        )}

        {/* Thumbnail lightbox/modal */}
        {isThumbOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsThumbOpen(false)} aria-hidden={!isThumbOpen}>
            <div className="max-w-5xl max-h-[80vh] w-full p-2 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setIsThumbOpen(false)} aria-label="Close thumbnail" className="absolute top-2 right-2 text-white text-2xl leading-none">×</button>
              <img src={course.thumbnail_url} alt={course?.title || "Course Thumbnail"} className="object-contain w-full h-full rounded-lg shadow-lg bg-black" />
            </div>
          </div>
        )}

        <div className=" flex-1 p-6 flex flex-col gap-3">
          <h1 className="text-3xl font-bold text-foreground mb-2">{course?.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Category: <span className="font-medium text-foreground">{course?.primary_category || "-"}</span></span>
            <span>Subcategory: <span className="font-medium text-foreground">{course?.sub_category || "-"}</span></span>
            <span>Lessons: <span className="font-medium text-foreground">{(course?.lessons || []).length}</span></span>
            <span>Status: <span className="font-medium text-foreground">{course?.is_active ? "Active" : "Inactive"}</span></span>
            <span>Created: <span className="font-medium text-foreground">{course?.created_at ? new Date(course.created_at).toLocaleDateString() : "-"}</span></span>
            <span>{course?.is_free ? <span className="font-semibold">Free</span> : <span className="font-semibold">₹{course?.price}</span>}</span>
          </div>
          <p className="text-base mt-2 text-muted-foreground">{course?.description || "No description available"}</p>
        </div>
      </div>
    </div>
  );
}
