"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Loader from "@/components/loader";
import { 
  DollarSign, 
  TrendingUp, 
  Briefcase,
  BookOpen,
  ArrowLeft, 
  Info, 
  RotateCcw,
  Zap,
  Target,
  CheckCircle2,
  Shield,
  Clock,
  RefreshCw,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

interface ComparisonResult {
  sponsorshipIncome: {
    perDeal: number;
    frequency: string;
    annualIncome: number;
  };
  courseIncome: {
    coursePrice: number;
    launchRevenue: number;
    monthlyRevenue: number;
    annualRevenue: number;
    studentCount: number;
  };
  comparison: {
    coursesVsSponsorships: number;
    timeToBreakEven: string;
    stabilityScore: number;
  };
  aiExplanation: string;
  insights: string[];
  keyTakeaway: string;
}

export default function SponsorshipVsCoursePage() {
  const [sponsorshipPayout, setSponsorshipPayout] = useState("");
  const [sponsorshipFrequency, setSponsorshipFrequency] = useState("monthly");
  const [coursePrice, setCoursePrice] = useState("");
  const [audienceSize, setAudienceSize] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState("");

  const handleCompare = async () => {
    if (!sponsorshipPayout || !audienceSize) {
      setError("Please enter sponsorship payout and audience size");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/courses/sponsorship-vs-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsorshipPayout: parseFloat(sponsorshipPayout),
          sponsorshipFrequency,
          coursePrice: coursePrice ? parseFloat(coursePrice) : null,
          audienceSize: parseInt(audienceSize),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to compare income");
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
    setSponsorshipPayout("");
    setSponsorshipFrequency("monthly");
    setCoursePrice("");
    setAudienceSize("");
    setResult(null);
    setError("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
          <h1 className="text-4xl font-bold mb-4">Sponsorship vs Course Income</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Break free from brand dependency. Discover why building a course beats 
            chasing sponsorships for long-term income.
          </p>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <Info className="inline h-4 w-4 mr-2" />
              Compare one-time sponsorship deals vs reusable course income. See which path builds real wealth.
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
                <CardTitle>Your Income Stats</CardTitle>
                <CardDescription>
                  Enter your current sponsorship details and audience size
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sponsorshipPayout">
                      Avg Sponsorship Payout <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="sponsorshipPayout"
                      type="number"
                      placeholder="500"
                      value={sponsorshipPayout}
                      onChange={(e) => setSponsorshipPayout(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      How much you earn per sponsored video
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">
                      Sponsorship Frequency
                    </Label>
                    <Select value={sponsorshipFrequency} onValueChange={setSponsorshipFrequency}>
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly (52/year)</SelectItem>
                        <SelectItem value="biweekly">Bi-Weekly (26/year)</SelectItem>
                        <SelectItem value="monthly">Monthly (12/year)</SelectItem>
                        <SelectItem value="quarterly">Quarterly (4/year)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How often you get sponsorship deals
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="audienceSize">
                      Audience Size <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="audienceSize"
                      type="number"
                      placeholder="10000"
                      value={audienceSize}
                      onChange={(e) => setAudienceSize(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Total subscribers or followers
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coursePrice">
                      Course Price (Optional)
                    </Label>
                    <Input
                      id="coursePrice"
                      type="number"
                      placeholder="Auto-suggested"
                      value={coursePrice}
                      onChange={(e) => setCoursePrice(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave blank for AI suggestion
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleCompare}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader />
                      <span className="ml-2">Comparing...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Compare Income Models
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
                Compare Again
              </Button>
            </div>

            {/* Key Takeaway */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Zap className="w-5 h-5" />
                  The Bottom Line
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                  {result.keyTakeaway}
                </p>
              </CardContent>
            </Card>

            {/* AI Explanation */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Sparkles className="w-5 h-5" />
                  Why Courses Win
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                  {result.aiExplanation}
                </p>
              </CardContent>
            </Card>

            {/* Income Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Sponsorship Income */}
              <Card className="relative overflow-hidden border-orange-200 dark:border-orange-800">
                <div className="absolute top-0 right-0 m-4">
                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    <Briefcase className="w-3 h-3 mr-1" />
                    Sponsorships
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">Brand Deals</CardTitle>
                  <CardDescription>
                    {result.sponsorshipIncome.frequency} sponsorships
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Per Deal</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(result.sponsorshipIncome.perDeal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Annual Income</p>
                      <p className="text-3xl font-bold">
                        {formatCurrency(result.sponsorshipIncome.annualIncome)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Income */}
              <Card className="relative overflow-hidden border-green-200 dark:border-green-800">
                <div className="absolute top-0 right-0 m-4">
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Course
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">Your Course</CardTitle>
                  <CardDescription>
                    Reusable digital product
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Launch Revenue</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(result.courseIncome.launchRevenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Annual Income (Est.)</p>
                      <p className="text-3xl font-bold">
                        {formatCurrency(result.courseIncome.annualRevenue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Visual Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Income Breakdown Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Monthly Comparison */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Monthly Income Potential</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-orange-600 dark:text-orange-400">Sponsorships</span>
                          <span className="font-semibold">
                            {formatCurrency(result.sponsorshipIncome.annualIncome / 12)}
                          </span>
                        </div>
                        <div className="h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center px-3">
                          <div 
                            className="h-4 bg-orange-500 rounded" 
                            style={{ 
                              width: `${(result.sponsorshipIncome.annualIncome / 12) / (result.courseIncome.monthlyRevenue) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-green-600 dark:text-green-400">Course (Passive)</span>
                          <span className="font-semibold">
                            {formatCurrency(result.courseIncome.monthlyRevenue)}
                          </span>
                        </div>
                        <div className="h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center px-3">
                          <div 
                            className="h-4 bg-green-500 rounded" 
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs text-muted-foreground mb-1">Time Spent</p>
                      <p className="text-sm font-semibold">Course: Build once</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Sponsor: Every deal</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <Shield className="w-6 h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                      <p className="text-xs text-muted-foreground mb-1">Control</p>
                      <p className="text-sm font-semibold">Course: Full control</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Sponsor: Brand rules</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <RefreshCw className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
                      <p className="text-xs text-muted-foreground mb-1">Scalability</p>
                      <p className="text-sm font-semibold">Course: Infinite</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Sponsor: Limited</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.insights.map((insight, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{insight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comparison Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  The Math
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Course Price</p>
                    <p className="text-xl font-bold">{formatCurrency(result.courseIncome.coursePrice)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Students (Launch)</p>
                    <p className="text-xl font-bold">{result.courseIncome.studentCount}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Course = X Sponsorships</p>
                    <p className="text-xl font-bold">{result.comparison.coursesVsSponsorships}x</p>
                  </div>
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
