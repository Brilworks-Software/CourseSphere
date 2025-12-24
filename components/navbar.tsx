"use client";

// Navbar is fully self-contained and does not receive any props.
// All authentication and user info is fetched internally.

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { LogOut } from "lucide-react";
import Logo from "./logo";
import { useUserContext } from "@/app/provider/user-context";
import { useAuth } from "@/app/provider/AuthProvider";

const Navbar = () => {
  const pathname = usePathname();
  const { user } = useUserContext();
  const { logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
  };

  // Helper to render nav links with active detection
  function NavLink({
    href,
    label,
    activeWhen = [href],
  }: {
    href: string;
    label: React.ReactNode;
    activeWhen?: string[];
  }) {
    const isActive = activeWhen.some((p) => pathname.startsWith(p));
    const baseClass =
      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200";
    const activeClass = "bg-accent text-accent-foreground font-semibold";
    const inactiveClass =
      "text-muted-foreground hover:bg-muted hover:text-foreground";
    return (
      <Link
        href={href}
        className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
      >
        {label}
      </Link>
    );
  }

  // Build links compactly, include role-specific ones
  type NavLinkItem = {
    href: string;
    label: React.ReactNode;
    activeWhen?: string[];
  };
  let links: NavLinkItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/courses", label: "Courses" },
  ];

  // Render links based on user role
  if (user?.role === "student") {
    links.push({ href: "/my-courses", label: "My Courses" });
  }
  if (user?.role === "admin" || user?.role === "super_admin") {
    links.push(
      { href: "/courses/new", label: "Create Course" }
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 supports-[backdrop-filter]:backdrop-blur-sm shadow-sm">
      <div className="max-w-425 mx-auto py-2 px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 group"
            >
              <Logo
                width={36}
                height={36}
                textPosition="right"
                className="group"
                textClassName="text-2xl"
              />
            </Link>
            <div className="hidden md:flex space-x-1">
              {links.map((l) => (
                <NavLink
                  key={l.href}
                  href={l.href}
                  label={l.label}
                  activeWhen={l.activeWhen ?? [l.href]}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
