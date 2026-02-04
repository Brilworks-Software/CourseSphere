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
  Youtube, 
  ArrowLeft, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Eye, 
  MessageCircle, 
  Calendar,
  Target,
  Sparkles,
  Info,
  RotateCcw
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

interface ScoreBreakdown {
  audienceSize: number;
  engagement: number;
  consistency: number;
  educationalDepth: number;
  demand: number;
}

interface MonetizationResult {
  totalScore: number;
  breakdown: ScoreBreakdown;
  engagementRate: number;
  readinessLevel: string;
  insights: string[];
  monetizationPotential: string;
  recommendedPricing: { min: number; max: number };
}

export default function YouTubeMonetizationPage() {
  const [useChannelUrl, setUseChannelUrl] = useState(true);
  const [channelUrl, setChannelUrl] = useState("");
  
  // Manual input fields
  const [subscribers, setSubscribers] = useState("");
  const [avgViews, setAvgViews] = useState("");
  const [avgComments, setAvgComments] = useState("");
  const [uploadsPerMonth, setUploadsPerMonth] = useState("");
  const [niche, setNiche] = useState("");
  
  const [result, setResult] = useState<MonetizationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelImage, setChannelImage] = useState("");
  const [fetchedEngagementRate, setFetchedEngagementRate] = useState<number | null>(null);

  const niches = [
    "Technology & Programming",
    "Business & Finance",
    "Marketing & Sales",
    "Design & Creative",
    "Personal Development",
    "Health & Fitness",
    "Education & Teaching",
    "Gaming & Entertainment",
    "Lifestyle & Vlog",
    "Other"
  ];

  const calculateMonetizationScore = (
    overrideData?: {
      subscribers?: number;
      avgViews?: number;
      avgComments?: number;
      uploadsPerMonth?: number;
      engagementRate?: number;
    }
  ): MonetizationResult => {
    const subs = overrideData?.subscribers ?? (parseInt(subscribers) || 0);
    const views = overrideData?.avgViews ?? (parseInt(avgViews) || 0);
    const comments = overrideData?.avgComments ?? (parseInt(avgComments) || 0);
    const uploads = overrideData?.uploadsPerMonth ?? (parseInt(uploadsPerMonth) || 0);

    // Use provided engagement rate or calculate from comments/views
    let engagementRate: number;
    if (overrideData?.engagementRate !== undefined) {
      engagementRate = overrideData.engagementRate;
    } else if (fetchedEngagementRate !== null) {
      engagementRate = fetchedEngagementRate;
    } else {
      engagementRate = views > 0 ? (comments / views) * 100 : 0;
    }

    // Signal 1: Audience Size Score (0-25 points)
    let audienceSizeScore = 0;
    if (subs >= 100000) audienceSizeScore = 25;
    else if (subs >= 50000) audienceSizeScore = 22;
    else if (subs >= 25000) audienceSizeScore = 20;
    else if (subs >= 10000) audienceSizeScore = 17;
    else if (subs >= 5000) audienceSizeScore = 15;
    else if (subs >= 1000) audienceSizeScore = 10;
    else audienceSizeScore = (subs / 1000) * 10;

    // Signal 2: Engagement Score (0-25 points)
    // Use engagement rate for scoring
    let engagementScore = 0;
    if (engagementRate >= 1.0) engagementScore = 25;
    else if (engagementRate >= 0.5) engagementScore = 22;
    else if (engagementRate >= 0.3) engagementScore = 18;
    else if (engagementRate >= 0.1) engagementScore = 15;
    else if (engagementRate >= 0.05) engagementScore = 10;
    else engagementScore = engagementRate * 200; // Scale low values

    // Signal 3: Consistency Score (0-20 points)
    let consistencyScore = 0;
    if (uploads >= 20) consistencyScore = 20;
    else if (uploads >= 12) consistencyScore = 18;
    else if (uploads >= 8) consistencyScore = 15;
    else if (uploads >= 4) consistencyScore = 12;
    else if (uploads >= 2) consistencyScore = 8;
    else consistencyScore = uploads * 4;

    // Signal 4: Educational Depth Score (0-15 points)
    // Based on niche - educational niches score higher
    const educationalNiches = [
      "Technology & Programming",
      "Business & Finance",
      "Marketing & Sales",
      "Design & Creative",
      "Education & Teaching"
    ];
    let educationalScore = educationalNiches.includes(niche) ? 15 : 10;

    // Signal 5: Demand Score (0-15 points)
    // Based on views-to-subscribers ratio (indicates demand)
    const viewsToSubsRatio = subs > 0 ? views / subs : 0;
    let demandScore = 0;
    if (viewsToSubsRatio >= 0.3) demandScore = 15; // 30%+ view rate
    else if (viewsToSubsRatio >= 0.2) demandScore = 13;
    else if (viewsToSubsRatio >= 0.1) demandScore = 10;
    else if (viewsToSubsRatio >= 0.05) demandScore = 7;
    else demandScore = viewsToSubsRatio * 150;

    // Calculate total score
    const totalScore = Math.min(
      audienceSizeScore + engagementScore + consistencyScore + educationalScore + demandScore,
      100
    );

    // Determine readiness level
    let readinessLevel = "";
    let insights: string[] = [];
    let monetizationPotential = "";
    let recommendedPricing = { min: 0, max: 0 };

    if (totalScore >= 80) {
      readinessLevel = "🚀 Highly Ready";
      monetizationPotential = "You're in the top tier! Creators at your level successfully sell ₹5,000–₹15,000 courses and cohorts.";
      recommendedPricing = { min: 5000, max: 15000 };
      insights = [
        "Your audience size and engagement indicate strong monetization potential",
        "Consider launching a premium cohort-based course with 1-on-1 support",
        "You can command higher prices due to your authority and reach",
        "Start with a waitlist to gauge exact demand and create urgency"
      ];
    } else if (totalScore >= 65) {
      readinessLevel = "✅ Ready to Launch";
      monetizationPotential = "You're ready! Creators at your level successfully sell ₹2,000–₹5,000 courses.";
      recommendedPricing = { min: 2000, max: 5000 };
      insights = [
        "You have a solid foundation for course monetization",
        "Start with a focused mini-course to test the waters",
        "Your engagement rate suggests students will be committed",
        "Consider early-bird pricing to incentivize first buyers"
      ];
    } else if (totalScore >= 50) {
      readinessLevel = "⚡ Getting There";
      monetizationPotential = "You're close! Focus on building trust. Target ₹999–₹2,499 for your first course.";
      recommendedPricing = { min: 999, max: 2499 };
      insights = [
        "Grow your audience to 5,000+ subscribers for better conversion",
        "Increase engagement by responding to every comment",
        "Create more consistent content to build anticipation",
        "Start with a low-priced course to gather testimonials"
      ];
    } else if (totalScore >= 35) {
      readinessLevel = "🌱 Build First";
      monetizationPotential = "Build your audience more before launching. Focus on free content and community building.";
      recommendedPricing = { min: 499, max: 999 };
      insights = [
        "Focus on growing to 1,000+ subscribers first",
        "Increase upload frequency to stay top-of-mind",
        "Engage deeply with your existing audience",
        "Consider a free mini-course to build your email list"
      ];
    } else {
      readinessLevel = "📚 Early Stage";
      monetizationPotential = "Focus entirely on content creation and audience building. Monetization should wait.";
      recommendedPricing = { min: 0, max: 499 };
      insights = [
        "Prioritize audience growth over monetization right now",
        "Find your niche and create consistent, valuable content",
        "Study successful creators in your space",
        "Build an email list from day one for future launches"
      ];
    }

    return {
      totalScore: Math.round(totalScore),
      breakdown: {
        audienceSize: Math.round(audienceSizeScore),
        engagement: Math.round(engagementScore),
        consistency: Math.round(consistencyScore),
        educationalDepth: Math.round(educationalScore),
        demand: Math.round(demandScore)
      },
      engagementRate: engagementRate * 10, // Display as rate * 10 (e.g., 0.785% * 10 = 7.85/100)
      readinessLevel,
      insights,
      monetizationPotential,
      recommendedPricing
    };
  };

  const handleAnalyze = async () => {
    if (useChannelUrl && !channelUrl) {
      alert("Please enter a YouTube channel URL");
      return;
    }
    
    if (!useChannelUrl && (!subscribers || !avgViews || !niche)) {
      alert("Please fill in all required fields");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      if (useChannelUrl) {
        // Fetch data from YouTube via API
        console.log('🔍 Fetching YouTube channel data for:', channelUrl);
        
        const response = await fetch('/api/youtube/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ channelUrl }),
        });

        const result = await response.json();
        console.log('📊 API Response:', result);

        if (!response.ok || !result.success) {
          console.error('❌ API Error:', result.error);
          throw new Error(result.error || 'Failed to fetch channel data');
        }

        console.log('✅ Channel Data Retrieved:', {
          channelName: result.data.channelName,
          subscribers: result.data.subscribers,
          avgViews: result.data.avgViews,
          avgComments: result.data.avgComments,
          uploadsPerMonth: result.data.uploadsPerMonth,
          engagementRate: result.data.engagementRate,
          totalPosts: result.data.totalPosts
        });

        // Auto-fill the form with fetched data
        setSubscribers(result.data.subscribers.toString());
        setAvgViews(result.data.avgViews.toString());
        setAvgComments(result.data.avgComments.toString());
        setUploadsPerMonth(result.data.uploadsPerMonth.toString());
        setChannelName(result.data.channelName || '');
        setChannelImage(result.data.channelImage || '');
        setFetchedEngagementRate(result.data.engagementRate || 0);
        
        console.log('📝 Form auto-filled with fetched data');
        
        // Auto-detect niche based on channel name/data (simplified logic)
        if (!niche) {
          setNiche("Technology & Programming"); // Default for now
        }

        // Calculate score with fetched data immediately
        console.log('🧮 Calculating monetization score with fetched data...');
        const monetizationResult = calculateMonetizationScore({
          subscribers: result.data.subscribers,
          avgViews: result.data.avgViews,
          avgComments: result.data.avgComments,
          uploadsPerMonth: result.data.uploadsPerMonth,
          engagementRate: result.data.engagementRate || 0
        });
        console.log('💯 Monetization Result:', monetizationResult);
        setResult(monetizationResult);
      } else {
        // Calculate score with manual input data
        console.log('🧮 Calculating monetization score with manual input...');
        const monetizationResult = calculateMonetizationScore();
        console.log('💯 Monetization Result:', monetizationResult);
        setResult(monetizationResult);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze channel. Please try manual input or check the URL.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    // Reset all form fields
    setChannelUrl("");
    setSubscribers("");
    setAvgViews("");
    setAvgComments("");
    setUploadsPerMonth("");
    setNiche("");
    setChannelName("");
    setChannelImage("");
    setFetchedEngagementRate(null);
    setResult(null);
  };

  // JSON-LD Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "YouTube Course Monetization Readiness Calculator",
    "description": "Free tool to analyze your YouTube channel's readiness for course monetization and discover your earning potential",
    "url": "https://coursesphere.com/tools/youtube-monetization",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Channel analytics",
      "Engagement scoring",
      "Monetization readiness assessment",
      "Course pricing recommendations",
      "Audience insights"
    ],
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript"
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <Link 
              href="/tools" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tools
            </Link>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <Youtube className="h-10 w-10 text-red-500" />
                <Badge variant="secondary" className="text-sm">Free Calculator</Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                YouTube Course Monetization Readiness
              </h1>
              <p className="text-lg text-muted-foreground">
                Discover if you&apos;re ready to monetize with courses or cohorts. Get data-driven insights 
                on your audience strength, engagement, and earning potential.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="py-16" aria-label="Monetization Calculator">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Input Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Analyze Your Channel</CardTitle>
                    <CardDescription>
                      Choose how you want to analyze your monetization readiness
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Input Method Toggle */}
                    <div className="flex gap-2 p-1 bg-muted rounded-lg">
                      <button
                        onClick={() => setUseChannelUrl(true)}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          useChannelUrl
                            ? "bg-background shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Channel URL
                      </button>
                      <button
                        onClick={() => setUseChannelUrl(false)}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          !useChannelUrl
                            ? "bg-background shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Manual Input
                      </button>
                    </div>

                    {useChannelUrl ? (
                      <div className="space-y-2">
                        <Label htmlFor="channelUrl">YouTube Channel URL</Label>
                        <Input
                          id="channelUrl"
                          type="url"
                          placeholder="https://youtube.com/@yourchannel"
                          value={channelUrl}
                          onChange={(e) => setChannelUrl(e.target.value)}
                        />
                        <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
                          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            We'll analyze your channel data including subscribers, views, engagement, and upload consistency.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="subscribers" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Subscribers *
                          </Label>
                          <Input
                            id="subscribers"
                            type="number"
                            placeholder="e.g., 5000"
                            value={subscribers}
                            onChange={(e) => setSubscribers(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="avgViews" className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Average Views per Video *
                          </Label>
                          <Input
                            id="avgViews"
                            type="number"
                            placeholder="e.g., 1500"
                            value={avgViews}
                            onChange={(e) => setAvgViews(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="avgComments" className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            Average Comments per Video
                          </Label>
                          <Input
                            id="avgComments"
                            type="number"
                            placeholder="e.g., 25"
                            value={avgComments}
                            onChange={(e) => setAvgComments(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="uploadsPerMonth" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Uploads per Month
                          </Label>
                          <Input
                            id="uploadsPerMonth"
                            type="number"
                            placeholder="e.g., 8"
                            value={uploadsPerMonth}
                            onChange={(e) => setUploadsPerMonth(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="niche" className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Channel Niche *
                          </Label>
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
                      </>
                    )}

                    {result ? (
                      <Button 
                        onClick={handleReset} 
                        className="w-full" 
                        size="lg"
                        variant="secondary"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Clear & Analyze Another
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleAnalyze} 
                        className="w-full" 
                        size="lg"
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <>
                            <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Analyze Monetization Readiness
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Results Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {result ? (
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Your Monetization Readiness</CardTitle>
                          <CardDescription>
                            Based on comprehensive analysis of your channel metrics
                          </CardDescription>
                        </div>
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Clear
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Channel Info */}
                      {channelName && (
                        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                          {channelImage && (
                            <img 
                              src={channelImage} 
                              alt={channelName}
                              className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{channelName}</h3>
                            <p className="text-sm text-muted-foreground">{subscribers} subscribers</p>
                          </div>
                        </div>
                      )}

                      {/* Main Score */}
                      <div className="text-center p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-lg border-2 border-red-500/20">
                        <p className="text-sm text-muted-foreground mb-2">Monetization Readiness Score</p>
                        <p className="text-6xl font-bold text-red-600 dark:text-red-400 mb-2">
                          {result.totalScore} / 100
                        </p>
                        <p className="text-lg font-semibold mb-1">{result.readinessLevel}</p>
                        <Progress value={result.totalScore} className="h-3 mt-3" />
                      </div>

                      {/* Channel Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Avg Views</p>
                          <p className="text-lg font-bold">{avgViews || 0}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Uploads/Month</p>
                          <p className="text-lg font-bold">{uploadsPerMonth || 0}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Avg Comments</p>
                          <p className="text-lg font-bold">{avgComments || 0}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Engagement Score</p>
                          <p className="text-lg font-bold text-primary">
                            {result.engagementRate.toFixed(1)}/100
                          </p>
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Signal Breakdown:</h4>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>Audience Size</span>
                            </div>
                            <span className="font-semibold">{result.breakdown.audienceSize}/25</span>
                          </div>
                          <Progress value={(result.breakdown.audienceSize / 25) * 100} className="h-2" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <MessageCircle className="h-4 w-4 text-muted-foreground" />
                              <span>Engagement</span>
                            </div>
                            <span className="font-semibold">{result.breakdown.engagement}/25</span>
                          </div>
                          <Progress value={(result.breakdown.engagement / 25) * 100} className="h-2" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Consistency</span>
                            </div>
                            <span className="font-semibold">{result.breakdown.consistency}/20</span>
                          </div>
                          <Progress value={(result.breakdown.consistency / 20) * 100} className="h-2" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span>Educational Depth</span>
                            </div>
                            <span className="font-semibold">{result.breakdown.educationalDepth}/15</span>
                          </div>
                          <Progress value={(result.breakdown.educationalDepth / 15) * 100} className="h-2" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span>Demand Signals</span>
                            </div>
                            <span className="font-semibold">{result.breakdown.demand}/15</span>
                          </div>
                          <Progress value={(result.breakdown.demand / 15) * 100} className="h-2" />
                        </div>
                      </div>

                      {/* Monetization Potential */}
                      <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Monetization Potential
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {result.monetizationPotential}
                        </p>
                        {result.recommendedPricing.min > 0 && (
                          <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                            <span className="text-xs font-medium">Recommended Price Range:</span>
                            <span className="text-sm font-bold text-green-600">
                              ₹{result.recommendedPricing.min.toLocaleString()} - ₹{result.recommendedPricing.max.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Insights */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Action Plan:</h4>
                        <ul className="space-y-2">
                          {result.insights.map((insight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Clear Button at Bottom */}
                      <div className="pt-4 border-t">
                        <Button
                          onClick={handleReset}
                          variant="secondary"
                          size="lg"
                          className="w-full gap-2"
                        >
                          <RotateCcw className="h-5 w-5" />
                          Analyze Another Channel
                        </Button>
                      </div>                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center py-12">
                      <Youtube className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Ready to Analyze?</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Enter your channel URL or manual stats on the left to discover your course 
                        monetization readiness and earning potential.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 bg-muted/30" aria-label="How It Works">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">
                How We Calculate Your Score
              </h2>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <Users className="h-8 w-8 text-red-500 mb-2" />
                    <CardTitle className="text-lg">Audience Size (25%)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Your subscriber count indicates potential reach. Larger audiences convert better 
                    for course sales. Aim for 5,000+ for optimal results.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <MessageCircle className="h-8 w-8 text-red-500 mb-2" />
                    <CardTitle className="text-lg">Engagement (25%)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Comments-to-views ratio shows audience connection. Higher engagement means 
                    more committed students who will complete your course.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Calendar className="h-8 w-8 text-red-500 mb-2" />
                    <CardTitle className="text-lg">Consistency (20%)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Regular uploads build trust and anticipation. Consistent creators have higher 
                    conversion rates when launching courses.
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <Target className="h-8 w-8 text-red-500 mb-2" />
                    <CardTitle className="text-lg">Educational Depth (15%)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Educational and skill-based niches have higher course demand. Audiences come 
                    to learn, making them perfect for paid courses.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <TrendingUp className="h-8 w-8 text-red-500 mb-2" />
                    <CardTitle className="text-lg">Demand Signals (15%)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Views-to-subscribers ratio indicates content demand. Higher ratios show your 
                    audience actively seeks your knowledge.
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
