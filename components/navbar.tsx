"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { LogOut, Menu } from "lucide-react";
import Logo from "./logo";
import { useUserContext } from "@/app/provider/user-context";
import { useAuth } from "@/app/provider/AuthProvider";
import Cookies from "js-cookie";

import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

const Navbar = () => {
  const pathname = usePathname();
  const { user } = useUserContext();
  const { logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  // Helper to render nav links with active detection
  function NavLink({
    href,
    label,
    activeWhen = [href],
    onClick,
  }: {
    href: string;
    label: React.ReactNode;
    activeWhen?: string[];
    onClick?: () => void;
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
        onClick={onClick}
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

  const links: NavLinkItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/courses", label: "Courses" },
  ];

  // Show admin-only links
  if (user?.role === "admin") {
    links.push(
      // { href: "/courses/new", label: "Create Course" },
      { href: "/organization", label: "Manage Organization" },
    );
  }

  // Show affiliate link - only for students, with different labels based on status
  if (user && user.role === "student") {
    links.push({
      href: "/affiliate",
      label: user.is_affiliate
        ? "Affiliate Dashboard"
        : "Join Affiliate Program",
    });
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 supports-backdrop-filter:backdrop-blur-sm shadow-sm">
      <div className="max-w-[1800px] mx-auto py-2 px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
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
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((l) => (
              <NavLink
                key={l.href}
                href={l.href}
                label={l.label}
                activeWhen={l.activeWhen ?? [l.href]}
              />
            ))}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Mobile Right Side - Sheet Trigger */}
          <div className="flex md:hidden items-center space-x-3">
            <ThemeToggle />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-all duration-200"
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-64">
                <div className="flex flex-col gap-2 pt-8 pb-4">
                  {links.map((l) => (
                    <NavLink
                      key={l.href}
                      href={l.href}
                      label={l.label}
                      activeWhen={l.activeWhen ?? [l.href]}
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  ))}
                  <button
                    onClick={async () => {
                      await handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
