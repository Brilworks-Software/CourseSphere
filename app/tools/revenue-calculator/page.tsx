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
  Users, 
  Eye, 
  ArrowLeft, 
  Info, 
  RotateCcw,
  Zap,
  Target,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingDown
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

interface RevenueScenario {
  name: string;
  conversionRate: number;
  revenue: number;
  studentCount: number;
}

interface RevenueResult {
  subscriberCount: number;
  avgViews: number;
  coursePrice: number;
  engagementLevel: string;
  emailListSize?: number;
  communitySize?: number;
  scenarios: RevenueScenario[];
  adSenseComparison: {
    monthlyAdSense: number;
    courseVsAdSenseMonths: number;
  };
  explanation: string;
  insights: string[];
  suggestedPrice?: number;
}

export default function RevenueCalculatorPage() {
  const [subscriberCount, setSubscriberCount] = useState("");
  const [avgViews, setAvgViews] = useState("");
  const [engagementLevel, setEngagementLevel] = useState("medium");
  const [coursePrice, setCoursePrice] = useState("");
  const [emailListSize, setEmailListSize] = useState("");
  const [communitySize, setCommunitySize] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RevenueResult | null>(null);
  const [error, setError] = useState("");

  const handleCalculate = async () => {
    if (!subscriberCount || !avgViews) {
      setError("Please enter subscriber count and average views");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/courses/revenue-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriberCount: parseInt(subscriberCount),
          avgViews: parseInt(avgViews),
          engagementLevel,
          coursePrice: coursePrice ? parseFloat(coursePrice) : null,
          emailListSize: emailListSize ? parseInt(emailListSize) : null,
          communitySize: communitySize ? parseInt(communitySize) : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate revenue");
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
    setSubscriberCount("");
    setAvgViews("");
    setEngagementLevel("medium");
    setCoursePrice("");
    setEmailListSize("");
    setCommunitySize("");
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

  const getScenarioColor = (name: string) => {
    switch (name) {
      case "Conservative": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      case "Realistic": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "Aggressive": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getScenarioIcon = (name: string) => {
    switch (name) {
      case "Conservative": return <TrendingDown className="w-5 h-5" />;
      case "Realistic": return <Target className="w-5 h-5" />;
      case "Aggressive": return <TrendingUp className="w-5 h-5" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
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
              <DollarSign className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Course Revenue Calculator</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            How much money could you actually make from a course? 
            Get realistic revenue estimates based on your audience.
          </p>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <Info className="inline h-4 w-4 mr-2" />
              Conservative estimates based on real creator benchmarks. No hype, just reality.
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
                <CardTitle>Your Creator Stats</CardTitle>
                <CardDescription>
                  Enter your audience metrics to calculate potential course revenue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subscribers">
                      Subscriber Count <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="subscribers"
                      type="number"
                      placeholder="10000"
                      value={subscriberCount}
                      onChange={(e) => setSubscriberCount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your total YouTube subscribers
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avgViews">
                      Avg Views Per Video <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="avgViews"
                      type="number"
                      placeholder="5000"
                      value={avgViews}
                      onChange={(e) => setAvgViews(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Average views on recent videos
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="engagement">
                      Engagement Level
                    </Label>
                    <Select value={engagementLevel} onValueChange={setEngagementLevel}>
                      <SelectTrigger id="engagement">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (1-2% like rate)</SelectItem>
                        <SelectItem value="medium">Medium (3-5% like rate)</SelectItem>
                        <SelectItem value="high">High (6%+ like rate)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Based on likes, comments, shares
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Course Price (Optional)
                    </Label>
                    <Input
                      id="price"
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

                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold mb-4">Optional: Boost Your Estimate</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email List Size
                      </Label>
                      <Input
                        id="email"
                        type="number"
                        placeholder="0"
                        value={emailListSize}
                        onChange={(e) => setEmailListSize(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Newsletter subscribers
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="community">
                        Community Size
                      </Label>
                      <Input
                        id="community"
                        type="number"
                        placeholder="0"
                        value={communitySize}
                        onChange={(e) => setCommunitySize(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Discord/Telegram members
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleCalculate}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader />
                      <span className="ml-2">Calculating...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Calculate My Potential Revenue
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
                Calculate Again
              </Button>
            </div>

            {/* AI Explanation */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Sparkles className="w-5 h-5" />
                  What This Means For You
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                  {result.explanation}
                </p>
              </CardContent>
            </Card>

            {/* Price Suggestion */}
            {result.suggestedPrice && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Target className="w-5 h-5" />
                    Suggested Course Price
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {formatCurrency(result.suggestedPrice)}
                  </div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Based on your audience size and engagement level
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Revenue Scenarios */}
            <div className="grid md:grid-cols-3 gap-6">
              {result.scenarios.map((scenario, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 m-4">
                    <Badge className={getScenarioColor(scenario.name)}>
                      {scenario.name}
                    </Badge>
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      {getScenarioIcon(scenario.name)}
                      <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    </div>
                    <CardDescription>
                      {scenario.conversionRate.toFixed(1)}% conversion rate
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Launch Revenue</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(scenario.revenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Students</p>
                        <p className="text-xl font-semibold">
                          {scenario.studentCount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AdSense Comparison */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Zap className="w-5 h-5" />
                  Course vs AdSense Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                      Your Monthly AdSense (Estimated)
                    </p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                      {formatCurrency(result.adSenseComparison.monthlyAdSense)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                      One Course Launch Equals
                    </p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                      ~{result.adSenseComparison.courseVsAdSenseMonths} months of AdSense
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    💡 A single course launch at realistic conversion rates could equal 
                    {result.adSenseComparison.courseVsAdSenseMonths >= 6 ? " half a year" : " several months"} of 
                    YouTube ad revenue. That's the power of digital products.
                  </p>
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

            {/* Your Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Your Audience Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Subscribers</p>
                    <p className="text-xl font-bold">{result.subscriberCount.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Avg Views</p>
                    <p className="text-xl font-bold">{result.avgViews.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Engagement</p>
                    <p className="text-xl font-bold capitalize">{result.engagementLevel}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Course Price</p>
                    <p className="text-xl font-bold">{formatCurrency(result.coursePrice)}</p>
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
