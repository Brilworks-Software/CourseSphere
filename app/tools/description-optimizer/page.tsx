"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';
import { Youtube, ArrowLeft, AlertCircle, Copy, Check, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import Loader from '@/components/loader';
import Link from 'next/link';

interface EvaluationScore {
  ctaClarity: number;
  linkPlacement: number;
  messageRelevance: number;
  overall: number;
}

interface CTAVariation {
  context: string;
  copy: string;
}

interface OptimizerResult {
  videoTitle: string;
  currentDescription: string;
  evaluation: EvaluationScore;
  issues: string[];
  optimizedDescription: string;
  pinnedComment: string;
  ctaVariations: CTAVariation[];
  improvements: string[];
}

export default function DescriptionOptimizerPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [goal, setGoal] = useState<'course' | 'workshop' | 'email-list'>('course');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizerResult | null>(null);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/tools/description-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl, goal }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to optimize description');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-950';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-950';
    if (score >= 40) return 'bg-orange-100 dark:bg-orange-950';
    return 'bg-red-100 dark:bg-red-950';
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
            <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Youtube className="h-4 w-4" />
              YouTube Description Optimizer
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Turn Views Into Traffic
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Most creators waste their YouTube descriptions. Get an AI-optimized funnel that converts viewers into students.
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
                <CardTitle>Optimize Your YouTube Description</CardTitle>
                <CardDescription>
                  Enter your video URL and conversion goal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">YouTube Video URL</Label>
                    <Input
                      id="videoUrl"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Paste any YouTube video URL
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal">Conversion Goal</Label>
                    <Select value={goal} onValueChange={(v: any) => setGoal(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="course">Sell a Course</SelectItem>
                        <SelectItem value="workshop">Promote a Workshop</SelectItem>
                        <SelectItem value="email-list">Grow Email List</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      What do you want viewers to do?
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || !videoUrl}>
                    {loading ? 'Optimizing Your Description...' : 'Optimize Description'}
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
              {/* Video Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Video: {result.videoTitle}</CardTitle>
                </CardHeader>
              </Card>

              {/* Evaluation Scores */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Current Description Evaluation</CardTitle>
                  <CardDescription>
                    How well your description converts viewers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-lg ${getScoreBg(result.evaluation.overall)}`}>
                      <div className={`text-3xl font-bold ${getScoreColor(result.evaluation.overall)}`}>
                        {result.evaluation.overall}%
                      </div>
                      <div className="text-sm font-medium mt-1">Overall</div>
                    </div>
                    <div className={`p-4 rounded-lg ${getScoreBg(result.evaluation.ctaClarity)}`}>
                      <div className={`text-3xl font-bold ${getScoreColor(result.evaluation.ctaClarity)}`}>
                        {result.evaluation.ctaClarity}%
                      </div>
                      <div className="text-sm font-medium mt-1">CTA Clarity</div>
                    </div>
                    <div className={`p-4 rounded-lg ${getScoreBg(result.evaluation.linkPlacement)}`}>
                      <div className={`text-3xl font-bold ${getScoreColor(result.evaluation.linkPlacement)}`}>
                        {result.evaluation.linkPlacement}%
                      </div>
                      <div className="text-sm font-medium mt-1">Link Placement</div>
                    </div>
                    <div className={`p-4 rounded-lg ${getScoreBg(result.evaluation.messageRelevance)}`}>
                      <div className={`text-3xl font-bold ${getScoreColor(result.evaluation.messageRelevance)}`}>
                        {result.evaluation.messageRelevance}%
                      </div>
                      <div className="text-sm font-medium mt-1">Relevance</div>
                    </div>
                  </div>

                  {result.issues.length > 0 && (
                    <div className="mt-6 space-y-2">
                      <p className="font-semibold text-sm">Issues Found:</p>
                      <ul className="space-y-1">
                        {result.issues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-red-500">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Optimized Description */}
              <Card className="border-2 border-green-200 dark:border-green-900">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-green-600" />
                        Optimized Description
                      </CardTitle>
                      <CardDescription>
                        AI-generated description designed to convert
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.optimizedDescription, 'description')}
                    >
                      {copiedField === 'description' ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={result.optimizedDescription}
                    readOnly
                    className="min-h-[300px] font-mono text-sm"
                  />
                  
                  {result.improvements.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="font-semibold text-sm text-green-900 dark:text-green-100 mb-2">
                        What Changed:
                      </p>
                      <ul className="space-y-1">
                        {result.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-green-800 dark:text-green-200">
                            <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pinned Comment */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pinned Comment Copy</CardTitle>
                      <CardDescription>
                        Pin this comment to drive immediate action
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.pinnedComment, 'pinned')}
                    >
                      {copiedField === 'pinned' ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap">
                    {result.pinnedComment}
                  </div>
                </CardContent>
              </Card>

              {/* CTA Variations */}
              <Card>
                <CardHeader>
                  <CardTitle>CTA Variations</CardTitle>
                  <CardDescription>
                    Use these CTAs in different contexts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.ctaVariations.map((variation, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge>{variation.context}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(variation.copy, `cta-${index}`)}
                        >
                          {copiedField === `cta-${index}` ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm">{variation.copy}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-2 border-red-200 dark:border-red-900">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <TrendingUp className="h-12 w-12 text-red-600 mx-auto" />
                    <h3 className="text-2xl font-bold">Ready to Host This Offer?</h3>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                      Stop sending traffic to third-party platforms. Host your course, workshop, or lead magnet directly.
                    </p>
                    <div className="pt-4">
                      <Button size="lg" className="bg-gradient-to-r from-red-600 to-orange-600">
                        Get Started with CourseSphere
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
