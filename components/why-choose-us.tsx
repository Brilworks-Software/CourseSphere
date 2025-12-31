"use client";

import { motion } from "framer-motion";
import { FeatureCard } from "./feature-card";
import {
  GraduationCap,
  Users,
  Trophy,
  Clock,
  Shield,
  Sparkles,
} from "lucide-react";

export function WhyChooseUs() {
  const features = [
    {
      icon: GraduationCap,
      title: "Expert Instructors",
      description:
        "Learn from industry professionals with years of real-world experience and proven teaching methods.",
    },
    {
      icon: Users,
      title: "Vibrant Community",
      description:
        "Join thousands of learners worldwide. Collaborate, share knowledge, and grow together.",
    },
    {
      icon: Trophy,
      title: "Recognized Certificates",
      description:
        "Earn certificates upon completion that are valued by employers and institutions globally.",
    },
    {
      icon: Clock,
      title: "Learn at Your Pace",
      description:
        "Access courses anytime, anywhere. Study on your schedule with lifetime access to materials.",
    },
    {
      icon: Shield,
      title: "Quality Guaranteed",
      description:
        "Every course is carefully reviewed to ensure high-quality content and effective learning outcomes.",
    },
    {
      icon: Sparkles,
      title: "Always Updated",
      description:
        "Course content is regularly updated to reflect the latest industry trends and best practices.",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Why Choose{" "}
            <span className="text-theme-gradient">CourseSphere</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We provide everything you need to succeed in your learning journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.05}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

