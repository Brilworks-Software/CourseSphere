"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUserContext } from "@/app/provider/user-context";
import Loader from "@/components/loader";
import { ManageCourseForm } from "@/components/manage-course-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ManageCoursePage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useUserContext();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const courseId = id;

  useEffect(() => {
    if (!user || !courseId) return;
    const fetchCourse = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to fetch course");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setCourse(data); // Use the API response directly
      } catch (err: any) {
        setError(err.message || "Failed to fetch course");
      }
      setLoading(false);
    };
    fetchCourse();
  }, [user, courseId]);

  if (!user || loading) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Loader />
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-full w-full flex flex-col justify-center items-center gap-4">
        <p className="text-destructive font-semibold">{error}</p>
        <Link href="/dashboard/courses">
          <Button>Back to Courses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto">
      {/* <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/courses">
          <Button variant="ghost">Back</Button>
        </Link>
        <h1 className="text-2xl font-bold">Manage Course</h1>
      </div> */}
      <ManageCourseForm course={course} />
    </div>
  );
}
