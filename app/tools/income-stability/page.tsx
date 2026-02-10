"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Loader from "@/components/loader";
import { 
  Shield, 
  ArrowLeft, 
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  RotateCcw,
  Zap,
  Target,
  XCircle,
  DollarSign,
  Calendar,
  Lightbulb,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

interface IncomeSource {
  id: string;
  label: string;
  enabled: boolean;
  percentage: string;
  frequency: "monthly" | "launch";
}

interface StabilityResult {
  score: number;
  rating: "critical" | "risky" | "moderate" | "stable" | "excellent";
  breakdown: {
    diversification: number;
    predictability: number;
    ownership: number;
    scalability: number;
  };
  riskFlags: {
    level: "high" | "medium" | "low";
    message: string;
  }[];
  insights: {
    summary: string;
    platformDependence: string;
    recommendation: string;
  };
  improvements: string[];
  sourceAnalysis: {
    source: string;
    stability: number;
    ownership: string;
    risk: string;
  }[];
}

const INCOME_SOURCES = [
  { id: "adsense", label: "AdSense / Ad Revenue", category: "platform" },
  { id: "sponsorships", label: "Brand Sponsorships", category: "brands" },
  { id: "affiliate", label: "Affiliate Marketing", category: "platform" },
  { id: "courses", label: "Online Courses", category: "owned" },
  { id: "coaching", label: "1-on-1 Coaching", category: "owned" },
  { id: "memberships", label: "Membership/Community", category: "owned" },
  { id: "digital-products", label: "Digital Products", category: "owned" },
  { id: "freelance", label: "Freelance/Consulting", category: "service" },
  { id: "youtube-premium", label: "YouTube Premium Revenue", category: "platform" },
  { id: "patreon", label: "Patreon/Ko-fi", category: "platform" }
];

export default function IncomeStabilityPage() {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(
    INCOME_SOURCES.map(source => ({
      id: source.id,
      label: source.label,
      enabled: false,
      percentage: "",
      frequency: "monthly" as const
    }))
  );
  const [result, setResult] = useState<StabilityResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleSource = (id: string) => {
    setIncomeSources(sources =>
      sources.map(source =>
        source.id === id ? { ...source, enabled: !source.enabled } : source
      )
    );
  };

  const handlePercentageChange = (id: string, value: string) => {
    setIncomeSources(sources =>
      sources.map(source =>
        source.id === id ? { ...source, percentage: value } : source
      )
    );
  };

  const handleFrequencyChange = (id: string, value: "monthly" | "launch") => {
    setIncomeSources(sources =>
      sources.map(source =>
        source.id === id ? { ...source, frequency: value } : source
      )
    );
  };

  const handleCalculate = async () => {
    const enabledSources = incomeSources.filter(s => s.enabled);
    
    if (enabledSources.length === 0) {
      setError("Please select at least one income source");
      return;
    }

    const totalPercentage = enabledSources.reduce(
      (sum, source) => sum + (parseFloat(source.percentage) || 0),
      0
    );

    if (Math.abs(totalPercentage - 100) > 1) {
      setError(`Total percentage must equal 100% (currently ${totalPercentage.toFixed(0)}%)`);
      return;
    }

    setIsCalculating(true);
    setError(null);
    
    try {
      const sourcesData = enabledSources.map(source => ({
        id: source.id,
        percentage: parseFloat(source.percentage) || 0,
        frequency: source.frequency
      }));

      const response = await fetch('/api/tools/income-stability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: sourcesData }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate stability score');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Calculation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to calculate. Please try again.');
      setResult(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setIncomeSources(
      INCOME_SOURCES.map(source => ({
        id: source.id,
        label: source.label,
        enabled: false,
        percentage: "",
        frequency: "monthly" as const
      }))
    );
    setResult(null);
    setError(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    if (score >= 20) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-300 dark:border-green-700";
    if (score >= 60) return "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-300 dark:border-blue-700";
    if (score >= 40) return "from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-300 dark:border-yellow-700";
    if (score >= 20) return "from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-300 dark:border-orange-700";
    return "from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-300 dark:border-red-700";
  };

  const getRatingLabel = (rating: string) => {
    const labels: Record<string, string> = {
      critical: "Critical Risk",
      risky: "High Risk",
      moderate: "Moderate",
      stable: "Stable",
      excellent: "Excellent"
    };
    return labels[rating] || rating;
  };

  const getRatingIcon = (rating: string) => {
    if (rating === "excellent" || rating === "stable") return ShieldCheck;
    if (rating === "moderate") return Shield;
    return ShieldAlert;
  };

  const enabledCount = incomeSources.filter(s => s.enabled).length;
  const totalPercentage = incomeSources
    .filter(s => s.enabled)
    .reduce((sum, source) => sum + (parseFloat(source.percentage) || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      <main className="container mx-auto px-4 py-12 max-w-6xl">
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Income Stability Score
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Courses aren't risky—dependence is. Measure your income stability and discover 
            how to build a more resilient creator business.
          </p>
          <Badge variant="secondary" className="mt-4 px-4 py-1.5 text-sm font-semibold">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Risk Assessment
          </Badge>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Your Income Sources
                </CardTitle>
                <CardDescription>
                  Select your income sources and what percentage each represents
                </CardDescription>
                <div className="flex items-center justify-between pt-2">
                  <Badge variant="outline">{enabledCount} sources selected</Badge>
                  <Badge variant={Math.abs(totalPercentage - 100) < 1 ? "default" : "destructive"}>
                    {totalPercentage.toFixed(0)}% total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {incomeSources.map((source) => (
                  <div
                    key={source.id}
                    className={`p-4 border rounded-lg transition-all ${
                      source.enabled ? 'bg-secondary/50 border-primary/50' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={source.id}
                        checked={source.enabled}
                        onCheckedChange={() => handleToggleSource(source.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-3">
                        <Label htmlFor={source.id} className="text-base font-semibold cursor-pointer">
                          {source.label}
                        </Label>
                        
                        {source.enabled && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                % of Income
                              </Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={source.percentage}
                                  onChange={(e) => handlePercentageChange(source.id, e.target.value)}
                                  className="pr-8"
                                  min="0"
                                  max="100"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                  %
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                Frequency
                              </Label>
                              <Select
                                value={source.frequency}
                                onValueChange={(value: "monthly" | "launch") =>
                                  handleFrequencyChange(source.id, value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="monthly">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      <span>Monthly</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="launch">
                                    <div className="flex items-center gap-2">
                                      <Zap className="h-4 w-4" />
                                      <span>Launch-Based</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardContent className="pt-0 space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                    <Info className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleCalculate}
                    disabled={isCalculating || enabledCount === 0}
                    className="flex-1 h-12 text-base font-semibold"
                    size="lg"
                  >
                    {isCalculating ? (
                      <>
                        <Loader />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Calculate Stability
                      </>
                    )}
                  </Button>
                  {result && (
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      size="lg"
                      className="h-12"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {!result && !isCalculating && (
              <Card className="shadow-lg border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-secondary/50 rounded-full mb-4">
                    <Shield className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Check Your Stability</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Select your income sources and their percentages to see how stable 
                    and diversified your creator income is.
                  </p>
                </CardContent>
              </Card>
            )}

            {isCalculating && (
              <Card className="shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Loader />
                  <p className="mt-4 text-muted-foreground">Analyzing your income stability...</p>
                </CardContent>
              </Card>
            )}

            {result && (
              <div className="space-y-6">
                {/* Main Score Card */}
                <Card className={`shadow-lg border-2 bg-gradient-to-br ${getScoreBgColor(result.score)}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {(() => {
                          const Icon = getRatingIcon(result.rating);
                          return <Icon className={`h-6 w-6 ${getScoreColor(result.score)}`} />;
                        })()}
                        Your Stability Score
                      </CardTitle>
                      <Badge className={`text-sm px-3 py-1 ${getScoreColor(result.score)}`}>
                        {getRatingLabel(result.rating)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <p className={`text-7xl font-bold mb-2 ${getScoreColor(result.score)}`}>
                        {result.score}
                      </p>
                      <p className="text-sm text-muted-foreground">out of 100</p>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Diversification</p>
                        <p className="text-2xl font-bold">{result.breakdown.diversification}</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Predictability</p>
                        <p className="text-2xl font-bold">{result.breakdown.predictability}</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Ownership</p>
                        <p className="text-2xl font-bold">{result.breakdown.ownership}</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Scalability</p>
                        <p className="text-2xl font-bold">{result.breakdown.scalability}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Flags */}
                {result.riskFlags.length > 0 && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        Risk Flags
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.riskFlags.map((flag, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-l-4 ${
                            flag.level === "high"
                              ? "bg-red-50 dark:bg-red-950/20 border-red-500"
                              : flag.level === "medium"
                              ? "bg-orange-50 dark:bg-orange-950/20 border-orange-500"
                              : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {flag.level === "high" ? (
                              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            ) : flag.level === "medium" ? (
                              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            )}
                            <p className="text-sm leading-relaxed">{flag.message}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* AI Insights */}
                <Card className="shadow-lg border-purple-200 dark:border-purple-900">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Income Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        Summary
                      </h4>
                      <p className="text-base leading-relaxed">
                        {result.insights.summary}
                      </p>
                    </div>

                    <div className="p-4 bg-secondary/50 rounded-lg border-l-4 border-orange-500">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        Platform Dependence
                      </h4>
                      <p className="text-sm leading-relaxed">
                        {result.insights.platformDependence}
                      </p>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Recommendation
                      </h4>
                      <p className="text-sm leading-relaxed">
                        {result.insights.recommendation}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Source Analysis */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Source Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.sourceAnalysis.map((source, index) => (
                        <div key={index} className="p-4 bg-secondary/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{source.source}</span>
                            <Badge variant={source.stability >= 70 ? "default" : source.stability >= 40 ? "secondary" : "destructive"}>
                              {source.stability} stability
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Ownership: </span>
                              <span className="font-medium">{source.ownership}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Risk: </span>
                              <span className="font-medium">{source.risk}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Improvements */}
                <Card className="shadow-lg border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      How to Improve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {result.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="text-sm leading-relaxed pt-0.5">{improvement}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                  <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">The Stability Paradox</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Most creators think courses are risky because they require upfront work. But platform-dependent income 
                    (AdSense, sponsorships) can disappear overnight due to algorithm changes or brand budgets. Courses and 
                    owned products are the foundation of stable creator income—they're assets you control that compound over time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <LandingFooter />
    </div>
  );
}
