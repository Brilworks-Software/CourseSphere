"use client";

import Link from "next/link";
import Logo from "./logo";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { motion } from "framer-motion";

export function LandingHeader() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/course"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Explore Courses
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
