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
import { Link2, ArrowLeft, AlertCircle, TrendingDown, CheckCircle, XCircle, Sparkles, ArrowRight } from 'lucide-react';
import Loader from '@/components/loader';
import Link from 'next/link';

interface AuditIssue {
  type: 'critical' | 'warning' | 'info';
  message: string;
  impact: string;
}

interface OptimizedLayout {
  section: string;
  recommendation: string;
  example: string;
}

interface AuditResult {
  url: string;
  monetizationScore: number;
  scoreGrade: string;
  totalLinks: number;
  hasPrimaryCTA: boolean;
  hasEducationOffer: boolean;
  hasLeadCapture: boolean;
  frictionScore: number;
  leakageScore: number;
  issues: AuditIssue[];
  topFixes: string[];
  optimizedLayout: OptimizedLayout[];
  aiInsight: string;
}

export default function BioLinkAuditPage() {
  const [bioUrl, setBioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/tools/bio-link-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bioUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to audit bio link');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-950 border-green-200 dark:border-green-900';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900';
    if (score >= 40) return 'bg-orange-100 dark:bg-orange-950 border-orange-200 dark:border-orange-900';
    return 'bg-red-100 dark:bg-red-950 border-red-200 dark:border-red-900';
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
            <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Link2 className="h-4 w-4" />
              Link-in-Bio Monetization Audit
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Why Do People Click But Not Buy?
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Audit your link-in-bio for monetization leaks. Discover why clicks do not convert into revenue.
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
                <CardTitle>Audit Your Bio Link</CardTitle>
                <CardDescription>
                  Enter your Linktree, Beacons, or link-in-bio URL
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="bioUrl">Link-in-Bio URL</Label>
                    <Input
                      id="bioUrl"
                      type="url"
                      placeholder="https://linktr.ee/yourname or https://beacons.ai/yourname"
                      value={bioUrl}
                      onChange={(e) => setBioUrl(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Works with Linktree, Beacons, Stan Store, or any bio link page
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || !bioUrl}>
                    {loading ? 'Auditing Your Bio Link...' : 'Audit My Link-in-Bio'}
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
              {/* Monetization Score */}
              <Card className={`border-2 ${getScoreBgColor(result.monetizationScore)}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Monetization Score</CardTitle>
                      <CardDescription>
                        How well your bio link converts clicks to revenue
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className={`text-5xl font-bold ${getScoreColor(result.monetizationScore)}`}>
                        {result.monetizationScore}
                      </div>
                      <Badge className="mt-2">{result.scoreGrade}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <div className="text-2xl font-bold">{result.totalLinks}</div>
                      <div className="text-sm text-muted-foreground">Total Links</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <div className="text-2xl font-bold">{result.frictionScore}%</div>
                      <div className="text-sm text-muted-foreground">Friction</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <div className="text-2xl font-bold">{result.leakageScore}%</div>
                      <div className="text-sm text-muted-foreground">Leakage</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <div className="text-2xl">
                        {result.hasPrimaryCTA ? <CheckCircle className="h-8 w-8 text-green-600 mx-auto" /> : <XCircle className="h-8 w-8 text-red-600 mx-auto" />}
                      </div>
                      <div className="text-sm text-muted-foreground">Primary CTA</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Insight */}
              <Card className="border-2 border-purple-200 dark:border-purple-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    AI Insight
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed">{result.aiInsight}</p>
                </CardContent>
              </Card>

              {/* Issues Found */}
              {result.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      Issues Found
                    </CardTitle>
                    <CardDescription>
                      These problems are costing you money
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.issues.map((issue, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${
                          issue.type === 'critical'
                            ? 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20'
                            : issue.type === 'warning'
                            ? 'border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20'
                            : 'border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Badge
                            variant="outline"
                            className={
                              issue.type === 'critical'
                                ? 'border-red-500 text-red-700 dark:text-red-300'
                                : issue.type === 'warning'
                                ? 'border-orange-500 text-orange-700 dark:text-orange-300'
                                : 'border-blue-500 text-blue-700 dark:text-blue-300'
                            }
                          >
                            {issue.type}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-semibold mb-1">{issue.message}</p>
                            <p className="text-sm text-muted-foreground">{issue.impact}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Top 3 Fixes */}
              <Card className="border-2 border-green-200 dark:border-green-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Top 3 Fixes (Do These First)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {result.topFixes.map((fix, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-foreground pt-1">{fix}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* Optimized Layout Example */}
              <Card>
                <CardHeader>
                  <CardTitle>Optimized Layout Example</CardTitle>
                  <CardDescription>
                    How to restructure your bio link for maximum revenue
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.optimizedLayout.map((section, index) => (
                    <div key={index} className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2">{section.section}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{section.recommendation}</p>
                      <div className="text-sm bg-background p-3 rounded border">
                        <span className="text-green-600 font-mono">{section.example}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200 dark:border-purple-900">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-2xl font-bold">Ready to Fix Your Bio Link?</h3>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                      Stop leaking money through a messy link-in-bio. Create a single monetization hub that converts.
                    </p>
                    <div className="pt-4">
                      <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600">
                        Create Your Monetization Hub
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
