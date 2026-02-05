"use client";
import { useUserContext } from "@/app/provider/user-context";
import AdminSingleCourse from "./AdminSingleCourse";
import StudentSingleCourse from "./StudentSingleCourse";
import { useParams, useSearchParams } from "next/navigation";
import Loader from "@/components/loader";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import React from "react"; // Add React import for React.use()

export default function DashboardPage({
  searchParams,
}: {
  // searchParams may include `lesson` and `ow` (owned flag)
  searchParams?: { lesson?: string; ow?: string };
}) {
  const { user } = useUserContext();
  const params = useParams();
  const id = params?.id as string;

  // Unwrap searchParams if it's a promise using React.use()
  let ow: string | undefined;
  const clientSearchParams = useSearchParams?.();
  if (clientSearchParams) {
    ow = clientSearchParams.get("ow") ?? undefined;
  } else if (searchParams) {
    // If searchParams is a promise, unwrap it
    // @ts-ignore
    const unwrapped = typeof searchParams.then === "function" ? React.use(searchParams) : searchParams;
    // Safely access ow property only if unwrapped is not empty and has ow
    ow = (unwrapped && typeof unwrapped === "object" && "ow" in unwrapped)
      ? (unwrapped as { ow?: string }).ow
      : undefined;
  }

  if (!user || !id)
    return (
      <div className="pt-9">
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
