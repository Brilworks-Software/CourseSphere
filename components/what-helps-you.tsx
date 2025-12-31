"use client";

import { motion } from "framer-motion";
import { BookOpen, Upload, Users2, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

export function WhatHelpsYou() {
  const learnerBenefits = [
    {
      icon: BookOpen,
      title: "Diverse Course Library",
      description:
        "Access thousands of courses across various categories and skill levels.",
    },
    {
      icon: TrendingUp,
      title: "Track Your Progress",
      description:
        "Monitor your learning journey with detailed analytics and achievements.",
    },
  ];

  const instructorBenefits = [
    {
      icon: Upload,
      title: "Easy Course Creation",
      description:
        "Upload and manage your courses with our intuitive course builder.",
    },
    {
      icon: Users2,
      title: "Reach Global Audience",
      description:
        "Share your expertise with learners from around the world and grow your impact.",
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            How We <span className="text-theme-gradient">Help You</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're here to learn or teach, we've got you covered
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* For Learners */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                For Learners
              </h3>
            </div>

            <div className="space-y-6 mb-8">
              {learnerBenefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild className="w-full">
              <Link href="/course">Start Learning</Link>
            </Button>
          </motion.div>

          {/* For Instructors */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                For Instructors
              </h3>
            </div>

            <div className="space-y-6 mb-8">
              {instructorBenefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="/signup">Become an Instructor</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
