"use client";
import { useUserContext } from "@/app/provider/user-context";
import AdminSingleCourse from "./AdminSingleCourse";
import StudentSingleCourse from "./StudentSingleCourse";
import { useParams } from "next/navigation";
import Loader from "@/components/loader";

export default function DashboardPage({
  searchParams,
}: {
  searchParams?: { lesson?: string };
}) {
  const { user } = useUserContext();
  const params = useParams();
  const id = params?.id as string;

  if (!user || !id)
    return (
      <div>
        <Loader />
      </div>
    );

  if (user.role === "admin") {
    return <AdminSingleCourse id={id} />;
  } else {
    return <StudentSingleCourse id={id} searchParams={searchParams || {}} />;
  }
}
