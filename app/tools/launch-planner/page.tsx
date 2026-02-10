"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';
import { Rocket, ArrowLeft, Sparkles, AlertCircle, CheckCircle, Calendar, Mail, MessageSquare } from 'lucide-react';
import Loader from '@/components/loader';
import Link from 'next/link';

interface DayPlan {
  day: number;
  title: string;
  focus: string;
  tasks: string[];
  postIdea: string;
  emailSubject?: string;
  emailBody?: string;
}

interface LaunchPlanResult {
  launchTitle: string;
  launchDate: string;
  strategy: string;
  dayPlans: DayPlan[];
  webinarPitch?: {
    hook: string;
    bullets: string[];
    cta: string;
  };
  insights: {
    momentum: string;
    lowPressureTips: string;
    recommendation: string;
  };
}

export default function LaunchPlannerPage() {
  const [format, setFormat] = useState<'self-paced' | 'cohort' | 'workshop'>('cohort');
  const [launchDate, setLaunchDate] = useState('');
  const [audienceSize, setAudienceSize] = useState('');
  const [comfortLevel, setComfortLevel] = useState<'nervous' | 'moderate' | 'confident'>('moderate');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LaunchPlanResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/tools/launch-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          launchDate,
          audienceSize: parseInt(audienceSize),
          comfortLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate launch plan');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return launchDate && audienceSize && parseInt(audienceSize) > 0;
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
            <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Rocket className="h-4 w-4" />
              7-Day Launch Planner
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Launch Your Course Without Overthinking
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get a day-by-day action plan with templates, posts, and emails. Stop planning, start launching.
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
                <CardTitle>Plan Your 7-Day Launch</CardTitle>
                <CardDescription>
                  Answer a few questions and get a complete launch roadmap
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Course Format */}
                    <div className="space-y-2">
                      <Label htmlFor="format">What Are You Launching?</Label>
                      <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cohort">Live Cohort</SelectItem>
                          <SelectItem value="self-paced">Self-Paced Course</SelectItem>
                          <SelectItem value="workshop">Workshop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Launch Date */}
                    <div className="space-y-2">
                      <Label htmlFor="launchDate">Launch Date</Label>
                      <Input
                        id="launchDate"
                        type="date"
                        value={launchDate}
                        onChange={(e) => setLaunchDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Audience Size */}
                    <div className="space-y-2">
                      <Label htmlFor="audienceSize">Audience Size</Label>
                      <Input
                        id="audienceSize"
                        type="number"
                        placeholder="e.g., 5000"
                        value={audienceSize}
                        onChange={(e) => setAudienceSize(e.target.value)}
                        min="1"
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        Your total subscribers/followers
                      </p>
                    </div>

                    {/* Comfort Level */}
                    <div className="space-y-2">
                      <Label htmlFor="comfortLevel">Comfort With Selling</Label>
                      <Select value={comfortLevel} onValueChange={(v: any) => setComfortLevel(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nervous">Nervous (First time)</SelectItem>
                          <SelectItem value="moderate">Moderate (Some experience)</SelectItem>
                          <SelectItem value="confident">Confident (Done this before)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || !isFormValid()}>
                    {loading ? 'Creating Your Launch Plan...' : 'Generate 7-Day Launch Plan'}
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
              {/* Launch Overview */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl">{result.launchTitle}</CardTitle>
                  <CardDescription className="text-base">
                    Launch Date: {new Date(result.launchDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-900">
                    <p className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                      Launch Strategy
                    </p>
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      {result.strategy}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Day-by-Day Plan */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-orange-600" />
                  Your 7-Day Action Plan
                </h2>

                {result.dayPlans.map((day, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 font-bold text-lg flex-shrink-0">
                            D{day.day}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-1">{day.title}</CardTitle>
                            <CardDescription>{day.focus}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Tasks */}
                        <div>
                          <p className="font-semibold text-sm text-muted-foreground mb-2">
                            Tasks to Complete
                          </p>
                          <div className="space-y-2">
                            {day.tasks.map((task, taskIndex) => (
                              <div key={taskIndex} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{task}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Post Idea */}
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                              Post/Video Idea
                            </p>
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {day.postIdea}
                          </p>
                        </div>

                        {/* Email Template */}
                        {day.emailSubject && (
                          <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-900">
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="h-4 w-4 text-purple-600" />
                              <p className="font-semibold text-purple-900 dark:text-purple-100 text-sm">
                                Email Template
                              </p>
                            </div>
                            <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-1">
                              Subject: {day.emailSubject}
                            </p>
                            <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-line">
                              {day.emailBody}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Webinar Pitch */}
              {result.webinarPitch && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      Webinar Pitch Outline
                    </CardTitle>
                    <CardDescription>
                      Use this structure for your live presentation or sales call
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground mb-1">
                        Hook (First 30 seconds)
                      </p>
                      <p className="text-foreground">{result.webinarPitch.hook}</p>
                    </div>

                    <div>
                      <p className="font-semibold text-sm text-muted-foreground mb-2">
                        Key Points to Cover
                      </p>
                      <ul className="space-y-2">
                        {result.webinarPitch.bullets.map((bullet, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-orange-600 font-bold">•</span>
                            <span className="text-sm">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold text-sm text-muted-foreground mb-1">
                        Call to Action
                      </p>
                      <p className="text-foreground font-medium">{result.webinarPitch.cta}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Insights */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Launch Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-2">
                      Building Momentum
                    </p>
                    <p className="text-foreground leading-relaxed">
                      {result.insights.momentum}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-2">
                      Low-Pressure Launch Tips
                    </p>
                    <p className="text-foreground leading-relaxed">
                      {result.insights.lowPressureTips}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-2">
                      Recommendation
                    </p>
                    <p className="text-foreground leading-relaxed">
                      {result.insights.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-2 border-orange-200 dark:border-orange-900">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Rocket className="h-12 w-12 text-orange-600 mx-auto" />
                    <h3 className="text-2xl font-bold">
                      Your Launch Plan is Ready
                    </h3>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                      You have a clear 7-day roadmap. No overthinking, no analysis paralysis. 
                      Just follow the plan and launch with confidence.
                    </p>
                    <div className="pt-4">
                      <Button size="lg" className="bg-gradient-to-r from-orange-600 to-red-600">
                        Start Day 1 Now
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
