"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import Loader from "@/components/loader";
import { Search, TrendingUp, DollarSign, BookOpen, Users, Lightbulb, ExternalLink, CheckCircle2, ArrowLeft, Info, RotateCcw } from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

interface Course {
  title: string;
  platform: string;
  price: number;
  currency: string;
  format: "self-paced" | "cohort" | "hybrid";
  students?: number;
  rating?: number;
  url?: string;
}

interface PricingPattern {
  min: number;
  max: number;
  average: number;
  currency: string;
  cohortMultiplier: number;
}

interface NicheData {
  niche: string;
  courseCount: number;
  courses: Course[];
  pricingPattern: PricingPattern;
  trends: string[];
  gaps: string[];
  insight: string;
}

export default function NicheExplorerPage() {
  const [niche, setNiche] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NicheData | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!niche.trim()) {
      setError("Please enter a niche keyword");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/courses/niche-explorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, channelUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze niche");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setNiche("");
    setChannelUrl("");
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <LandingHeader />
      
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Back Button */}
        <Link href="/tools">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tools
          </Button>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <TrendingUp className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Top Courses in Your Niche</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover what courses exist in your niche. Competition = Validation. 
            See pricing patterns and identify opportunities.
          </p>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <Info className="inline h-4 w-4 mr-2" />
              We analyze course data from Udemy, Gumroad, and creator sites to show pricing patterns and market gaps
            </p>
          </div>
        </motion.div>

        {!result ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Explore Your Niche</CardTitle>
                <CardDescription>
                  Enter your niche keyword to discover existing courses and market insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="niche">
                    Niche Keyword <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="niche"
                    placeholder="e.g., Digital Marketing, Web Development, Yoga"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  />
                  <p className="text-sm text-muted-foreground">
                    Try: digital marketing, web development, yoga, photography, content creation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channelUrl">
                    Your Channel URL (Optional)
                  </Label>
                  <Input
                    id="channelUrl"
                    placeholder="https://youtube.com/@yourchannel"
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Helps us provide more personalized insights
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader />
                      <span className="ml-2">Analyzing Niche...</span>
                    </div>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Explore Niche
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Reset Button */}
            <div className="flex justify-end">
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Analyze Another Niche
              </Button>
            </div>

            {/* Insight Box */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Lightbulb className="w-5 h-5" />
                  Market Insight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium text-green-800 dark:text-green-200">
                  {result.insight}
                </p>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Courses</p>
                      <p className="text-2xl font-bold">{result.courseCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Average Price</p>
                      <p className="text-2xl font-bold">
                        {result.pricingPattern.currency}
                        {result.pricingPattern.average.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cohort Premium</p>
                      <p className="text-2xl font-bold">{result.pricingPattern.cohortMultiplier}x</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Pattern */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium">Price Range</span>
                    <span className="font-bold">
                      {result.pricingPattern.currency}
                      {result.pricingPattern.min.toLocaleString()} - {result.pricingPattern.currency}
                      {result.pricingPattern.max.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-sm font-medium">Most Common Range</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {result.pricingPattern.currency}
                      {Math.round(result.pricingPattern.average * 0.7).toLocaleString()} - {result.pricingPattern.currency}
                      {Math.round(result.pricingPattern.average * 1.3).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="text-sm font-medium">Live Cohorts Charge</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {result.pricingPattern.cohortMultiplier}× More than Self-Paced
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trends */}
            {result.trends.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Market Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.trends.map((trend, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{trend}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gaps & Opportunities */}
            {result.gaps.length > 0 && (
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                    <Lightbulb className="w-5 h-5" />
                    Opportunities & Gaps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.gaps.map((gap, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-sm">{gap}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Popular Courses ({result.courses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.courses.map((course, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{course.title}</h3>
                            {course.url && (
                              <a
                                href={course.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Badge variant="outline">{course.platform}</Badge>
                            <Badge
                              variant={course.format === "cohort" ? "default" : "secondary"}
                            >
                              {course.format === "cohort" ? "Live Cohort" : course.format === "hybrid" ? "Hybrid" : "Self-Paced"}
                            </Badge>
                            {course.students && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {course.students.toLocaleString()} students
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {course.currency}{course.price.toLocaleString()}
                          </div>
                          {course.rating && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              ⭐ {course.rating}/5
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
      <LandingFooter />
    </div>
  );
}
