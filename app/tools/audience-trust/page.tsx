"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';
import { Heart, TrendingUp, MessageCircle, Users, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import Loader from '@/components/loader';

interface TrustSignal {
  type: string;
  count: number;
  percentage: number;
  examples: string[];
}

interface CommentExample {
  text: string;
  category: 'appreciation' | 'advice-seeking' | 'outcome' | 'repeat';
  trustLevel: 'high' | 'medium' | 'low';
}

interface TrustResult {
  score: number;
  rating: 'excellent' | 'strong' | 'good' | 'developing' | 'early';
  trustSignals: {
    appreciation: TrustSignal;
    adviceSeeking: TrustSignal;
    outcomeMentions: TrustSignal;
    repeatCommenters: TrustSignal;
  };
  commentExamples: CommentExample[];
  insights: {
    summary: string;
    buyingConfidence: string;
    teacherStatus: string;
    recommendation: string;
  };
  metrics: {
    totalComments: number;
    uniqueCommenters: number;
    engagementRate: number;
  };
}

export default function AudienceTrustPage() {
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrustResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/tools/audience-trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze trust');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTrustBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-950';
    if (score >= 60) return 'bg-blue-100 dark:bg-blue-950';
    if (score >= 40) return 'bg-yellow-100 dark:bg-yellow-950';
    if (score >= 20) return 'bg-orange-100 dark:bg-orange-950';
    return 'bg-red-100 dark:bg-red-950';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'appreciation':
        return <Heart className="h-4 w-4" />;
      case 'advice-seeking':
        return <MessageCircle className="h-4 w-4" />;
      case 'outcome':
        return <TrendingUp className="h-4 w-4" />;
      case 'repeat':
        return <Users className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'appreciation':
        return 'text-pink-600 bg-pink-100 dark:bg-pink-950';
      case 'advice-seeking':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-950';
      case 'outcome':
        return 'text-green-600 bg-green-100 dark:bg-green-950';
      case 'repeat':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-950';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-950';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'appreciation':
        return 'Appreciation';
      case 'advice-seeking':
        return 'Advice-Seeking';
      case 'outcome':
        return 'Outcome Mention';
      case 'repeat':
        return 'Repeat Commenter';
      default:
        return category;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1 py-12 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Heart className="h-4 w-4" />
              Audience Trust Index
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Will Your Audience Actually Buy From You?
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover trust signals in your YouTube comments. See proof that your audience already sees you as a teacher worth learning from.
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
                <CardTitle>Analyze Your Audience Trust</CardTitle>
                <CardDescription>
                  Enter your YouTube channel URL to analyze trust signals from your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="channelUrl">YouTube Channel URL</Label>
                    <Input
                      id="channelUrl"
                      type="url"
                      placeholder="https://www.youtube.com/@yourchannel"
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      We&apos;ll analyze your recent comments for trust signals and buying intent
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Analyzing Trust Signals...' : 'Analyze Audience Trust'}
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
              {/* Trust Score */}
              <Card className={getTrustBgColor(result.score)}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Audience Trust Score
                    </p>
                    <div className={`text-6xl font-bold ${getTrustColor(result.score)} mb-2`}>
                      {result.score}
                    </div>
                    <p className="text-lg font-semibold capitalize mb-4">
                      {result.rating} Trust Level
                    </p>
                    <div className="max-w-md mx-auto">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.score}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full ${
                            result.score >= 80 ? 'bg-green-600' :
                            result.score >= 60 ? 'bg-blue-600' :
                            result.score >= 40 ? 'bg-yellow-600' :
                            result.score >= 20 ? 'bg-orange-600' : 'bg-red-600'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
                        <MessageCircle className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{result.metrics.totalComments}</p>
                        <p className="text-sm text-muted-foreground">Total Comments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{result.metrics.uniqueCommenters}</p>
                        <p className="text-sm text-muted-foreground">Unique Commenters</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{result.metrics.engagementRate.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">Engagement Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trust Signals Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Trust Signal Breakdown
                  </CardTitle>
                  <CardDescription>
                    Evidence that your audience trusts and values your teaching
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Appreciation */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-pink-600" />
                        <span className="font-medium">Appreciation & Gratitude</span>
                      </div>
                      <Badge variant="secondary">
                        {result.trustSignals.appreciation.count} comments ({result.trustSignals.appreciation.percentage.toFixed(0)}%)
                      </Badge>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pink-600"
                        style={{ width: `${result.trustSignals.appreciation.percentage}%` }}
                      />
                    </div>
                    {result.trustSignals.appreciation.examples.length > 0 && (
                      <div className="pl-6 space-y-1">
                        {result.trustSignals.appreciation.examples.slice(0, 2).map((example, i) => (
                          <p key={i} className="text-sm text-muted-foreground italic">
                            &ldquo;{example}&rdquo;
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Advice-Seeking */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Advice-Seeking Questions</span>
                      </div>
                      <Badge variant="secondary">
                        {result.trustSignals.adviceSeeking.count} comments ({result.trustSignals.adviceSeeking.percentage.toFixed(0)}%)
                      </Badge>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${result.trustSignals.adviceSeeking.percentage}%` }}
                      />
                    </div>
                    {result.trustSignals.adviceSeeking.examples.length > 0 && (
                      <div className="pl-6 space-y-1">
                        {result.trustSignals.adviceSeeking.examples.slice(0, 2).map((example, i) => (
                          <p key={i} className="text-sm text-muted-foreground italic">
                            &ldquo;{example}&rdquo;
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Outcome Mentions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Outcome & Result Mentions</span>
                      </div>
                      <Badge variant="secondary">
                        {result.trustSignals.outcomeMentions.count} comments ({result.trustSignals.outcomeMentions.percentage.toFixed(0)}%)
                      </Badge>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600"
                        style={{ width: `${result.trustSignals.outcomeMentions.percentage}%` }}
                      />
                    </div>
                    {result.trustSignals.outcomeMentions.examples.length > 0 && (
                      <div className="pl-6 space-y-1">
                        {result.trustSignals.outcomeMentions.examples.slice(0, 2).map((example, i) => (
                          <p key={i} className="text-sm text-muted-foreground italic">
                            &ldquo;{example}&rdquo;
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Repeat Commenters */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Repeat Commenters</span>
                      </div>
                      <Badge variant="secondary">
                        {result.trustSignals.repeatCommenters.count} users ({result.trustSignals.repeatCommenters.percentage.toFixed(0)}%)
                      </Badge>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600"
                        style={{ width: `${result.trustSignals.repeatCommenters.percentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comment Examples */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    Real Trust Signal Examples
                  </CardTitle>
                  <CardDescription>
                    Actual comments from your audience showing trust and learning intent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.commentExamples.map((example, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <div className={`p-2 rounded-lg ${getCategoryColor(example.category)}`}>
                            {getCategoryIcon(example.category)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm italic text-muted-foreground mb-2">
                              &ldquo;{example.text}&rdquo;
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {getCategoryLabel(example.category)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  example.trustLevel === 'high'
                                    ? 'border-green-500 text-green-600'
                                    : example.trustLevel === 'medium'
                                    ? 'border-yellow-500 text-yellow-600'
                                    : 'border-gray-500 text-gray-600'
                                }`}
                              >
                                {example.trustLevel} trust
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    AI-Powered Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-2">
                      Summary
                    </p>
                    <p className="text-foreground leading-relaxed">
                      {result.insights.summary}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-2">
                      Will They Buy From You?
                    </p>
                    <p className="text-foreground leading-relaxed">
                      {result.insights.buyingConfidence}
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                          You&apos;re Already a Teacher
                        </p>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          {result.insights.teacherStatus}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-2">
                      Next Steps
                    </p>
                    <p className="text-foreground leading-relaxed">
                      {result.insights.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Reassurance Message */}
              <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-2 border-pink-200 dark:border-pink-900">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Heart className="h-12 w-12 text-pink-600 mx-auto" />
                    <h3 className="text-2xl font-bold">
                      Your Audience Already Trusts You
                    </h3>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                      These trust signals prove your audience already sees you as a teacher worth learning from. 
                      They&apos;re asking for help, expressing gratitude, and coming back repeatedly. 
                      That&apos;s not just engagement—that&apos;s readiness to invest in learning from you.
                    </p>
                    <div className="pt-4">
                      <Button size="lg" className="bg-gradient-to-r from-pink-600 to-purple-600">
                        Start Creating Your Course
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
