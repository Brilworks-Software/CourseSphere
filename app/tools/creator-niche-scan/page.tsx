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
  Search, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Lightbulb, 
  ArrowLeft, 
  Info, 
  RotateCcw,
  Eye,
  Package,
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  TrendingDown
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

interface CreatorOffering {
  creator: string;
  offering: string;
  format: "ebook" | "course" | "cohort" | "membership" | "template" | "coaching";
  price: number;
  currency: string;
  promise: string;
  source: string;
}

interface Pattern {
  format: string;
  count: number;
  priceRange: string;
  commonPromises: string[];
}

interface NicheScanResult {
  niche: string;
  creatorLevel: string;
  totalOfferings: number;
  offerings: CreatorOffering[];
  patterns: Pattern[];
  mostCommon: string;
  leastCommon: string[];
  opportunities: string[];
  differentiationAngles: string[];
  recommendedOffer: string;
}

export default function CreatorNicheScanPage() {
  const [niche, setNiche] = useState("");
  const [creatorLevel, setCreatorLevel] = useState("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NicheScanResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!niche.trim()) {
      setError("Please enter a niche");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/courses/creator-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, creatorLevel }),
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
    setCreatorLevel("all");
    setResult(null);
    setError("");
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "ebook": return "📚";
      case "course": return "🎓";
      case "cohort": return "👥";
      case "membership": return "🔑";
      case "template": return "📋";
      case "coaching": return "🎯";
      default: return "📦";
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case "cohort": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "course": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "membership": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "coaching": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
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
              <Eye className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">What Other Creators Are Selling</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Peek behind the curtain. See what creators in your niche are selling, 
            find gaps, and discover your unique angle.
          </p>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <Info className="inline h-4 w-4 mr-2" />
              We analyze creator offerings from multiple sources to show you market patterns and opportunities
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
                <CardTitle>Scan Your Niche</CardTitle>
                <CardDescription>
                  Enter your niche to discover what other creators are selling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="niche">
                    Creator Niche <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="niche"
                    placeholder="e.g., Digital Marketing, Productivity, Fitness"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  />
                  <p className="text-sm text-muted-foreground">
                    Try: digital marketing, productivity, fitness, design, coding
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">
                    Creator Level (Optional)
                  </Label>
                  <Select value={creatorLevel} onValueChange={setCreatorLevel}>
                    <SelectTrigger id="level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Creators</SelectItem>
                      <SelectItem value="beginner">Beginner Creators (0-10k followers)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (10k-100k followers)</SelectItem>
                      <SelectItem value="advanced">Advanced (100k+ followers)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Filter by creator size to see relevant patterns
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
                      <span className="ml-2">Scanning Niche...</span>
                    </div>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Scan Niche
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
                Scan Another Niche
              </Button>
            </div>

            {/* Key Insight */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Lightbulb className="w-5 h-5" />
                  Your Best Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium text-green-800 dark:text-green-200 mb-4">
                  {result.recommendedOffer}
                </p>
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                  <Target className="w-4 h-4" />
                  <span>Based on market gaps and demand patterns</span>
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Offerings</p>
                      <p className="text-2xl font-bold">{result.totalOfferings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Most Popular</p>
                      <p className="text-xl font-bold">{result.mostCommon}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Opportunities</p>
                      <p className="text-2xl font-bold">{result.opportunities.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* What Most Creators Sell */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Market Patterns
                </CardTitle>
                <CardDescription>What most creators are selling in {result.niche}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.patterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFormatIcon(pattern.format)}</span>
                          <div>
                            <h3 className="font-semibold capitalize">{pattern.format}</h3>
                            <p className="text-sm text-muted-foreground">{pattern.count} offerings found</p>
                          </div>
                        </div>
                        <Badge className={getFormatColor(pattern.format)}>
                          {pattern.priceRange}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Common Promises:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {pattern.commonPromises.map((promise, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{promise}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* What's Missing */}
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <TrendingDown className="w-5 h-5" />
                  Underserved Segments
                </CardTitle>
                <CardDescription className="text-orange-600 dark:text-orange-400">
                  Few creators are offering these formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {result.leastCommon.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg"
                    >
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Zap className="w-5 h-5" />
                  Market Opportunities
                </CardTitle>
                <CardDescription className="text-purple-600 dark:text-purple-400">
                  Ways to stand out in your niche
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.opportunities.map((opportunity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg"
                    >
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm">{opportunity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Differentiation Angles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Differentiation Strategies
                </CardTitle>
                <CardDescription>
                  AI-suggested angles to make your offering unique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.differentiationAngles.map((angle, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{angle}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sample Offerings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Sample Creator Offerings ({result.offerings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.offerings.slice(0, 10).map((offering, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{getFormatIcon(offering.format)}</span>
                            <h3 className="font-semibold">{offering.offering}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">by {offering.creator}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{offering.promise}"</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={getFormatColor(offering.format)}>
                              {offering.format}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {offering.source}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {offering.currency}{offering.price.toLocaleString()}
                          </div>
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
