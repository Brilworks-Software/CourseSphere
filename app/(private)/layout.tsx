"use client";

import Navbar from "@/components/navbar";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen ">
      {/* Hide Navbar on /courses/new */}
      {pathname !== "/courses/new" && <Navbar />}
      <main
        className={
          pathname === "/courses/new"
            ? "p-0"
            : "px-4 sm:px-6 lg:px-8 py-8"
        }
      >
        {children}
      </main>
    </div>
  );
}
