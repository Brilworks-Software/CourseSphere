"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import CourseCard from "./course-card";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export function FeaturedCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const params = new URLSearchParams({
          perPage: "6",
          sort: "newest",
          userId: "",
          role: "",
        });

        const res = await fetch(`/api/courses/list?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch courses");
        }

        const data = await res.json();
        setCourses(data.courses || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  return (
    <section className="py-20 bg-background">
      <div className="w-fit mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Featured <span className="text-theme-gradient">Courses</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our most popular courses and start learning today
          </p>
        </motion.div>


        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="border rounded-xl shadow-sm flex flex-col p-4 bg-card animate-pulse"
              >
                <div className="w-full relative">
                  <Skeleton className="w-full aspect-square rounded-md mb-2" />
                  <Skeleton className="absolute top-2 right-2 w-8 h-8 rounded-full" />
                </div>
                <div className="mt-3 flex flex-col gap-2 justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-32 mb-1" />
                    </div>
                    <Skeleton className="h-4 w-40 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center text-muted-foreground py-12">
            <p>Unable to load courses. Please try again later.</p>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <p>No courses available at the moment.</p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
            >
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Button asChild size="lg" variant="secondary" className="group">
                <Link href="/course">
                  View All Courses
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
