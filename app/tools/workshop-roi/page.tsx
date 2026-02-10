"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/loader";
import { 
  DollarSign, 
  ArrowLeft, 
  Sparkles,
  Clock,
  Users,
  TrendingUp,
  CheckCircle2,
  Info,
  RotateCcw,
  Zap,
  Target,
  Award,
  Calendar,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

interface ROIResult {
  revenue: {
    gross: number;
    perStudent: number;
    effectiveHourly: number;
  };
  comparisons: {
    sponsorships: {
      equivalent: number;
      description: string;
    };
    coachingCalls: {
      equivalent: number;
      description: string;
    };
    hourlyJob: {
      equivalent: number;
      description: string;
    };
  };
  breakdown: {
    totalTime: number;
    prepTime: number;
    deliveryTime: number;
    revenuePerHour: number;
  };
  insights: {
    narrative: string;
    riskAssessment: string;
    recommendation: string;
  };
  nextSteps: string[];
  confidenceFactors: {
    label: string;
    value: string;
    isPositive: boolean;
  }[];
}

export default function WorkshopROIPage() {
  const [duration, setDuration] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [attendance, setAttendance] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [pastWebinarAttendance, setPastWebinarAttendance] = useState("");
  const [result, setResult] = useState<ROIResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!duration || !ticketPrice || !attendance || !prepTime) {
      setError("Please fill in all required fields");
      return;
    }

    setIsCalculating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tools/workshop-roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          duration: parseFloat(duration),
          ticketPrice: parseFloat(ticketPrice),
          attendance: parseInt(attendance),
          prepTime: parseFloat(prepTime),
          pastWebinarAttendance: pastWebinarAttendance ? parseInt(pastWebinarAttendance) : undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate ROI');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Calculation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to calculate ROI. Please try again.');
      setResult(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setDuration("");
    setTicketPrice("");
    setAttendance("");
    setPrepTime("");
    setPastWebinarAttendance("");
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

  const formatHourly = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Live Workshop ROI Estimator
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Is it worth doing a live workshop? Get clear ROI calculations and see how workshops 
            compare to sponsorships and other income streams.
          </p>
          <Badge variant="secondary" className="mt-4 px-4 py-1.5 text-sm font-semibold">
            <Sparkles className="w-4 h-4 mr-2" />
            Low-Risk Validation Strategy
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
                  Workshop Details
                </CardTitle>
                <CardDescription>
                  Enter your workshop details to calculate ROI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Workshop Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Workshop Duration (hours) *
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g., 2"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="text-base"
                    min="0.5"
                    step="0.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    How long will the live workshop be?
                  </p>
                </div>

                {/* Ticket Price */}
                <div className="space-y-2">
                  <Label htmlFor="ticketPrice" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Ticket Price *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="ticketPrice"
                      type="number"
                      placeholder="e.g., 97"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(e.target.value)}
                      className="text-base pl-7"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    How much will you charge per attendee?
                  </p>
                </div>

                {/* Expected Attendance */}
                <div className="space-y-2">
                  <Label htmlFor="attendance" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Expected Attendance *
                  </Label>
                  <Input
                    id="attendance"
                    type="number"
                    placeholder="e.g., 20"
                    value={attendance}
                    onChange={(e) => setAttendance(e.target.value)}
                    className="text-base"
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    How many people do you expect to attend?
                  </p>
                </div>

                {/* Prep Time */}
                <div className="space-y-2">
                  <Label htmlFor="prepTime" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Prep Time (hours) *
                  </Label>
                  <Input
                    id="prepTime"
                    type="number"
                    placeholder="e.g., 4"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    className="text-base"
                    min="0"
                    step="0.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Hours needed for planning, slides, and setup
                  </p>
                </div>

                {/* Past Webinar Attendance (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="pastWebinarAttendance" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Past Webinar Attendance (Optional)
                  </Label>
                  <Input
                    id="pastWebinarAttendance"
                    type="number"
                    placeholder="e.g., 50"
                    value={pastWebinarAttendance}
                    onChange={(e) => setPastWebinarAttendance(e.target.value)}
                    className="text-base"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Helps estimate realistic attendance based on your history
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
                    disabled={isCalculating || !duration || !ticketPrice || !attendance || !prepTime}
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
                        Calculate ROI
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
                    <Calendar className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Ready to Calculate Your ROI?</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Enter your workshop details to see if it's worth doing and how it compares 
                    to other income opportunities.
                  </p>
                </CardContent>
              </Card>
            )}

            {isCalculating && (
              <Card className="shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Loader />
                  <p className="mt-4 text-muted-foreground">Crunching the numbers...</p>
                </CardContent>
              </Card>
            )}

            {result && (
              <div className="space-y-6">
                {/* Main Revenue Card */}
                <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Your Workshop Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
                      <p className="text-5xl font-bold text-green-600 mb-2">
                        {formatCurrency(result.revenue.gross)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(result.revenue.perStudent)} per student
                      </p>
                    </div>

                    <div className="p-4 bg-background/50 rounded-lg border-2 border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-green-600" />
                          <span className="font-semibold">Effective Hourly Rate</span>
                        </div>
                        <span className="text-2xl font-bold text-green-600">
                          {formatHourly(result.revenue.effectiveHourly)}/hr
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-muted-foreground mb-1">Prep Time</p>
                        <p className="font-semibold">{result.breakdown.prepTime}h</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-muted-foreground mb-1">Delivery</p>
                        <p className="font-semibold">{result.breakdown.deliveryTime}h</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-muted-foreground mb-1">Total Time</p>
                        <p className="font-semibold">{result.breakdown.totalTime}h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Comparisons */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      How This Compares
                    </CardTitle>
                    <CardDescription>
                      See how your workshop stacks up against other income streams
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Sponsorships */}
                    <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">vs Sponsorships</span>
                        <Badge variant="default">
                          {result.comparisons.sponsorships.equivalent}× sponsorships
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.comparisons.sponsorships.description}
                      </p>
                    </div>

                    {/* Coaching Calls */}
                    <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">vs Coaching Calls</span>
                        <Badge variant="default">
                          {result.comparisons.coachingCalls.equivalent} calls
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.comparisons.coachingCalls.description}
                      </p>
                    </div>

                    {/* Hourly Job */}
                    <div className="p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">vs Traditional Job</span>
                        <Badge variant="default">
                          {result.comparisons.hourlyJob.equivalent}× higher
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.comparisons.hourlyJob.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card className="shadow-lg border-purple-200 dark:border-purple-900">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        The Bottom Line
                      </h4>
                      <p className="text-base leading-relaxed">
                        {result.insights.narrative}
                      </p>
                    </div>

                    <div className="p-4 bg-secondary/50 rounded-lg border-l-4 border-blue-500">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        Risk Assessment
                      </h4>
                      <p className="text-sm leading-relaxed">
                        {result.insights.riskAssessment}
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

                {/* Confidence Factors */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Confidence Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.confidenceFactors.map((factor, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            factor.isPositive
                              ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                              : 'bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800'
                          }`}
                        >
                          <span className="text-sm font-medium">{factor.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{factor.value}</span>
                            {factor.isPositive ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Info className="h-4 w-4 text-orange-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Next Steps */}
                <Card className="shadow-lg border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowRight className="h-5 w-5 text-primary" />
                      Your Next Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {result.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="text-sm leading-relaxed pt-0.5">{step}</span>
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
                  <h3 className="text-lg font-semibold mb-2">Why Workshops Are Low-Risk</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Live workshops are the perfect way to validate your course idea before investing months in content creation. 
                    You teach live, get real-time feedback, and earn money while testing demand. Plus, you can record everything 
                    and convert it into a self-paced course later. It's validation with revenue.
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
