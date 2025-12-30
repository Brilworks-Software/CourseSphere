import { redirect } from "next/navigation";

export default function Home() {
  // Unconditionally redirect the root path to the dashboard.
  redirect("/dashboard");
}
