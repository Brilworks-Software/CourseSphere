"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';
import { Target, ArrowLeft, Sparkles, AlertCircle, CheckCircle, Calendar, TrendingUp, Award } from 'lucide-react';
import Loader from '@/components/loader';
import Link from 'next/link';

interface Milestone {
  week: number;
  title: string;
  outcome: string;
  skills: string[];
}

interface Lesson {
  title: string;
  duration: string;
  learningObjective: string;
  activities: string[];
}

interface WeekModule {
  week: number;
  title: string;
  description: string;
  milestone: string;
  lessons: Lesson[];
  assessment: string;
}

interface CurriculumResult {
  courseTitle: string;
  finalOutcome: string;
  targetAudience: string;
  totalDuration: string;
  modules: WeekModule[];
  milestones: Milestone[];
  insights: {
    transformationPath: string;
    outcomeValidation: string;
    recommendations: string;
  };
}

export default function CurriculumGeneratorPage() {
  const [audienceLevel, setAudienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [duration, setDuration] = useState('');
  const [durationType, setDurationType] = useState<'weeks' | 'months'>('weeks');
  const [format, setFormat] = useState<'self-paced' | 'cohort'>('self-paced');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CurriculumResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/tools/curriculum-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audienceLevel,
          desiredOutcome,
          duration: parseInt(duration),
          durationType,
          format,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate curriculum');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return desiredOutcome.trim().length > 10 && duration && parseInt(duration) > 0;
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
              <Target className="h-4 w-4" />
              Outcome-Based Curriculum Generator
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Design Your Transformation-First Curriculum
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stop building content-heavy courses. Start with the outcome, reverse-engineer the skills, and create a transformation roadmap.
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
                <CardTitle>Define Your Course Transformation</CardTitle>
                <CardDescription>
                  Start with the end in mind - what transformation will your students achieve?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Desired Outcome */}
                  <div className="space-y-2">
                    <Label htmlFor="outcome">Desired Student Outcome *</Label>
                    <Textarea
                      id="outcome"
                      placeholder="Example: Students will be able to build and deploy a full-stack web application with authentication, database integration, and responsive UI"
                      value={desiredOutcome}
                      onChange={(e) => setDesiredOutcome(e.target.value)}
                      rows={4}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Be specific about what students will be able to DO after completing the course
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Audience Level */}
                    <div className="space-y-2">
                      <Label htmlFor="audienceLevel">Target Audience Level</Label>
                      <Select value={audienceLevel} onValueChange={(v: any) => setAudienceLevel(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Format */}
                    <div className="space-y-2">
                      <Label htmlFor="format">Course Format</Label>
                      <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self-paced">Self-Paced</SelectItem>
                          <SelectItem value="cohort">Live Cohort</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label>Course Duration</Label>
                    <div className="flex gap-4">
                      <Input
                        type="number"
                        placeholder="4"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        min="1"
                        max="52"
                        required
                        className="flex-1"
                      />
                      <Select value={durationType} onValueChange={(v: any) => setDurationType(v)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
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
                    {loading ? 'Generating Curriculum...' : 'Generate Outcome-Based Curriculum'}
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
              {/* Course Overview */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl">{result.courseTitle}</CardTitle>
                  <CardDescription className="text-base">
                    {result.targetAudience}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-900">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                          Final Transformation
                        </p>
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                          {result.finalOutcome}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Duration: {result.totalDuration}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Transformation Milestones
                  </CardTitle>
                  <CardDescription>
                    Key outcomes students will achieve throughout the course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.milestones.map((milestone, index) => (
                      <div
                        key={index}
                        className="flex gap-4 p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 text-green-600 font-bold flex-shrink-0">
                          {milestone.week}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold mb-1">{milestone.title}</p>
                          <p className="text-sm text-muted-foreground mb-2">{milestone.outcome}</p>
                          <div className="flex flex-wrap gap-1">
                            {milestone.skills.map((skill, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Modules */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Award className="h-6 w-6 text-purple-600" />
                  Week-by-Week Curriculum ({result.modules.length} modules)
                </h2>

                {result.modules.map((module, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 font-bold text-lg flex-shrink-0">
                            W{module.week}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-1">{module.title}</CardTitle>
                            <CardDescription>{module.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Milestone */}
                        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-900">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <p className="font-semibold text-green-900 dark:text-green-100 text-sm">
                              Outcome Milestone
                            </p>
                          </div>
                          <p className="text-sm text-green-800 dark:text-green-200">
                            {module.milestone}
                          </p>
                        </div>

                        {/* Lessons */}
                        <div>
                          <p className="font-semibold text-sm text-muted-foreground mb-3">
                            Lessons ({module.lessons.length})
                          </p>
                          <div className="space-y-3">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <div
                                key={lessonIndex}
                                className="p-3 border rounded-lg space-y-2"
                              >
                                <div className="flex items-start justify-between">
                                  <p className="font-medium">{lesson.title}</p>
                                  <Badge variant="secondary">
                                    {lesson.duration}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {lesson.learningObjective}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {lesson.activities.map((activity, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {activity}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Assessment */}
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                          <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1 text-sm">
                            Suggested Assessment
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {module.assessment}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* AI Insights */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Transformation Design Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-2">
                      Transformation Path
                    </p>
                    <p className="text-foreground leading-relaxed">
                      {result.insights.transformationPath}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-2">
                      Outcome Validation
                    </p>
                    <p className="text-foreground leading-relaxed">
                      {result.insights.outcomeValidation}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-2">
                      Recommendations
                    </p>
                    <p className="text-foreground leading-relaxed">
                      {result.insights.recommendations}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200 dark:border-purple-900">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Target className="h-12 w-12 text-purple-600 mx-auto" />
                    <h3 className="text-2xl font-bold">
                      Your Transformation Roadmap is Ready
                    </h3>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                      This outcome-first curriculum ensures every lesson drives toward real transformation. 
                      No fluff, no filler—just focused learning that produces results.
                    </p>
                    <div className="pt-4">
                      <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600">
                        Start Building Your Course
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
