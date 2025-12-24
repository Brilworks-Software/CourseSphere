"use client";
import { useUserContext } from "@/app/provider/user-context";
import { CreateCourseForm } from "@/components/create-course-form";
import Loader from "@/components/loader";

export default async function NewCoursePage() {
const { user } = useUserContext();

if (!user) {
    return <div className="h-dvh w-full flex justify-center items-center"><Loader /></div>;
  }
  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-6">
        Create New Course
      </h1>
      <CreateCourseForm />
    </div>
  );
}
