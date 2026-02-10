"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';
import { RefreshCw, ArrowLeft, AlertCircle, Clock, CheckCircle2, Shield, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import Loader from '@/components/loader';
import Link from 'next/link';

interface MigrationStep {
  step: number;
  title: string;
  description: string;
  estimatedTime: string;
}

interface RiskFactor {
  factor: string;
  level: 'Low' | 'Medium' | 'High';
  mitigation: string;
}

interface EstimateResult {
  totalTimeHours: number;
  totalTimeDisplay: string;
  complexity: 'Simple' | 'Moderate' | 'Complex';
  riskLevel: 'Low' | 'Medium' | 'High';
  migrationSteps: MigrationStep[];
  riskFactors: RiskFactor[];
  reassurance: string;
  benefits: string[];
  readyToMigrate: boolean;
}

const PLATFORMS = [
  { value: 'teachable', label: 'Teachable' },
  { value: 'thinkific', label: 'Thinkific' },
  { value: 'kajabi', label: 'Kajabi' },
  { value: 'podia', label: 'Podia' },
  { value: 'gumroad', label: 'Gumroad' },
  { value: 'udemy', label: 'Udemy' },
  { value: 'skillshare', label: 'Skillshare' },
  { value: 'wordpress', label: 'WordPress + LMS Plugin' },
  { value: 'custom', label: 'Custom/Self-hosted' },
  { value: 'none', label: 'Starting from scratch' },
];

export default function MigrationEstimatorPage() {
  const [currentPlatform, setCurrentPlatform] = useState<string>('');
  const [courseCount, setCourseCount] = useState<string>('');
  const [studentCount, setStudentCount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/tools/migration-estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPlatform,
          courseCount: parseInt(courseCount),
          studentCount: parseInt(studentCount)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to estimate migration effort');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300';
      case 'Moderate': return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300';
      case 'Complex': return 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300';
      case 'High': return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getRiskLevelColor = (level: 'Low' | 'Medium' | 'High') => {
    switch (level) {
      case 'Low': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'High': return 'text-red-600';
    }
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
              <RefreshCw className="h-4 w-4" />
              Migration Effort Estimator
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Migration Will Not Be Painful
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See exactly how long it takes to migrate your courses. Most creators complete the move in under a day.
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
                <CardTitle>Tell Us About Your Current Setup</CardTitle>
                <CardDescription>
                  We will estimate exactly how long migration will take
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPlatform">Current Platform</Label>
                    <Select value={currentPlatform} onValueChange={setCurrentPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="Where are your courses now?" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(platform => (
                          <SelectItem key={platform.value} value={platform.value}>
                            {platform.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="courseCount">Number of Courses</Label>
                      <Input
                        id="courseCount"
                        type="number"
                        placeholder="e.g., 3"
                        value={courseCount}
                        onChange={(e) => setCourseCount(e.target.value)}
                        required
                        min="1"
                        max="100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentCount">Number of Students</Label>
                      <Input
                        id="studentCount"
                        type="number"
                        placeholder="e.g., 500"
                        value={studentCount}
                        onChange={(e) => setStudentCount(e.target.value)}
                        required
                        min="0"
                        max="1000000"
                      />
                    </div>
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
                    disabled={loading || !currentPlatform || !courseCount || !studentCount}
                  >
                    {loading ? 'Calculating Migration Time...' : 'Estimate Migration Effort'}
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
              {/* Time Estimate */}
              <Card className="border-2 border-blue-200 dark:border-blue-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Estimated Migration Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-4xl font-bold text-blue-600">
                        {result.totalTimeDisplay}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Total time to complete migration
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getComplexityColor(result.complexity)}>
                        {result.complexity}
                      </Badge>
                      <Badge className={getRiskColor(result.riskLevel)}>
                        {result.riskLevel} Risk
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {result.reassurance}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Migration Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Step-by-Step Migration Plan</CardTitle>
                  <CardDescription>
                    Follow these steps to migrate smoothly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.migrationSteps.map((step, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold">{step.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {step.estimatedTime}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    Risk Assessment & Mitigation
                  </CardTitle>
                  <CardDescription>
                    What to watch out for and how to handle it
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.riskFactors.map((risk, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{risk.factor}</h3>
                        <Badge className={getRiskColor(risk.level)}>
                          {risk.level} Risk
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Mitigation: </strong>
                        {risk.mitigation}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Why This Migration Is Worth It
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* CTA */}
              {result.readyToMigrate && (
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-900">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <Zap className="h-12 w-12 text-blue-600 mx-auto" />
                      <h3 className="text-2xl font-bold">Ready to Migrate?</h3>
                      <p className="text-muted-foreground max-w-2xl mx-auto">
                        Our migration team will handle the technical heavy lifting. You focus on your students.
                      </p>
                      <div className="pt-4">
                        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                          Migrate in a Few Clicks
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Free migration support included with all plans
                      </p>
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
