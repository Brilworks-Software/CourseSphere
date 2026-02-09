"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  ArrowLeft, 
  Sparkles,
  TrendingUp,
  Target,
  Youtube,
  MessageSquare,
  Info,
  RotateCcw,
  GraduationCap,
  Rocket,
  Zap
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

interface AudienceLevelBreakdown {
  beginner: number;
  intermediate: number;
  advanced: number;
}

interface SampleComment {
  text: string;
  level: string;
}

interface AnalyzerResult {
  breakdown: AudienceLevelBreakdown;
  totalComments: number;
  recommendation: string;
  courseSuggestion: string;
  pricingStrategy: string;
  sampleComments: {
    beginner: SampleComment[];
    intermediate: SampleComment[];
    advanced: SampleComment[];
  };
  dominantLevel: string;
}

export default function AudienceAnalyzerPage() {
  const [inputUrl, setInputUrl] = useState("");
  const [inputType, setInputType] = useState<"channel" | "video">("video");
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [channelName, setChannelName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/youtube/audience-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: inputUrl,
          inputType 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze audience');
      }

      const data = await response.json();
      setResult(data.result);
      setVideoTitle(data.videoTitle || '');
      setChannelName(data.channelName || '');
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze. Please check the URL and try again.');
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setInputUrl("");
    setResult(null);
    setVideoTitle("");
    setChannelName("");    setError(null);  };

  const getColorForLevel = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-600';
      case 'intermediate': return 'text-blue-600';
      case 'advanced': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressColorForLevel = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-600';
      case 'intermediate': return 'bg-blue-600';
      case 'advanced': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  const getIconForLevel = (level: string) => {
    switch (level) {
      case 'beginner': return <GraduationCap className="h-5 w-5 text-green-600" />;
      case 'intermediate': return <Target className="h-5 w-5 text-blue-600" />;
      case 'advanced': return <Rocket className="h-5 w-5 text-purple-600" />;
      default: return null;
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
              <Users className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Beginner vs Advanced Audience Analyzer</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover who your course should be for. Analyze your audience's skill level to avoid the 'too broad course' mistake.
          </p>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <Info className="inline h-4 w-4 mr-2" />
              We analyze YouTube comments to determine if your audience is beginner, intermediate, or advanced level
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
                <CardTitle>Analyze Your Audience</CardTitle>
                <CardDescription>
                  Paste a YouTube channel or video URL to understand your audience's skill level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Input Type Toggle */}
                <div className="flex gap-4 p-1 bg-muted rounded-lg">
                  <Button
                    variant={inputType === "video" ? "default" : "ghost"}
                    className="flex-1"
                    onClick={() => setInputType("video")}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Single Video
                  </Button>
                  <Button
                    variant={inputType === "channel" ? "default" : "ghost"}
                    className="flex-1"
                    onClick={() => setInputType("channel")}
                  >
                    <Youtube className="mr-2 h-4 w-4" />
                    Channel (Multiple Videos)
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">
                      {inputType === "video" ? "YouTube Video URL" : "YouTube Channel URL"}
                    </Label>
                    <Input
                      id="url"
                      placeholder={
                        inputType === "video"
                          ? "https://youtube.com/watch?v=..."
                          : "https://youtube.com/@channelname"
                      }
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      {inputType === "video"
                        ? "We'll analyze comments from this specific video"
                        : "We'll analyze comments from your most popular videos"}
                    </p>
                  </div>
                </div>
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
                  </div>
                )}
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !inputUrl}
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing Comments...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Analyze Audience Level
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
            {/* Video/Channel Info */}
            {(videoTitle || channelName) && (
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {videoTitle && (
                      <div>
                        <p className="text-sm text-muted-foreground">Analyzed Video</p>
                        <h3 className="text-lg font-semibold">{videoTitle}</h3>
                      </div>
                    )}
                    {channelName && (
                      <div>
                        <p className="text-sm text-muted-foreground">Channel</p>
                        <p className="font-medium">{channelName}</p>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {result.totalComments} comments analyzed
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Breakdown Card */}
            <Card className="shadow-lg border-2">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Audience Skill Level Breakdown</CardTitle>
                <CardDescription>Based on comment analysis and question patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visual Breakdown */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getIconForLevel('beginner')}
                        <span className="font-medium">Beginner</span>
                      </div>
                      <span className={`text-2xl font-bold ${getColorForLevel('beginner')}`}>
                        {result.breakdown.beginner}%
                      </span>
                    </div>
                    <Progress 
                      value={result.breakdown.beginner} 
                      className={`h-3 ${getProgressColorForLevel('beginner')}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Asking basic "what is" and "how to start" questions
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getIconForLevel('intermediate')}
                        <span className="font-medium">Intermediate</span>
                      </div>
                      <span className={`text-2xl font-bold ${getColorForLevel('intermediate')}`}>
                        {result.breakdown.intermediate}%
                      </span>
                    </div>
                    <Progress 
                      value={result.breakdown.intermediate} 
                      className={`h-3 ${getProgressColorForLevel('intermediate')}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Asking about optimization and best practices
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getIconForLevel('advanced')}
                        <span className="font-medium">Advanced</span>
                      </div>
                      <span className={`text-2xl font-bold ${getColorForLevel('advanced')}`}>
                        {result.breakdown.advanced}%
                      </span>
                    </div>
                    <Progress 
                      value={result.breakdown.advanced} 
                      className={`h-3 ${getProgressColorForLevel('advanced')}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Asking about scaling, automation, and advanced techniques
                    </p>
                  </div>
                </div>

                {/* Dominant Level Badge */}
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Dominant Audience Level</p>
                  <p className="text-2xl font-bold text-primary capitalize">{result.dominantLevel}</p>
                </div>

                {/* Recommendation */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Course Recommendation
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {result.recommendation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Course Suggestion */}
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-2">
                    <GraduationCap className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                        Course Structure Suggestion
                      </h4>
                      <p className="text-sm text-purple-800 dark:text-purple-200">
                        {result.courseSuggestion}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pricing Strategy */}
                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                        Pricing Strategy
                      </h4>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        {result.pricingStrategy}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sample Comments */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Sample Comment Analysis</CardTitle>
                <CardDescription>
                  Real comments from your audience, classified by skill level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {result.sampleComments.beginner.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      {getIconForLevel('beginner')}
                      <h4 className="font-semibold">Beginner Comments</h4>
                    </div>
                    <div className="space-y-2">
                      {result.sampleComments.beginner.slice(0, 3).map((comment, idx) => (
                        <div 
                          key={idx}
                          className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                        >
                          <p className="text-sm text-green-900 dark:text-green-100">
                            "{comment.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.sampleComments.intermediate.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      {getIconForLevel('intermediate')}
                      <h4 className="font-semibold">Intermediate Comments</h4>
                    </div>
                    <div className="space-y-2">
                      {result.sampleComments.intermediate.slice(0, 3).map((comment, idx) => (
                        <div 
                          key={idx}
                          className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                        >
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            "{comment.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.sampleComments.advanced.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      {getIconForLevel('advanced')}
                      <h4 className="font-semibold">Advanced Comments</h4>
                    </div>
                    <div className="space-y-2">
                      {result.sampleComments.advanced.slice(0, 3).map((comment, idx) => (
                        <div 
                          key={idx}
                          className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800"
                        >
                          <p className="text-sm text-purple-900 dark:text-purple-100">
                            "{comment.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleReset} variant="outline" className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />
                Analyze Another
              </Button>
              <Link href="/courses" className="flex-1">
                <Button className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Your Course
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
