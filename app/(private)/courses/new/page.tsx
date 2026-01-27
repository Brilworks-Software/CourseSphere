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
    <div className="max-w-[1800px] mx-auto">
      <CreateCourseForm />
    </div>
  );
}
