import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

export default async function DashboardPage() {
  const profile = await getProfile();

  // Redirect based on role
  //   if (profile.role === 'super_admin') {
  //     redirect('/dashboard/super-admin')
  //   } else if (profile.role === 'admin') {
  //     redirect('/dashboard/admin')
  //   } else {
  //     redirect('/dashboard/student')
  //   }
  return <>Profile</>;
}
