"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';
import { Layers, ArrowLeft, AlertCircle, DollarSign, Clock, Zap, ArrowRight, TrendingDown, CheckCircle2 } from 'lucide-react';
import Loader from '@/components/loader';
import Link from 'next/link';

interface ToolCost {
  name: string;
  monthlyCost: number;
  category: string;
}

interface ConsolidationOption {
  name: string;
  replacesTools: string[];
  monthlyCost: number;
  savings: number;
  timeSaved: string;
}

interface AnalysisResult {
  currentSpend: number;
  timeSpentSwitching: number;
  timeCostPerMonth: number;
  totalCost: number;
  complexityScore: number;
  toolsByCategory: Record<string, ToolCost[]>;
  narrative: string;
  consolidationOptions: ConsolidationOption[];
  potentialSavings: number;
}

const AVAILABLE_TOOLS = [
  { value: 'teachable', label: 'Teachable', category: 'Course Hosting', cost: 59 },
  { value: 'kajabi', label: 'Kajabi', category: 'Course Hosting', cost: 149 },
  { value: 'thinkific', label: 'Thinkific', category: 'Course Hosting', cost: 49 },
  { value: 'podia', label: 'Podia', category: 'Course Hosting', cost: 39 },
  { value: 'mailchimp', label: 'Mailchimp', category: 'Email Marketing', cost: 35 },
  { value: 'convertkit', label: 'ConvertKit', category: 'Email Marketing', cost: 29 },
  { value: 'activecampaign', label: 'ActiveCampaign', category: 'Email Marketing', cost: 49 },
  { value: 'zoom', label: 'Zoom Pro', category: 'Video/Live', cost: 15 },
  { value: 'streamyard', label: 'StreamYard', category: 'Video/Live', cost: 25 },
  { value: 'riverside', label: 'Riverside.fm', category: 'Video/Live', cost: 24 },
  { value: 'circle', label: 'Circle', category: 'Community', cost: 49 },
  { value: 'discord', label: 'Discord Premium', category: 'Community', cost: 10 },
  { value: 'slack', label: 'Slack Pro', category: 'Community', cost: 8 },
  { value: 'canva', label: 'Canva Pro', category: 'Design', cost: 13 },
  { value: 'adobe', label: 'Adobe Creative Cloud', category: 'Design', cost: 55 },
  { value: 'calendly', label: 'Calendly', category: 'Scheduling', cost: 12 },
  { value: 'acuity', label: 'Acuity Scheduling', category: 'Scheduling', cost: 16 },
  { value: 'stripe', label: 'Stripe', category: 'Payment Processing', cost: 0 },
  { value: 'gumroad', label: 'Gumroad', category: 'Payment Processing', cost: 0 },
  { value: 'notion', label: 'Notion', category: 'Productivity', cost: 10 },
  { value: 'airtable', label: 'Airtable', category: 'Productivity', cost: 20 },
  { value: 'zapier', label: 'Zapier', category: 'Automation', cost: 30 },
  { value: 'buffer', label: 'Buffer', category: 'Social Media', cost: 15 },
  { value: 'hootsuite', label: 'Hootsuite', category: 'Social Media', cost: 49 },
];

export default function ToolStackAnalyzerPage() {
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [hoursPerWeek, setHoursPerWeek] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleToolToggle = (toolValue: string) => {
    setSelectedTools(prev =>
      prev.includes(toolValue)
        ? prev.filter(t => t !== toolValue)
        : [...prev, toolValue]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/tools/tool-stack-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tools: selectedTools,
          hoursPerWeek: parseFloat(hoursPerWeek)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze tool stack');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getComplexityColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getComplexityBg = (score: number) => {
    if (score >= 80) return 'bg-red-100 dark:bg-red-950';
    if (score >= 60) return 'bg-orange-100 dark:bg-orange-950';
    if (score >= 40) return 'bg-yellow-100 dark:bg-yellow-950';
    return 'bg-green-100 dark:bg-green-950';
  };

  const groupedTools = AVAILABLE_TOOLS.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_TOOLS>);

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
              <Layers className="h-4 w-4" />
              Tool Stack Cost Analyzer
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Stop Paying Twice for Your Tools
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              You are paying in money AND mental load. See how much your tool sprawl is really costing you.
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
                <CardTitle>What Tools Are You Using?</CardTitle>
                <CardDescription>
                  Select all the tools in your current stack
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Tools Selection */}
                  <div className="space-y-4">
                    {Object.entries(groupedTools).map(([category, tools]) => (
                      <div key={category} className="space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {tools.map((tool) => (
                            <div
                              key={tool.value}
                              className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                id={tool.value}
                                checked={selectedTools.includes(tool.value)}
                                onCheckedChange={() => handleToolToggle(tool.value)}
                              />
                              <Label
                                htmlFor={tool.value}
                                className="flex-1 cursor-pointer flex items-center justify-between"
                              >
                                <span>{tool.label}</span>
                                <span className="text-sm text-muted-foreground">
                                  {tool.cost > 0 ? `$${tool.cost}/mo` : 'Free'}
                                </span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Time Input */}
                  <div className="space-y-2">
                    <Label htmlFor="hoursPerWeek">
                      Hours Per Week Switching Between Tools
                    </Label>
                    <Input
                      id="hoursPerWeek"
                      type="number"
                      step="0.5"
                      placeholder="e.g., 3"
                      value={hoursPerWeek}
                      onChange={(e) => setHoursPerWeek(e.target.value)}
                      required
                      min="0"
                      max="40"
                    />
                    <p className="text-sm text-muted-foreground">
                      Time spent logging in, switching contexts, syncing data, etc.
                    </p>
                  </div>

                  {selectedTools.length > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">
                        Selected {selectedTools.length} tool{selectedTools.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || selectedTools.length === 0 || !hoursPerWeek}
                  >
                    {loading ? 'Analyzing Your Stack...' : 'Analyze My Tool Stack'}
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
              {/* Cost Summary */}
              <Card className="border-2 border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle>The True Cost of Your Stack</CardTitle>
                  <CardDescription>
                    You are paying in two currencies: money and mental energy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-muted-foreground">Monthly Spend</span>
                      </div>
                      <div className="text-3xl font-bold text-red-600">
                        ${result.currentSpend}
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-muted-foreground">Time Cost</span>
                      </div>
                      <div className="text-3xl font-bold text-orange-600">
                        ${result.timeCostPerMonth}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.timeSpentSwitching}h/week at $50/hour
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-muted-foreground">Total Cost</span>
                      </div>
                      <div className="text-3xl font-bold text-purple-600">
                        ${result.totalCost}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Per month (money + time)
                      </p>
                    </div>
                  </div>

                  {/* Complexity Score */}
                  <div className={`mt-6 p-4 rounded-lg ${getComplexityBg(result.complexityScore)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Complexity Score</span>
                      <span className={`text-2xl font-bold ${getComplexityColor(result.complexityScore)}`}>
                        {result.complexityScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          result.complexityScore >= 80 ? 'bg-red-600' :
                          result.complexityScore >= 60 ? 'bg-orange-600' :
                          result.complexityScore >= 40 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${result.complexityScore}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {result.complexityScore >= 80 && 'Critical: Your tool stack is overwhelming'}
                      {result.complexityScore >= 60 && result.complexityScore < 80 && 'High: Too many tools to manage efficiently'}
                      {result.complexityScore >= 40 && result.complexityScore < 60 && 'Moderate: Some consolidation would help'}
                      {result.complexityScore < 40 && 'Low: Your stack is manageable'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* AI Narrative */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    The Hidden Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {result.narrative}
                  </p>
                </CardContent>
              </Card>

              {/* Tools by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Current Stack</CardTitle>
                  <CardDescription>
                    Breakdown by category
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(result.toolsByCategory).map(([category, tools]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="font-semibold text-sm">{category}</h3>
                      <div className="space-y-1">
                        {tools.map((tool, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span className="text-sm">{tool.name}</span>
                            <span className="text-sm font-semibold">${tool.monthlyCost}/mo</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Consolidation Options */}
              {result.consolidationOptions.length > 0 && (
                <Card className="border-2 border-green-200 dark:border-green-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-green-600" />
                      Consolidation Recommendations
                    </CardTitle>
                    <CardDescription>
                      Replace multiple tools with unified platforms
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {result.consolidationOptions.map((option, index) => (
                      <div key={index} className="p-4 border-2 border-green-200 dark:border-green-900 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg">{option.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Replaces {option.replacesTools.length} tools
                            </p>
                          </div>
                          <Badge className="bg-green-600 text-white">
                            Save ${option.savings}/mo
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <p className="text-sm font-medium">Replaces:</p>
                          <div className="flex flex-wrap gap-2">
                            {option.replacesTools.map((tool, idx) => (
                              <Badge key={idx} variant="outline">{tool}</Badge>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">New Cost</p>
                            <p className="text-lg font-bold">${option.monthlyCost}/mo</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Time Saved</p>
                            <p className="text-lg font-bold">{option.timeSaved}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold">Potential Savings</span>
                      </div>
                      <div className="text-3xl font-bold text-green-600">
                        ${result.potentialSavings}/month
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        ${result.potentialSavings * 12}/year if you consolidate
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CTA */}
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-900">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Layers className="h-12 w-12 text-blue-600 mx-auto" />
                    <h3 className="text-2xl font-bold">Replace 5 Tools with One</h3>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                      CourseSphere combines course hosting, live sessions, community, payments, and email - all in one platform built for creators.
                    </p>
                    <div className="pt-4">
                      <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                        Simplify Your Stack with CourseSphere
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
