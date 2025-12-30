"use client";
import { useUserContext } from "@/app/provider/user-context";
import AdminSingleCourse from "./AdminSingleCourse";
import StudentSingleCourse from "./StudentSingleCourse";
import { useParams, useSearchParams } from "next/navigation";
import Loader from "@/components/loader";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function DashboardPage({
  searchParams,
}: {
  // searchParams may include `lesson` and `ow` (owned flag)
  searchParams?: { lesson?: string; ow?: string };
}) {
  const { user } = useUserContext();
  const params = useParams();
  const id = params?.id as string;

  // In a client component we must read query params from the browser using
  // useSearchParams(). Next may not pass `searchParams` into client components,
  // so prefer the hook and fall back to the optional prop if provided.
  const clientSearchParams = useSearchParams?.();
  const ow = clientSearchParams?.get("ow") ?? searchParams?.ow;

  if (!user || !id)
    return (
      <div>
        <Loader />
      </div>
    );

  // If the logged-in user is an admin AND the `ow` query param is set to '1',
  // show the admin course UI. Otherwise fall back to the student/default UI.
  // If the user is an admin but ow !== "1", show a not-authorized alert.
  if (user.role === "admin" && ow === "1") {
    return <AdminSingleCourse id={id} />;
  } else if (user.role === "admin" && ow !== "1") {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <Alert variant="destructive">
          <AlertTitle>Not authorized</AlertTitle>
          <AlertDescription>
            You don't have authorization to manage this course.
          </AlertDescription>
        </Alert>
      </div>
    );
  } else {
    return <StudentSingleCourse id={id} searchParams={searchParams || {}} />;
  }
}
