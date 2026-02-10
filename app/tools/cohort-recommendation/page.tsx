"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import Loader from "@/components/loader";
import { 
  Users, 
  ArrowLeft, 
  Sparkles,
  Clock,
  Target,
  Zap,
  CheckCircle2,
  Info,
  RotateCcw,
  Calendar,
  Video,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

interface RecommendationResult {
  recommendation: "cohort" | "self-paced" | "hybrid";
  confidence: number;
  score: {
    cohortScore: number;
    selfPacedScore: number;
  };
  reasoning: {
    strengths: string[];
    concerns: string[];
  };
  explanation: string;
  nextSteps: string[];
  comparisonMatrix: {
    timeCommitment: { cohort: string; selfPaced: string; winner: string };
    revenuePerStudent: { cohort: string; selfPaced: string; winner: string };
    scalability: { cohort: string; selfPaced: string; winner: string };
    studentResults: { cohort: string; selfPaced: string; winner: string };
    upfrontWork: { cohort: string; selfPaced: string; winner: string };
  };
  proTip: string;
}

export default function CohortRecommendationPage() {
  const [timeAvailability, setTimeAvailability] = useState("");
  const [audienceSize, setAudienceSize] = useState("");
  const [teachingConfidence, setTeachingConfidence] = useState([5]);
  const [revenueGoal, setRevenueGoal] = useState("");
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!timeAvailability || !audienceSize || !revenueGoal) {
      setError("Please fill in all required fields");
      return;
    }

    setIsCalculating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tools/cohort-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timeAvailability: parseFloat(timeAvailability),
          audienceSize: parseInt(audienceSize),
          teachingConfidence: teachingConfidence[0],
          revenueGoal: parseFloat(revenueGoal)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendation');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Calculation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to calculate recommendation. Please try again.');
      setResult(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setTimeAvailability("");
    setAudienceSize("");
    setTeachingConfidence([5]);
    setRevenueGoal("");
    setResult(null);
    setError(null);
  };

  const getConfidenceLabel = (level: number) => {
    if (level >= 8) return "Very Confident";
    if (level >= 6) return "Confident";
    if (level >= 4) return "Moderate";
    if (level >= 2) return "Somewhat Nervous";
    return "Very Nervous";
  };

  const getConfidenceColor = (level: number) => {
    if (level >= 7) return "text-green-600";
    if (level >= 4) return "text-yellow-600";
    return "text-orange-600";
  };

  const getRecommendationIcon = (rec: string) => {
    if (rec === "cohort") return Calendar;
    if (rec === "self-paced") return Video;
    return Zap;
  };

  const getRecommendationColor = (rec: string) => {
    if (rec === "cohort") return "from-purple-500 to-pink-500";
    if (rec === "self-paced") return "from-blue-500 to-cyan-500";
    return "from-orange-500 to-yellow-500";
  };

  const getRecommendationLabel = (rec: string) => {
    if (rec === "cohort") return "Live Cohort";
    if (rec === "self-paced") return "Self-Paced Course";
    return "Hybrid Approach";
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
              Cohort vs Self-Paced
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop guessing. Get a personalized recommendation on whether to launch a live cohort 
            or self-paced course based on your situation.
          </p>
          <Badge variant="secondary" className="mt-4 px-4 py-1.5 text-sm font-semibold">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Decision Engine
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
                  Answer these questions to get a personalized recommendation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Time Availability */}
                <div className="space-y-2">
                  <Label htmlFor="timeAvailability" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Availability (hours per week)
                  </Label>
                  <Input
                    id="timeAvailability"
                    type="number"
                    placeholder="e.g., 10"
                    value={timeAvailability}
                    onChange={(e) => setTimeAvailability(e.target.value)}
                    className="text-base"
                    min="1"
                    max="80"
                  />
                  <p className="text-xs text-muted-foreground">
                    How many hours per week can you dedicate to teaching?
                  </p>
                </div>

                {/* Audience Size */}
                <div className="space-y-2">
                  <Label htmlFor="audienceSize" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Current Audience Size
                  </Label>
                  <Select value={audienceSize} onValueChange={setAudienceSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your audience size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Just Starting (0-100)</SelectItem>
                      <SelectItem value="500">Small (100-1,000)</SelectItem>
                      <SelectItem value="2500">Growing (1,000-5,000)</SelectItem>
                      <SelectItem value="10000">Established (5,000-20,000)</SelectItem>
                      <SelectItem value="50000">Large (20,000+)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Email list, social followers, or YouTube subscribers
                  </p>
                </div>

                {/* Teaching Confidence */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Confidence in Teaching Live
                  </Label>
                  <div className="px-2">
                    <Slider
                      value={teachingConfidence}
                      onValueChange={setTeachingConfidence}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm text-muted-foreground">Nervous</span>
                      <Badge variant="secondary" className={`${getConfidenceColor(teachingConfidence[0])}`}>
                        {teachingConfidence[0]}/10 - {getConfidenceLabel(teachingConfidence[0])}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Expert</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    How comfortable are you teaching live sessions?
                  </p>
                </div>

                {/* Revenue Goal */}
                <div className="space-y-2">
                  <Label htmlFor="revenueGoal" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Revenue Goal (first launch)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="revenueGoal"
                      type="number"
                      placeholder="e.g., 10000"
                      value={revenueGoal}
                      onChange={(e) => setRevenueGoal(e.target.value)}
                      className="text-base pl-7"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    What do you want to earn from your first cohort/launch?
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
                    disabled={isCalculating || !timeAvailability || !audienceSize || !revenueGoal}
                    className="flex-1 h-12 text-base font-semibold"
                    size="lg"
                  >
                    {isCalculating ? (
                      <>
                        <Loader />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Get Recommendation
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
                  <h3 className="text-xl font-semibold mb-2">Ready to Find Your Path?</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Fill in your details to get a personalized recommendation on whether 
                    to launch a cohort or create a self-paced course.
                  </p>
                </CardContent>
              </Card>
            )}

            {isCalculating && (
              <Card className="shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Loader />
                  <p className="mt-4 text-muted-foreground">Analyzing your situation...</p>
                </CardContent>
              </Card>
            )}

            {result && (
              <div className="space-y-6">
                {/* Main Recommendation */}
                <Card className={`shadow-lg border-2 bg-gradient-to-br ${result.recommendation === 'cohort' ? 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-300 dark:border-purple-700' : result.recommendation === 'self-paced' ? 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-300 dark:border-blue-700' : 'from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 border-orange-300 dark:border-orange-700'}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {(() => {
                          const Icon = getRecommendationIcon(result.recommendation);
                          return <Icon className="h-6 w-6" />;
                        })()}
                        Our Recommendation
                      </CardTitle>
                      <Badge className="text-sm px-3 py-1">
                        {result.confidence}% Confidence
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-6">
                      <h2 className={`text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r ${getRecommendationColor(result.recommendation)} bg-clip-text text-transparent`}>
                        {getRecommendationLabel(result.recommendation)}
                      </h2>
                      <p className="text-muted-foreground">
                        Based on your situation, this is the best fit for you right now.
                      </p>
                    </div>

                    {/* Score Comparison */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-background/50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold text-sm">Cohort Score</span>
                        </div>
                        <p className="text-3xl font-bold text-purple-600">{result.score.cohortScore}</p>
                      </div>
                      <div className="p-4 bg-background/50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Video className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-sm">Self-Paced Score</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">{result.score.selfPacedScore}</p>
                      </div>
                    </div>

                    {/* Strengths */}
                    <div className="space-y-2 mb-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Why This Works For You
                      </h4>
                      <ul className="space-y-2">
                        {result.reasoning.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Concerns */}
                    {result.reasoning.concerns.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          Things to Consider
                        </h4>
                        <ul className="space-y-2">
                          {result.reasoning.concerns.map((concern, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span>{concern}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Explanation */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Why This Makes Sense
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-base leading-relaxed whitespace-pre-line">
                      {result.explanation}
                    </p>
                  </CardContent>
                </Card>

                {/* Comparison Matrix */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Quick Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(result.comparisonMatrix).map(([key, data]) => (
                        <div key={key} className="border rounded-lg p-3">
                          <h4 className="font-semibold text-sm mb-2 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className={`p-2 rounded ${data.winner === 'cohort' ? 'bg-purple-100 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-700' : 'bg-secondary/50'}`}>
                              <div className="font-medium text-xs text-muted-foreground mb-1">Cohort</div>
                              <div>{data.cohort}</div>
                            </div>
                            <div className={`p-2 rounded ${data.winner === 'self-paced' ? 'bg-blue-100 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700' : 'bg-secondary/50'}`}>
                              <div className="font-medium text-xs text-muted-foreground mb-1">Self-Paced</div>
                              <div>{data.selfPaced}</div>
                            </div>
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

                {/* Pro Tip */}
                <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                        <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">Pro Tip</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.proTip}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
