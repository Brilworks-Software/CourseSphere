"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';
import { Layers, ArrowLeft, AlertCircle, CheckCircle2, XCircle, MinusCircle, ArrowRight, Sparkles } from 'lucide-react';
import Loader from '@/components/loader';
import Link from 'next/link';

interface PlatformScore {
  platform: string;
  score: number;
  pros: string[];
  cons: string[];
  bestFor: string;
}

interface TradeOff {
  category: string;
  gumroad: string;
  teachable: string;
  coursesphere: string;
}

interface FitResult {
  recommendedPlatform: string;
  explanation: string;
  platformScores: PlatformScore[];
  tradeOffs: TradeOff[];
  nextSteps: string[];
  whyCourseSphere?: string;
}

export default function PlatformFitFinderPage() {
  const [teachingStyle, setTeachingStyle] = useState<string>('');
  const [audienceSize, setAudienceSize] = useState<string>('');
  const [monetizationGoal, setMonetizationGoal] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FitResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/tools/platform-fit-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teachingStyle, audienceSize, monetizationGoal }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find platform fit');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'coursesphere':
        return 'bg-gradient-to-r from-blue-600 to-purple-600 text-white';
      case 'teachable':
        return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300';
      case 'gumroad':
        return 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <MinusCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1 py-12 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 max-w-5xl">
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
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Layers className="h-4 w-4" />
              Course Platform Fit Finder
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Find Your Perfect Platform
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Most platforms are not built for creators like you. Discover which one actually fits your teaching style and goals.
            </p>
          </motion.div>

          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Tell Us About Your Teaching</CardTitle>
                <CardDescription>
                  We will match you with the best platform for your needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="teachingStyle">Teaching Style</Label>
                    <Select value={teachingStyle} onValueChange={setTeachingStyle}>
                      <SelectTrigger>
                        <SelectValue placeholder="How do you prefer to teach?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video-heavy">Video-Heavy (Pre-recorded courses)</SelectItem>
                        <SelectItem value="live-cohort">Live Cohort-Based (Interactive sessions)</SelectItem>
                        <SelectItem value="self-paced">Self-Paced (Downloadables + videos)</SelectItem>
                        <SelectItem value="hybrid">Hybrid (Mix of live and recorded)</SelectItem>
                        <SelectItem value="community-focused">Community-Focused (Discussion + content)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audienceSize">Current Audience Size</Label>
                    <Select value={audienceSize} onValueChange={setAudienceSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="How many followers do you have?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-1k">Under 1,000 (Just starting)</SelectItem>
                        <SelectItem value="1k-10k">1,000 - 10,000 (Growing)</SelectItem>
                        <SelectItem value="10k-50k">10,000 - 50,000 (Established)</SelectItem>
                        <SelectItem value="50k-100k">50,000 - 100,000 (Large)</SelectItem>
                        <SelectItem value="over-100k">Over 100,000 (Very large)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monetizationGoal">Primary Monetization Goal</Label>
                    <Select value={monetizationGoal} onValueChange={setMonetizationGoal}>
                      <SelectTrigger>
                        <SelectValue placeholder="What matters most to you?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quick-setup">Quick Setup (Start selling ASAP)</SelectItem>
                        <SelectItem value="high-ticket">High-Ticket Sales ($500+ courses)</SelectItem>
                        <SelectItem value="recurring-revenue">Recurring Revenue (Memberships)</SelectItem>
                        <SelectItem value="scale">Scale (Reach thousands of students)</SelectItem>
                        <SelectItem value="control">Full Control (Own my platform)</SelectItem>
                        <SelectItem value="simplicity">Simplicity (Easy to manage)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || !teachingStyle || !audienceSize || !monetizationGoal}
                  >
                    {loading ? 'Finding Your Perfect Fit...' : 'Find My Platform'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8"
            >
              <Loader />
            </motion.div>
          )}

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-6"
            >
              {/* Recommendation */}
              <Card className="border-2 border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Recommended Platform
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Based on your teaching style and goals
                      </CardDescription>
                    </div>
                    <Badge className={getPlatformColor(result.recommendedPlatform)} variant="secondary">
                      {result.recommendedPlatform}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {result.explanation}
                  </p>
                </CardContent>
              </Card>

              {/* Platform Scores */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Comparison</CardTitle>
                  <CardDescription>
                    How well each platform fits your needs (0-100 score)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {result.platformScores.map((platform, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{platform.platform}</h3>
                          {getScoreIcon(platform.score)}
                        </div>
                        <div className="text-2xl font-bold">{platform.score}%</div>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            platform.score >= 80 ? 'bg-green-600' :
                            platform.score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${platform.score}%` }}
                        />
                      </div>

                      <p className="text-sm text-muted-foreground italic">{platform.bestFor}</p>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">Pros:</p>
                          <ul className="space-y-1">
                            {platform.pros.map((pro, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-red-600 dark:text-red-400">Cons:</p>
                          <ul className="space-y-1">
                            {platform.cons.map((con, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <XCircle className="h-3 w-3 mt-0.5 text-red-600 flex-shrink-0" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {index < result.platformScores.length - 1 && (
                        <div className="border-b border-gray-200 dark:border-gray-800 mt-4" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Trade-Offs */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Trade-Offs</CardTitle>
                  <CardDescription>
                    What you gain and lose with each platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-semibold">Feature</th>
                          <th className="text-left py-3 px-2 font-semibold">Gumroad</th>
                          <th className="text-left py-3 px-2 font-semibold">Teachable</th>
                          <th className="text-left py-3 px-2 font-semibold">CourseSphere</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.tradeOffs.map((tradeoff, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="py-3 px-2 font-medium">{tradeoff.category}</td>
                            <td className="py-3 px-2 text-muted-foreground">{tradeoff.gumroad}</td>
                            <td className="py-3 px-2 text-muted-foreground">{tradeoff.teachable}</td>
                            <td className="py-3 px-2 text-muted-foreground">{tradeoff.coursesphere}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                  <CardDescription>
                    How to move forward with your chosen platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {result.nextSteps.map((step, index) => (
                      <li key={index} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-muted-foreground pt-0.5">{step}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* CTA */}
              {result.whyCourseSphere && (
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-900">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <Layers className="h-12 w-12 text-blue-600 mx-auto" />
                      <h3 className="text-2xl font-bold">Start with the Platform Built for YouTube Creators</h3>
                      <p className="text-muted-foreground max-w-2xl mx-auto">
                        {result.whyCourseSphere}
                      </p>
                      <div className="pt-4">
                        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                          Get Started with CourseSphere
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
