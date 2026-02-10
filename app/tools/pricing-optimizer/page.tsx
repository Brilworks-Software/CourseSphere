"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Loader from "@/components/loader";
import { 
  DollarSign, 
  ArrowLeft, 
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  CheckCircle2,
  Info,
  RotateCcw,
  Award,
  Users,
  Clock,
  Lightbulb
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

interface PricingResult {
  priceRanges: {
    conservative: number;
    confident: number;
    premium: number;
  };
  reasoning: {
    basePrice: number;
    formatMultiplier: number;
    nicheMultiplier: number;
    audienceAdjustment: number;
  };
  positioning: string;
  justification: string;
  recommendations: string[];
}

export default function PricingOptimizerPage() {
  const [niche, setNiche] = useState("");
  const [audienceLevel, setAudienceLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [courseFormat, setCourseFormat] = useState<"self-paced" | "live-cohort" | "workshop">("self-paced");
  const [duration, setDuration] = useState("");
  const [durationType, setDurationType] = useState<"hours" | "weeks">("hours");
  const [result, setResult] = useState<PricingResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!niche || !duration) {
      setError("Please fill in all required fields");
      return;
    }

    setIsCalculating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tools/pricing-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          niche,
          audienceLevel,
          courseFormat,
          duration: parseFloat(duration),
          durationType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate pricing');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Calculation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to calculate pricing. Please try again.');
      setResult(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setNiche("");
    setAudienceLevel("intermediate");
    setCourseFormat("self-paced");
    setDuration("");
    setDurationType("hours");
    setResult(null);
    setError(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getFormatLabel = (format: string) => {
    const labels: Record<string, string> = {
      'self-paced': 'Self-Paced',
      'live-cohort': 'Live Cohort',
      'workshop': 'Workshop'
    };
    return labels[format] || format;
  };

  const getAudienceLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced'
    };
    return labels[level] || level;
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
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Course Pricing Optimizer
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Overcome pricing fear and discover what you should charge. Get data-driven recommendations 
            with confidence-building justification.
          </p>
          <Badge variant="secondary" className="mt-4 px-4 py-1.5 text-sm font-semibold">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Pricing Intelligence
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
                  Course Details
                </CardTitle>
                <CardDescription>
                  Tell us about your course to get personalized pricing recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Niche Input */}
                <div className="space-y-2">
                  <Label htmlFor="niche" className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Course Niche / Topic
                  </Label>
                  <Input
                    id="niche"
                    placeholder="e.g., Web Development, Photography, Digital Marketing"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Be specific - this affects market pricing benchmarks
                  </p>
                </div>

                {/* Audience Level */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Target Audience Level
                  </Label>
                  <Select value={audienceLevel} onValueChange={(value: any) => setAudienceLevel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">
                        <div className="flex items-center gap-2">
                          <span>🌱</span>
                          <span>Beginner - Starting from scratch</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="intermediate">
                        <div className="flex items-center gap-2">
                          <span>📈</span>
                          <span>Intermediate - Some experience</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="advanced">
                        <div className="flex items-center gap-2">
                          <span>🎓</span>
                          <span>Advanced - Expert-level content</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Course Format */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Course Format
                  </Label>
                  <RadioGroup value={courseFormat} onValueChange={(value: any) => setCourseFormat(value)}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors">
                      <RadioGroupItem value="self-paced" id="self-paced" />
                      <Label htmlFor="self-paced" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Self-Paced</div>
                        <div className="text-xs text-muted-foreground">Pre-recorded content, learn at own speed</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors">
                      <RadioGroupItem value="live-cohort" id="live-cohort" />
                      <Label htmlFor="live-cohort" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Live Cohort</div>
                        <div className="text-xs text-muted-foreground">Live sessions, community, high engagement</div>
                      </Label>
                      <Badge variant="default" className="text-xs">2-4× Premium</Badge>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors">
                      <RadioGroupItem value="workshop" id="workshop" />
                      <Label htmlFor="workshop" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Workshop</div>
                        <div className="text-xs text-muted-foreground">Intensive, hands-on, limited time</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Course Duration
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="duration"
                      type="number"
                      placeholder="e.g., 10"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="text-base flex-1"
                      min="0.5"
                      step="0.5"
                    />
                    <Select value={durationType} onValueChange={(value: any) => setDurationType(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    disabled={isCalculating || !niche || !duration}
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
                        Calculate Optimal Price
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
                    <DollarSign className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Ready to Price with Confidence?</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Fill in your course details to get personalized pricing recommendations 
                    backed by market data and AI insights.
                  </p>
                </CardContent>
              </Card>
            )}

            {isCalculating && (
              <Card className="shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Loader />
                  <p className="mt-4 text-muted-foreground">Analyzing market data and calculating optimal pricing...</p>
                </CardContent>
              </Card>
            )}

            {result && (
              <div className="space-y-6">
                {/* Price Ranges */}
                <Card className="shadow-lg border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Recommended Price Ranges
                    </CardTitle>
                    <CardDescription>
                      Choose the pricing tier that matches your positioning strategy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Conservative */}
                    <div className="p-4 border-2 rounded-lg hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Conservative</Badge>
                          <span className="text-sm text-muted-foreground">Safe entry point</span>
                        </div>
                        <span className="text-3xl font-bold text-primary">
                          {formatPrice(result.priceRanges.conservative)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Lower barrier to entry, build social proof and testimonials first
                      </p>
                    </div>

                    {/* Confident */}
                    <div className="p-4 border-2 border-primary rounded-lg bg-primary/5 relative overflow-hidden">
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary text-primary-foreground">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Confident</Badge>
                          <span className="text-sm text-muted-foreground">Market-aligned</span>
                        </div>
                        <span className="text-4xl font-bold text-primary">
                          {formatPrice(result.priceRanges.confident)}
                        </span>
                      </div>
                      <p className="text-sm">
                        <strong>Optimal pricing</strong> based on your niche, format, and audience level
                      </p>
                    </div>

                    {/* Premium */}
                    <div className="p-4 border-2 rounded-lg hover:border-primary/50 transition-colors bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">
                            <Award className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                          <span className="text-sm text-muted-foreground">Authority positioning</span>
                        </div>
                        <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {formatPrice(result.priceRanges.premium)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        High-value positioning with proven results and unique outcomes
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Breakdown */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Pricing Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Base Price</span>
                      <span className="font-semibold">{formatPrice(result.reasoning.basePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Format Multiplier</span>
                      <span className="font-semibold">{result.reasoning.formatMultiplier}×</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Niche Adjustment</span>
                      <span className="font-semibold">{result.reasoning.nicheMultiplier}×</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Audience Level Adjustment</span>
                      <span className="font-semibold">{result.reasoning.audienceAdjustment}×</span>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Justification */}
                <Card className="shadow-lg border-purple-200 dark:border-purple-900">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Why This Price Makes Sense
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-base leading-relaxed whitespace-pre-line">
                        {result.justification}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Positioning Advice */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Positioning Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg mb-4">
                      <p className="font-medium text-base leading-relaxed">
                        {result.positioning}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Key Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm leading-relaxed">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
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
                  <h3 className="text-lg font-semibold mb-2">Pricing Psychology Tip</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your course price isn't just about covering costs—it's a positioning statement. 
                    Higher prices often lead to more committed students who value the transformation. 
                    Don't compete on price; compete on value, outcomes, and unique insights only you can provide.
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
