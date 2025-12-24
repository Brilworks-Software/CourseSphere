"use client";
import AdminDashboard from "./AdminDashboard";
import StudentDashboard from "./StudentDashbaord";
import SuperAdminDashboard from "./SuperAdmin";
import Loader from "@/components/loader";
import { useUserContext } from "@/app/provider/user-context";

export default function DashboardPage() {
  const { user } = useUserContext();

  // You can add a loading state if needed
  if (!user) return <div className="h-dvh w-full flex justify-center items-center"><Loader /></div>;

  // Redirect/render based on role
  if (user.role === "super_admin") {
    return <SuperAdminDashboard />;
  } else if (user.role === "admin") {
    return <AdminDashboard />;
  } else {
    return <StudentDashboard />;
  }
}
