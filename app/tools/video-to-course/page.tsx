"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';
import { Video, FileText, Upload, Sparkles, AlertCircle, BookOpen, List, Target, ArrowLeft } from 'lucide-react';
import Loader from '@/components/loader';
import Link from 'next/link';

interface Lesson {
  title: string;
  duration: string;
  learningOutcome: string;
}

interface Module {
  moduleNumber: number;
  title: string;
  description: string;
  lessons: Lesson[];
  suggestedExercise: string;
}

interface CourseOutlineResult {
  courseTitle: string;
  courseDescription: string;
  targetAudience: string;
  prerequisites: string[];
  modules: Module[];
  estimatedDuration: string;
  insights: {
    contentQuality: string;
    structureRecommendations: string;
    nextSteps: string;
  };
}

export default function VideoToCoursePage() {
  const [inputType, setInputType] = useState<'url' | 'transcript' | 'outline'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [outline, setOutline] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CourseOutlineResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/tools/video-to-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputType,
          videoUrl: inputType === 'url' ? videoUrl : undefined,
          transcript: inputType === 'transcript' ? transcript : undefined,
          outline: inputType === 'outline' ? outline : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate course outline');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (inputType === 'url') return videoUrl.trim() !== '';
    if (inputType === 'transcript') return transcript.trim().length > 100;
    if (inputType === 'outline') return outline.trim().length > 50;
    return false;
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
              <Video className="h-4 w-4" />
              Video to Course Outline
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Turn Your Video Into a Course Outline
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Already have content? Convert your video, transcript, or outline into a structured course with AI-powered modules and lessons.
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
                <CardTitle>Transform Your Content</CardTitle>
                <CardDescription>
                  Choose your input method and let AI structure your content into a professional course outline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs value={inputType} onValueChange={(v) => setInputType(v as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="url" className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        YouTube URL
                      </TabsTrigger>
                      <TabsTrigger value="transcript" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Transcript
                      </TabsTrigger>
                      <TabsTrigger value="outline" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Content Outline
                      </TabsTrigger>
                    </TabsList>

                    {/* YouTube URL Tab */}
                    <TabsContent value="url" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="videoUrl">YouTube Video URL</Label>
                        <Input
                          id="videoUrl"
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                          We&apos;ll extract the transcript and convert it into a structured course outline
                        </p>
                      </div>
                    </TabsContent>

                    {/* Transcript Tab */}
                    <TabsContent value="transcript" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="transcript">Video Transcript</Label>
                        <Textarea
                          id="transcript"
                          placeholder="Paste your video transcript here... (minimum 100 characters)"
                          value={transcript}
                          onChange={(e) => setTranscript(e.target.value)}
                          rows={12}
                          className="font-mono text-sm"
                        />
                        <p className="text-sm text-muted-foreground">
                          {transcript.length} characters • Minimum 100 required
                        </p>
                      </div>
                    </TabsContent>

                    {/* Content Outline Tab */}
                    <TabsContent value="outline" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="outline">Content Outline</Label>
                        <Textarea
                          id="outline"
                          placeholder="Paste your content outline, bullet points, or notes here... (minimum 50 characters)"
                          value={outline}
                          onChange={(e) => setOutline(e.target.value)}
                          rows={12}
                        />
                        <p className="text-sm text-muted-foreground">
                          {outline.length} characters • Minimum 50 required
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || !isFormValid()}>
                    {loading ? 'Generating Course Outline...' : 'Generate Course Outline'}
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{result.courseTitle}</CardTitle>
                      <CardDescription className="text-base">
                        {result.courseDescription}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-4">
                      {result.estimatedDuration}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-1">
                      Target Audience
                    </p>
                    <p className="text-foreground">{result.targetAudience}</p>
                  </div>
                  {result.prerequisites.length > 0 && (
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground mb-2">
                        Prerequisites
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.prerequisites.map((prereq, index) => (
                          <Badge key={index} variant="outline">
                            {prereq}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Modules */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  Course Modules ({result.modules.length})
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
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold text-lg flex-shrink-0">
                            {module.moduleNumber}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-1">{module.title}</CardTitle>
                            <CardDescription>{module.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Lessons */}
                        <div>
                          <p className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                            <List className="h-4 w-4" />
                            Lessons ({module.lessons.length})
                          </p>
                          <div className="space-y-3">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <div
                                key={lessonIndex}
                                className="p-3 border rounded-lg space-y-1"
                              >
                                <div className="flex items-start justify-between">
                                  <p className="font-medium">{lesson.title}</p>
                                  <Badge variant="secondary" className="ml-2">
                                    {lesson.duration}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground flex items-start gap-2">
                                  <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  {lesson.learningOutcome}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Suggested Exercise */}
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                          <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1 text-sm">
                            Suggested Exercise
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {module.suggestedExercise}
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
                    AI-Powered Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-2">
                      Content Quality Assessment
                    </p>
                    <p className="text-foreground leading-relaxed">
                      {result.insights.contentQuality}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-2">
                      Structure Recommendations
                    </p>
                    <p className="text-foreground leading-relaxed">
                      {result.insights.structureRecommendations}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-2">
                      Next Steps
                    </p>
                    <p className="text-foreground leading-relaxed">
                      {result.insights.nextSteps}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-2 border-blue-200 dark:border-blue-900">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <BookOpen className="h-12 w-12 text-blue-600 mx-auto" />
                    <h3 className="text-2xl font-bold">
                      Your Course Structure is Ready
                    </h3>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                      You&apos;ve already created the content—now you have a clear structure to turn it into a course. 
                      No need to start from scratch. Your teaching is already validated.
                    </p>
                    <div className="pt-4">
                      <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600">
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
