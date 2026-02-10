"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Youtube, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ArrowRight,
  Lightbulb,
  MessageSquare,
  Award,
  GraduationCap,
  BookOpen,
  Eye,
  Briefcase,
  Calendar,
  Shield,
  Heart,
  Video,
  Target,
  Rocket,
  CheckSquare,
  Link2,
  FileText,
  Layers,
  Package,
  RefreshCw
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

export default function ToolsPage() {
  const tools = [
    {
      title: "YouTube Course Idea Generator",
      description: "Discover profitable course ideas from your YouTube content. AI analyzes your videos, comments, and audience needs to generate 5 specific course concepts.",
      icon: Lightbulb,
      iconColor: "text-purple-500",
      href: "/tools/youtube-course-idea",
      badge: "🔥 AI-Powered",
      features: ["Topic clustering", "Problem extraction", "Demand analysis", "Pricing suggestions"]
    },
    {
      title: "Comment-to-Course Insights",
      description: "Analyze video comments to discover what your audience really wants. AI organizes comments into course modules with real demand proof.",
      icon: MessageSquare,
      iconColor: "text-blue-500",
      href: "/tools/comment-insights",
      badge: "🔥 AI-Powered",
      features: ["Comment clustering", "Module mapping", "Demand signals", "Beginner/Advanced split"]
    },
    {
      title: "Niche Authority Score",
      description: "Kill imposter syndrome with data. Discover if you're expert enough to sell a course by analyzing your teaching authority signals.",
      icon: Award,
      iconColor: "text-yellow-500",
      href: "/tools/niche-authority",
      badge: "🔥 AI-Powered",
      features: ["Topic consistency analysis", "Content depth scoring", "Authority level assessment", "Pricing recommendations"]
    },
    {
      title: "Beginner vs Advanced Audience Analyzer",
      description: "Discover who your course should be for. Analyze comments to understand if your audience is beginner, intermediate, or advanced level.",
      icon: GraduationCap,
      iconColor: "text-indigo-500",
      href: "/tools/audience-analyzer",
      badge: "🔥 AI-Powered",
      features: ["Comment skill analysis", "Question pattern detection", "Course level recommendation", "Pricing strategy"]
    },
    {
      title: "Audience Trust Index",
      description: "Will your audience actually buy from you? Analyze trust signals in your comments to see proof they already view you as a teacher.",
      icon: Heart,
      iconColor: "text-pink-600",
      href: "/tools/audience-trust",
      badge: "🔥 AI-Powered",
      features: ["Trust score", "Real comment examples", "Buying confidence", "Teacher validation"]
    },
    {
      title: "Turn Video Into Course Outline",
      description: "Already have content? Convert your video, transcript, or outline into a structured course with AI-powered modules and lessons.",
      icon: Video,
      iconColor: "text-cyan-600",
      href: "/tools/video-to-course",
      badge: "🔥 AI-Powered",
      features: ["Course title & modules", "Lesson breakdown", "Learning outcomes", "Suggested exercises"]
    },
    {
      title: "Outcome-Based Curriculum Generator",
      description: "Stop building content-heavy courses. Design a transformation-first curriculum that reverse-engineers from the final outcome.",
      icon: Target,
      iconColor: "text-purple-600",
      href: "/tools/curriculum-generator",
      badge: "🔥 AI-Powered",
      features: ["Week-by-week plan", "Outcome milestones", "Skills mapping", "Assessments"]
    },
    {
      title: "7-Day Course Launch Planner",
      description: "Stop overthinking your launch. Get a day-by-day action plan with templates, posts, and emails to launch with confidence.",
      icon: Rocket,
      iconColor: "text-orange-600",
      href: "/tools/launch-planner",
      badge: "🔥 AI-Powered",
      features: ["Day-by-day plan", "Email templates", "Post ideas", "Webinar pitch"]
    },
    {
      title: "First Cohort Launch Checklist",
      description: "Never forget critical launch steps. Get a complete checklist with risk warnings to launch your first cohort with confidence.",
      icon: CheckSquare,
      iconColor: "text-green-600",
      href: "/tools/cohort-checklist",
      badge: "🔥 AI-Powered",
      features: ["Complete checklist", "Risk warnings", "Priority guidance", "Progress tracking"]
    },
    {
      title: "Link-in-Bio Monetization Audit",
      description: "Why do people click but not buy? Audit your bio link for monetization leaks and get specific fixes.",
      icon: Link2,
      iconColor: "text-purple-600",
      href: "/tools/bio-link-audit",
      badge: "🔥 AI-Powered",
      features: ["Monetization score", "Friction analysis", "Top 3 fixes", "Optimized layout"]
    },
    {
      title: "Top Courses in Your Niche",
      description: "Discover what courses exist in your niche. Competition = Validation. See pricing patterns, identify gaps, and find opportunities.",
      icon: BookOpen,
      iconColor: "text-blue-600",
      href: "/tools/niche-explorer",
      badge: "🔥 AI-Powered",
      features: ["Course discovery", "Pricing analysis", "Market trends", "Gap identification"]
    },
    {
      title: "What Other Creators Are Selling",
      description: "Peek behind the curtain. See what creators in your niche are selling, find gaps, and discover your unique differentiation angle.",
      icon: Eye,
      iconColor: "text-purple-600",
      href: "/tools/creator-niche-scan",
      badge: "🔥 AI-Powered",
      features: ["Creator offerings scan", "Format analysis", "Opportunity discovery", "Differentiation strategies"]
    },
    {
      title: "Course Pricing Optimizer",
      description: "Overcome pricing fear with data-driven recommendations. Get confident price ranges with AI-powered justification for your niche, format, and audience.",
      icon: DollarSign,
      iconColor: "text-emerald-600",
      href: "/tools/pricing-optimizer",
      badge: "🔥 AI-Powered",
      features: ["3 pricing tiers", "Format multipliers", "Niche benchmarks", "Positioning strategy"]
    },
    {
      title: "Cohort vs Self-Paced Recommendation",
      description: "Should you launch a live cohort or self-paced course? Get a personalized recommendation based on your time, audience, and goals.",
      icon: Calendar,
      iconColor: "text-pink-600",
      href: "/tools/cohort-recommendation",
      badge: "🔥 AI-Powered",
      features: ["Decision matrix", "Score comparison", "Next steps", "Format insights"]
    },
    {
      title: "Live Workshop ROI Estimator",
      description: "Is it worth doing a live workshop? Calculate your ROI and see how workshops compare to sponsorships and other income streams.",
      icon: Calendar,
      iconColor: "text-cyan-600",
      href: "/tools/workshop-roi",
      badge: "🔥 AI-Powered",
      features: ["ROI calculation", "Income comparisons", "Low-risk framing", "Confidence factors"]
    },
    {
      title: "Cohort Size & Pricing Planner",
      description: "Stop guessing how many students to take. Get personalized cohort size and pricing recommendations that protect your energy.",
      icon: Users,
      iconColor: "text-violet-600",
      href: "/tools/cohort-size-planner",
      badge: "🔥 AI-Powered",
      features: ["Optimal cohort size", "Smart pricing", "Energy cost analysis", "Revenue projections"]
    },
    {
      title: "Creator Income Stability Score",
      description: "Courses aren't risky—dependence is. Measure your income stability and discover how owned assets protect you from platform volatility.",
      icon: Shield,
      iconColor: "text-indigo-600",
      href: "/tools/income-stability",
      badge: "🔥 AI-Powered",
      features: ["Stability score", "Risk assessment", "Platform dependence", "Improvement plan"]
    },
    {
      title: "Creator Course Revenue Calculator",
      description: "How much money could you actually make from a course? Get realistic revenue estimates based on your audience size and engagement.",
      icon: DollarSign,
      iconColor: "text-green-600",
      href: "/tools/revenue-calculator",
      badge: "Calculator",
      features: ["3 revenue scenarios", "AdSense comparison", "Conservative estimates", "Trust-building projections"]
    },
    {
      title: "Sponsorship vs Course Income",
      description: "Break free from brand dependency. Compare sponsorship deals vs course income to see which path builds real wealth.",
      icon: Briefcase,
      iconColor: "text-orange-600",
      href: "/tools/sponsorship-vs-course",
      badge: "🔥 AI-Powered",
      features: ["Income comparison", "Time vs money analysis", "Control assessment", "Compounding explained"]
    },
    {
      title: "YouTube Description Funnel Optimizer",
      description: "Turn views into traffic. Analyze your YouTube description and get an AI-optimized version designed to convert viewers into students.",
      icon: FileText,
      iconColor: "text-red-500",
      href: "/tools/description-optimizer",
      badge: "🔥 AI-Powered",
      features: ["Evaluation scores", "Optimized copy", "Pinned comment", "CTA variations"]
    },
    {
      title: "YouTube Monetization Readiness",
      description: "Check how close you are to meeting YouTube's monetization requirements. Get instant feedback on your progress.",
      icon: Youtube,
      iconColor: "text-red-500",
      href: "/tools/youtube-monetization",
      badge: "Calculator",
      features: ["Track subscriber count", "Monitor watch hours", "Get readiness score"]
    },
    {
      title: "Is Your Audience Course-Ready?",
      description: "Evaluate if your audience is ready for your online course based on engagement, size, and activity metrics.",
      icon: Users,
      iconColor: "text-blue-500",
      href: "/tools/audience-readiness",
      badge: "Assessment",
      features: ["Analyze engagement rate", "Evaluate audience size", "Get actionable insights"]
    },
    {
      title: "Course Platform Fit Finder",
      description: "Most platforms are not built for creators. Find which platform actually fits your teaching style and goals.",
      icon: Layers,
      iconColor: "text-blue-600",
      href: "/tools/platform-fit-finder",
      badge: "🔥 AI-Powered",
      features: ["Platform comparison", "Trade-off analysis", "Personalized recommendation", "Next steps"]
    },
    {
      title: "Course Pricing Calculator",
      description: "Get a suggested price for your online course based on duration, expertise level, and additional offerings.",
      icon: DollarSign,
      iconColor: "text-green-500",
      href: "/tools/pricing-calculator",
      badge: "Calculator",
      features: ["Duration-based pricing", "Expertise multiplier", "Support add-ons"]
    },
    {
      title: "Tool Stack Cost Analyzer",
      description: "Stop paying twice for your tools. Calculate the true cost of tool sprawl: subscription fees plus mental load.",
      icon: Package,
      iconColor: "text-orange-600",
      href: "/tools/tool-stack-analyzer",
      badge: "🔥 AI-Powered",
      features: ["Monthly cost breakdown", "Time cost calculation", "Complexity score", "Consolidation recommendations"]
    },
    {
      title: "Migration Effort Estimator",
      description: "Migration will not be painful. See exactly how long it takes to move your courses. Most creators finish in under a day.",
      icon: RefreshCw,
      iconColor: "text-blue-600",
      href: "/tools/migration-estimator",
      badge: "🔥 AI-Powered",
      features: ["Time estimate", "Step-by-step plan", "Risk assessment", "Migration support"]
    },
    {
      title: "Revenue Projection Tool",
      description: "Estimate your potential course revenue based on your audience reach, pricing, and expected conversion rates.",
      icon: TrendingUp,
      iconColor: "text-purple-500",
      href: "/tools/revenue-projection",
      badge: "Projection",
      features: ["Calculate enrollments", "Project revenue", "Monthly breakdown"]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Free Tools for Content Creators
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Analyze your content, understand your audience, and make data-driven decisions 
                to grow your business with our powerful free tools.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Tools Grid Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              {tools.map((tool, index) => (
                <ToolCard key={index} tool={tool} index={index} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

function ToolCard({ tool, index }: { tool: any; index: number }) {
  const Icon = tool.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow duration-300 group">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Icon className={tool.iconColor + " h-6 w-6"} />
            <Badge variant="secondary">{tool.badge}</Badge>
          </div>
          <CardTitle className="text-xl">{tool.title}</CardTitle>
          <CardDescription className="text-base">
            {tool.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 mb-6">
            {tool.features.map((feature: string, idx: number) => (
              <li key={idx} className="flex items-center text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                {feature}
              </li>
            ))}
          </ul>
          <Button asChild className="w-full group-hover:gap-3 transition-all">
            <Link href={tool.href}>
              Try This Tool
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
