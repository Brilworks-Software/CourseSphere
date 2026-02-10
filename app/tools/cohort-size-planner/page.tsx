"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import Loader from "@/components/loader";
import { 
  Users, 
  ArrowLeft, 
  Sparkles,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Info,
  RotateCcw,
  Zap,
  Target,
  Award,
  Heart,
  AlertCircle,
  Lightbulb,
  Battery,
  BatteryWarning,
  BatteryFull
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

interface PlannerResult {
  cohortSize: {
    min: number;
    recommended: number;
    max: number;
  };
  pricing: {
    perSeat: number;
    reasoning: string;
  };
  revenue: {
    conservative: number;
    recommended: number;
    optimistic: number;
  };
  energyCost: {
    level: "low" | "moderate" | "high";
    indicator: string;
    hoursPerStudent: number;
    totalWeeklyHours: number;
  };
  insights: {
    reasoning: string;
    warnings: string[];
    benefits: string[];
  };
  recommendations: string[];
  comparison: {
    label: string;
    value: string;
  }[];
}

export default function CohortSizePlannerPage() {
  const [weeklyAvailability, setWeeklyAvailability] = useState("");
  const [desiredIncome, setDesiredIncome] = useState("");
  const [teachingComfort, setTeachingComfort] = useState([3]);
  const [audienceSize, setAudienceSize] = useState("");
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!weeklyAvailability || !desiredIncome || !audienceSize) {
      setError("Please fill in all required fields");
      return;
    }

    setIsCalculating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tools/cohort-size-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          weeklyAvailability: parseFloat(weeklyAvailability),
          desiredIncome: parseFloat(desiredIncome),
          teachingComfort: teachingComfort[0],
          audienceSize: parseInt(audienceSize)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate plan');
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
    setWeeklyAvailability("");
    setDesiredIncome("");
    setTeachingComfort([3]);
    setAudienceSize("");
    setResult(null);
    setError(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getComfortLabel = (level: number) => {
    if (level >= 5) return "Very Comfortable";
    if (level >= 4) return "Comfortable";
    if (level >= 3) return "Neutral";
    if (level >= 2) return "Somewhat Nervous";
    return "Very Nervous";
  };

  const getComfortColor = (level: number) => {
    if (level >= 4) return "text-green-600";
    if (level >= 3) return "text-yellow-600";
    return "text-orange-600";
  };

  const getEnergyIcon = (level: string) => {
    if (level === "low") return BatteryFull;
    if (level === "moderate") return Battery;
    return BatteryWarning;
  };

  const getEnergyColor = (level: string) => {
    if (level === "low") return "text-green-600";
    if (level === "moderate") return "text-yellow-600";
    return "text-orange-600";
  };

  const getEnergyBgColor = (level: string) => {
    if (level === "low") return "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-300 dark:border-green-700";
    if (level === "moderate") return "from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-300 dark:border-yellow-700";
    return "from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-300 dark:border-orange-700";
  };

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
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Cohort Size & Pricing Planner
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop guessing how many students to take. Get personalized recommendations 
            for cohort size and pricing that protect your energy and maximize outcomes.
          </p>
          <Badge variant="secondary" className="mt-4 px-4 py-1.5 text-sm font-semibold">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Capacity Planning
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
                  Your Situation
                </CardTitle>
                <CardDescription>
                  Tell us about your availability and goals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Weekly Availability */}
                <div className="space-y-2">
                  <Label htmlFor="weeklyAvailability" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Weekly Availability (hours) *
                  </Label>
                  <Input
                    id="weeklyAvailability"
                    type="number"
                    placeholder="e.g., 10"
                    value={weeklyAvailability}
                    onChange={(e) => setWeeklyAvailability(e.target.value)}
                    className="text-base"
                    min="1"
                    max="80"
                    step="0.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Hours per week you can dedicate to teaching and support
                  </p>
                </div>

                {/* Desired Income */}
                <div className="space-y-2">
                  <Label htmlFor="desiredIncome" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Desired Income (per cohort) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="desiredIncome"
                      type="number"
                      placeholder="e.g., 10000"
                      value={desiredIncome}
                      onChange={(e) => setDesiredIncome(e.target.value)}
                      className="text-base pl-7"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    What do you want to earn from this cohort?
                  </p>
                </div>

                {/* Teaching Comfort */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Teaching Comfort Level
                  </Label>
                  <div className="px-2">
                    <Slider
                      value={teachingComfort}
                      onValueChange={setTeachingComfort}
                      min={1}
                      max={5}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm text-muted-foreground">Nervous</span>
                      <Badge variant="secondary" className={`${getComfortColor(teachingComfort[0])}`}>
                        {teachingComfort[0]}/5 - {getComfortLabel(teachingComfort[0])}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Expert</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    How comfortable are you managing live group teaching?
                  </p>
                </div>

                {/* Audience Size */}
                <div className="space-y-2">
                  <Label htmlFor="audienceSize" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Audience Size *
                  </Label>
                  <Input
                    id="audienceSize"
                    type="number"
                    placeholder="e.g., 5000"
                    value={audienceSize}
                    onChange={(e) => setAudienceSize(e.target.value)}
                    className="text-base"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email list, social followers, or YouTube subscribers
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                    <Info className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleCalculate}
                    disabled={isCalculating || !weeklyAvailability || !desiredIncome || !audienceSize}
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
                        Calculate Plan
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
                    <Users className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Ready to Plan Your Cohort?</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Enter your details to get personalized recommendations for cohort size, 
                    pricing, and energy management.
                  </p>
                </CardContent>
              </Card>
            )}

            {isCalculating && (
              <Card className="shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Loader />
                  <p className="mt-4 text-muted-foreground">Calculating optimal cohort size...</p>
                </CardContent>
              </Card>
            )}

            {result && (
              <div className="space-y-6">
                {/* Cohort Size Recommendation */}
                <Card className="shadow-lg border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Recommended Cohort Size
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4">
                      <p className="text-6xl font-bold text-primary mb-2">
                        {result.cohortSize.recommended}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        students per cohort
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-secondary/50 rounded-lg border">
                        <p className="text-xs text-muted-foreground mb-1">Minimum</p>
                        <p className="text-2xl font-bold">{result.cohortSize.min}</p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg border-2 border-primary">
                        <p className="text-xs text-muted-foreground mb-1">Optimal</p>
                        <p className="text-2xl font-bold text-primary">{result.cohortSize.recommended}</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg border">
                        <p className="text-xs text-muted-foreground mb-1">Maximum</p>
                        <p className="text-2xl font-bold">{result.cohortSize.max}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card className="shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Pricing Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-3">
                      <p className="text-sm text-muted-foreground mb-2">Price Per Seat</p>
                      <p className="text-5xl font-bold text-green-600">
                        {formatCurrency(result.pricing.perSeat)}
                      </p>
                    </div>

                    <div className="p-4 bg-background/50 rounded-lg border">
                      <p className="text-sm leading-relaxed">
                        {result.pricing.reasoning}
                      </p>
                    </div>

                    {/* Revenue Scenarios */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Expected Revenue</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 bg-background/50 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground mb-1">Conservative</p>
                          <p className="font-semibold text-sm">{formatCurrency(result.revenue.conservative)}</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-center border-2 border-green-500">
                          <p className="text-xs text-muted-foreground mb-1">Recommended</p>
                          <p className="font-semibold text-green-600">{formatCurrency(result.revenue.recommended)}</p>
                        </div>
                        <div className="p-3 bg-background/50 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground mb-1">Optimistic</p>
                          <p className="font-semibold text-sm">{formatCurrency(result.revenue.optimistic)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Energy Cost */}
                <Card className={`shadow-lg border-2 bg-gradient-to-br ${getEnergyBgColor(result.energyCost.level)}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {(() => {
                          const Icon = getEnergyIcon(result.energyCost.level);
                          return <Icon className={`h-5 w-5 ${getEnergyColor(result.energyCost.level)}`} />;
                        })()}
                        Energy Cost
                      </span>
                      <Badge className={`${getEnergyColor(result.energyCost.level)}`}>
                        {result.energyCost.level.toUpperCase()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-base font-medium">
                      {result.energyCost.indicator}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Per Student</p>
                        <p className="font-semibold">{result.energyCost.hoursPerStudent.toFixed(1)} hrs/week</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Total Weekly</p>
                        <p className="font-semibold">{result.energyCost.totalWeeklyHours.toFixed(1)} hrs</p>
                      </div>
                    </div>

                    {result.energyCost.level === "high" && (
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-orange-800 dark:text-orange-200">
                          This workload might lead to burnout. Consider reducing cohort size or increasing price.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card className="shadow-lg border-purple-200 dark:border-purple-900">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Why This Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <p className="text-base leading-relaxed">
                      {result.insights.reasoning}
                    </p>

                    {/* Benefits */}
                    {result.insights.benefits.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Key Benefits
                        </h4>
                        <ul className="space-y-2">
                          {result.insights.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warnings */}
                    {result.insights.warnings.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          Things to Watch
                        </h4>
                        <ul className="space-y-2">
                          {result.insights.warnings.map((warning, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Comparison Table */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Quick Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.comparison.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className="text-sm font-semibold text-primary">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="shadow-lg border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Action Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="text-sm leading-relaxed pt-0.5">{rec}</span>
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
                  <h3 className="text-lg font-semibold mb-2">Why Smaller Can Be Better</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Most creators take too many students and undercharge. The result? Burnout and mediocre outcomes. 
                    A smaller cohort at a premium price gives students better results (higher completion, more attention) 
                    while protecting your energy. You're not just selling access—you're selling transformation.
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
