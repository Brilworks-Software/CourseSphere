"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Award, 
  ArrowLeft, 
  CheckCircle, 
  TrendingUp, 
  Target, 
  Sparkles,
  Info,
  RotateCcw,
  Youtube,
  BookOpen,
  Clock,
  BarChart3,
  Shield
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScoreBreakdown {
  consistency: number;
  depth: number;
  progression: number;
  longevity: number;
  audienceValidation: number;
}

interface AuthorityResult {
  totalScore: number;
  breakdown: ScoreBreakdown;
  authorityLevel: string;
  explanation: string[];
  reassurance: string;
  nicheClassification?: {
    primaryNiche: string;
    consistency: number;
    topicDiversity: string[];
  };
  complexityAnalysis?: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
}

export default function NicheAuthorityPage() {
  const [useYouTubeUrl, setUseYouTubeUrl] = useState(true);
  const [channelUrl, setChannelUrl] = useState("");
  
  // Manual input fields
  const [niche, setNiche] = useState("");
  const [topics, setTopics] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [videoCount, setVideoCount] = useState("");
  const [avgVideoLength, setAvgVideoLength] = useState("");
  
  const [result, setResult] = useState<AuthorityResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelImage, setChannelImage] = useState("");  const [error, setError] = useState<string | null>(null);
  const niches = [
    "Technology & Programming",
    "Business & Finance",
    "Marketing & Sales",
    "Design & Creative",
    "Personal Development",
    "Health & Fitness",
    "Food & Cooking",
    "Education & Teaching",
    "Gaming & Entertainment",
    "Lifestyle & Vlog",
    "Data Science & AI",
    "Content Creation",
    "Photography & Videography",
    "Music Production",
    "Travel & Adventure",
    "Sports & Athletics",
    "Other"
  ];

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      if (useYouTubeUrl) {
        // YouTube API analysis
        const response = await fetch('/api/youtube/niche-authority', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelUrl }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze YouTube channel');
        }

        const data = await response.json();
        setResult(data.result);
        setChannelName(data.channelName || '');
        setChannelImage(data.channelImage || '');
      } else {
        // Manual calculation
        const topicList = topics.split(',').map(t => t.trim()).filter(t => t);
        const manualResult = calculateManualScore(
          niche,
          topicList,
          parseInt(yearsExperience) || 0,
          parseInt(videoCount) || 0,
          parseInt(avgVideoLength) || 0
        );
        setResult(manualResult);
        setChannelName('');
        setChannelImage('');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze. Please try again.');
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateManualScore = (
    nicheInput: string,
    topicList: string[],
    years: number,
    videos: number,
    avgLength: number
  ): AuthorityResult => {
    // Signal 1: Topic Consistency (0-25 points)
    const topicCount = topicList.length;
    let consistencyScore = 0;
    if (topicCount <= 3) consistencyScore = 25; // Highly focused
    else if (topicCount <= 5) consistencyScore = 20;
    else if (topicCount <= 8) consistencyScore = 15;
    else consistencyScore = 10; // Too scattered

    // Signal 2: Content Depth (0-20 points)
    let depthScore = 0;
    if (avgLength >= 20) depthScore = 20; // 20+ min videos
    else if (avgLength >= 15) depthScore = 17;
    else if (avgLength >= 10) depthScore = 14;
    else if (avgLength >= 5) depthScore = 10;
    else depthScore = avgLength * 2;

    // Signal 3: Progression (0-20 points)
    // Assume progression if they have variety of topics (manual entry limitation)
    const progressionScore = Math.min(topicCount * 3, 20);

    // Signal 4: Longevity (0-20 points)
    let longevityScore = 0;
    if (years >= 5) longevityScore = 20;
    else if (years >= 3) longevityScore = 17;
    else if (years >= 2) longevityScore = 14;
    else if (years >= 1) longevityScore = 10;
    else longevityScore = years * 10;

    // Signal 5: Audience Validation (0-15 points)
    // Based on video count as proxy for audience demand
    let audienceScore = 0;
    if (videos >= 100) audienceScore = 15;
    else if (videos >= 50) audienceScore = 13;
    else if (videos >= 25) audienceScore = 11;
    else if (videos >= 10) audienceScore = 8;
    else audienceScore = Math.min(videos * 0.8, 15);

    const totalScore = Math.min(
      consistencyScore + depthScore + progressionScore + longevityScore + audienceScore,
      100
    );

    // Generate explanation and reassurance
    let authorityLevel = "";
    let explanation: string[] = [];
    let reassurance = "";

    if (totalScore >= 80) {
      authorityLevel = "🏆 Master Authority";
      explanation = [
        `You demonstrate exceptional expertise in ${nicheInput}`,
        `Your ${years}+ years of consistent content creation shows deep commitment`,
        `With ${videos} videos averaging ${avgLength} minutes, you provide substantial value`,
        "You're more than qualified to create premium courses"
      ];
      reassurance = "Creators with your level of authority successfully sell courses ranging from ₹5,000 to ₹25,000+. Your expertise commands premium pricing.";
    } else if (totalScore >= 65) {
      authorityLevel = "⭐ Recognized Practitioner";
      explanation = [
        `You consistently teach in the ${nicheInput} space`,
        `Your content depth (avg ${avgLength} min) shows thorough coverage`,
        `${videos} videos demonstrate sustained commitment to teaching`,
        "You have built recognizable authority in your niche"
      ];
      reassurance = "Creators at your level successfully sell courses from ₹2,000 to ₹10,000. Your authority is sufficient for most course topics.";
    } else if (totalScore >= 50) {
      authorityLevel = "✅ Emerging Expert";
      explanation = [
        `You're building solid expertise in ${nicheInput}`,
        `Your ${years} years of experience provides foundation`,
        "Focus on topic consistency to strengthen authority",
        "You have enough expertise to teach specific skills"
      ];
      reassurance = "Many successful course creators start at your level. You can confidently sell courses from ₹999 to ₹5,000 while continuing to build authority.";
    } else {
      authorityLevel = "🌱 Developing Authority";
      explanation = [
        `You're on the journey to becoming an authority in ${nicheInput}`,
        "Focus on creating consistent, in-depth content",
        "Document your learning journey - beginners can teach beginners",
        "Authority grows with consistent output and audience engagement"
      ];
      reassurance = "Don't let imposter syndrome stop you! Even creators with lower authority scores successfully sell ₹499 to ₹2,000 courses. Your unique perspective has value.";
    }

    return {
      totalScore,
      breakdown: {
        consistency: consistencyScore,
        depth: depthScore,
        progression: progressionScore,
        longevity: longevityScore,
        audienceValidation: audienceScore,
      },
      authorityLevel,
      explanation,
      reassurance,
    };
  };

  const handleReset = () => {
    setChannelUrl("");
    setNiche("");
    setTopics("");
    setYearsExperience("");
    setVideoCount("");
    setAvgVideoLength("");
    setResult(null);
    setChannelName("");
    setChannelImage("");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 65) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-orange-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 65) return "bg-blue-600";
    if (score >= 50) return "bg-yellow-600";
    return "bg-orange-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <LandingHeader />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
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
              <Award className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Niche Authority Score</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Kill imposter syndrome with data. Discover if you're expert enough to sell a course.
          </p>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <Info className="inline h-4 w-4 mr-2" />
              This tool measures your authority signals, not credentials. You don't need to be a "guru" to teach!
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
                <CardTitle>Analyze Your Authority</CardTitle>
                <CardDescription>
                  Choose how you want to analyze your teaching authority
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Input Method Toggle */}
                <div className="flex gap-4 p-1 bg-muted rounded-lg">
                  <Button
                    variant={useYouTubeUrl ? "default" : "ghost"}
                    className="flex-1"
                    onClick={() => setUseYouTubeUrl(true)}
                  >
                    <Youtube className="mr-2 h-4 w-4" />
                    YouTube Channel
                  </Button>
                  <Button
                    variant={!useYouTubeUrl ? "default" : "ghost"}
                    className="flex-1"
                    onClick={() => setUseYouTubeUrl(false)}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Manual Entry
                  </Button>
                </div>

                {useYouTubeUrl ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="channelUrl">YouTube Channel URL</Label>
                      <Input
                        id="channelUrl"
                        placeholder="https://youtube.com/@channelname"
                        value={channelUrl}
                        onChange={(e) => setChannelUrl(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        We'll analyze your video history, topics, and consistency
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="niche">Your Niche</Label>
                      <Select value={niche} onValueChange={setNiche}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your niche" />
                        </SelectTrigger>
                        <SelectContent>
                          {niches.map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="topics">Topics You Teach</Label>
                      <Textarea
                        id="topics"
                        placeholder="React, Node.js, TypeScript, MongoDB (comma-separated)"
                        value={topics}
                        onChange={(e) => setTopics(e.target.value)}
                        rows={3}
                      />
                      <p className="text-sm text-muted-foreground">
                        Enter the main topics you create content about
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="yearsExperience">Years Active</Label>
                        <Input
                          id="yearsExperience"
                          type="number"
                          placeholder="2"
                          value={yearsExperience}
                          onChange={(e) => setYearsExperience(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="videoCount">Total Videos/Posts</Label>
                        <Input
                          id="videoCount"
                          type="number"
                          placeholder="50"
                          value={videoCount}
                          onChange={(e) => setVideoCount(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avgVideoLength">Avg Length (min)</Label>
                        <Input
                          id="avgVideoLength"
                          type="number"
                          placeholder="15"
                          value={avgVideoLength}
                          onChange={(e) => setAvgVideoLength(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (useYouTubeUrl ? !channelUrl : !niche || !topics || !yearsExperience)}
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing Your Authority...
                    </>
                  ) : (
                    <>
                      <Target className="mr-2 h-5 w-5" />
                      Calculate Authority Score
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
            {/* Channel Info */}
            {channelName && (
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    {channelImage && (
                      <img 
                        src={channelImage} 
                        alt={channelName}
                        className="w-16 h-16 rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{channelName}</h3>
                      <p className="text-sm text-muted-foreground">Authority Analysis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Score Card */}
            <Card className="shadow-lg border-2">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Your Authority Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Score Display */}
                <div className="text-center space-y-4">
                  <div className={`text-6xl font-bold ${getScoreColor(result.totalScore)}`}>
                    {result.totalScore}/100
                  </div>
                  <div className="text-2xl font-semibold">
                    {result.authorityLevel}
                  </div>
                  <Progress 
                    value={result.totalScore} 
                    className={`h-3 ${getProgressColor(result.totalScore)}`}
                  />
                </div>

                {/* Niche Classification (if available) */}
                {result.nicheClassification && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-2 mb-2">
                      <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                          Niche Classification
                        </h4>
                        <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">
                          Primary Niche: <strong>{result.nicheClassification.primaryNiche}</strong>
                        </p>
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                          Topic Consistency: <strong>{result.nicheClassification.consistency}%</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Complexity Analysis (if available) */}
                {result.complexityAnalysis && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-start gap-2 mb-3">
                      <BarChart3 className="h-5 w-5 text-indigo-600 mt-0.5" />
                      <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">
                        Content Complexity Distribution
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-indigo-800 dark:text-indigo-200">Basic</span>
                        <span className="font-medium text-indigo-900 dark:text-indigo-100">
                          {result.complexityAnalysis.basic}%
                        </span>
                      </div>
                      <Progress value={result.complexityAnalysis.basic} className="h-2" />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-indigo-800 dark:text-indigo-200">Intermediate</span>
                        <span className="font-medium text-indigo-900 dark:text-indigo-100">
                          {result.complexityAnalysis.intermediate}%
                        </span>
                      </div>
                      <Progress value={result.complexityAnalysis.intermediate} className="h-2" />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-indigo-800 dark:text-indigo-200">Advanced</span>
                        <span className="font-medium text-indigo-900 dark:text-indigo-100">
                          {result.complexityAnalysis.advanced}%
                        </span>
                      </div>
                      <Progress value={result.complexityAnalysis.advanced} className="h-2" />
                    </div>
                  </div>
                )}

                {/* Score Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Authority Signals Breakdown
                  </h4>
                  <TooltipProvider>
                    {Object.entries(result.breakdown).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1">
                              <span className="capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{getSignalTooltip(key)}</p>
                            </TooltipContent>
                          </Tooltip>
                          <span className="font-medium">{value}/25</span>
                        </div>
                        <Progress value={(value / 25) * 100} className="h-2" />
                      </div>
                    ))}
                  </TooltipProvider>
                </div>

                {/* Explanation */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Why This Score?</h4>
                  <ul className="space-y-2">
                    {result.explanation.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Reassurance */}
                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                        The Truth About Course Creation
                      </h4>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        {result.reassurance}
                      </p>
                    </div>
                  </div>
                </div>

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
              </CardContent>
            </Card>

            {/* Additional Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Build Your Authority</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h5 className="font-medium text-sm">Consistency Beats Perfection</h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      Publishing regularly builds authority faster than waiting for perfect content
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h5 className="font-medium text-sm">Teach What You're Learning</h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      You don't need to be an expert - just one step ahead of your students
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Target className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h5 className="font-medium text-sm">Narrow Your Focus</h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      Authority comes from depth in one area, not surface knowledge of many
                    </p>
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

function getSignalTooltip(key: string): string {
  const tooltips: Record<string, string> = {
    consistency: "How focused you are on your niche. Fewer topics = higher authority.",
    depth: "Average content length shows how thoroughly you cover topics.",
    progression: "Do you teach both basics and advanced concepts? Shows teaching range.",
    longevity: "How long you've been creating content. Time builds trust.",
    audienceValidation: "Engagement and questions show people value your expertise."
  };
  return tooltips[key] || "Measures your authority in this area";
}
