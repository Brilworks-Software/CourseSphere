"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight, BookOpen, Users, Award } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Animated background blobs - using CSS animations instead of framer-motion */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Content: two-column layout */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Right: SVG hero image - reduced animation complexity */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex justify-center"
          >
            <img
              src="/landing-hero.svg"
              alt="Illustration showing online learning and collaboration"
              className="w-full max-w-md md:max-w-xl lg:max-w-2xl"
              loading="eager"
            />
          </motion.div>

          {/* Left: Text content - optimized animations */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-left"
          >
            <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
              Launch your learning
            </span>

            <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
              <span className="text-primary">Learn Without Limits</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
              Discover thousands of courses from expert instructors. Build real
              projects, gain certifications, and grow your career with guided
              learning paths.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="text-lg px-6">
                <Link href="/signup" className="flex items-center">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-lg px-6"
              >
                <Link href="/course">Browse Courses</Link>
              </Button>
            </div>

            {/* Simple stats row - no animations for better performance */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-xl">
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">1000+</div>
                    <div className="text-sm text-muted-foreground">Courses</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">50K+</div>
                    <div className="text-sm text-muted-foreground">
                      Learners
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">500+</div>
                    <div className="text-sm text-muted-foreground">
                      Instructors
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

