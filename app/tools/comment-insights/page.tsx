"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare, 
  ArrowLeft, 
  Sparkles, 
  Youtube, 
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  ThumbsUp,
  Eye,
  BookOpen,
  Layers,
  DollarSign,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

interface Comment {
  id: string;
  text: string;
  textOriginal: string;
  author: string;
  authorImage: string;
  likeCount: number;
  publishedAt: string;
  replyCount: number;
}

interface Module {
  category: string;
  name: string;
  description: string;
  keyTopics: string[];
  commentIds: number[];
  commentCount: number;
  priority: string;
  estimatedLessons: number;
}

interface Insights {
  modules: Module[];
  summary: {
    topDemand: string;
    monetizationSignals: string;
    gapsInContent: string;
  };
}

export default function CommentInsightsPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);

  const handleAnalyze = async () => {
    setError(null);
    setIsAnalyzing(true);
    setVideoInfo(null);
    setComments([]);
    setInsights(null);

    try {
      console.log('Step 1: Fetching video comments...');
      
      // Fetch comments
      const fetchResponse = await fetch('/api/youtube/comment-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json();
        throw new Error(errorData.error || 'Failed to fetch comments');
      }

      const fetchData = await fetchResponse.json();
      console.log('Fetched comments:', fetchData);
      setVideoInfo(fetchData.videoInfo);
      setComments(fetchData.comments);

      // Analyze comments
      console.log('Step 2: Analyzing comments with AI...');
      const analyzeResponse = await fetch('/api/youtube/analyze-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: fetchData.comments,
          videoTitle: fetchData.videoInfo.title,
        }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || 'Failed to analyze comments');
      }

      const analyzeData = await analyzeResponse.json();
      console.log('Analysis complete:', analyzeData);
      setInsights(analyzeData.insights);

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'beginner': return <BookOpen className="h-5 w-5" />;
      case 'intermediate': return <Layers className="h-5 w-5" />;
      case 'advanced': return <TrendingUp className="h-5 w-5" />;
      case 'monetization': return <DollarSign className="h-5 w-5" />;
      case 'pain_point': return <AlertTriangle className="h-5 w-5" />;
      default: return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'beginner': return 'bg-blue-500';
      case 'intermediate': return 'bg-purple-500';
      case 'advanced': return 'bg-orange-500';
      case 'monetization': return 'bg-green-500';
      case 'pain_point': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1 py-12 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link href="/tools">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tools
              </Button>
            </Link>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Comment-to-Course Insights</h1>
                <Badge variant="secondary" className="mt-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered Analysis
                </Badge>
              </div>
            </div>
            
            <p className="text-lg text-muted-foreground">
              Analyze YouTube comments to discover what your audience really wants to learn.
              Get AI-organized modules based on real demand from your viewers.
            </p>
          </motion.div>

          {/* Input Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Analyze Video Comments</CardTitle>
              <CardDescription>
                Enter a YouTube video URL to extract and analyze comments for course insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="videoUrl">YouTube Video URL</Label>
                <Input
                  id="videoUrl"
                  placeholder="https://youtube.com/watch?v=VIDEO_ID"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  We'll analyze up to 500 comments to find patterns and course opportunities
                </p>
              </div>

              <Button 
                onClick={handleAnalyze} 
                disabled={!videoUrl.trim() || isAnalyzing}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Comments...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Extract Course Insights
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Video Info */}
          {videoInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-start gap-4">
                    <img 
                      src={videoInfo.thumbnail} 
                      alt={videoInfo.title}
                      className="w-40 h-24 rounded-lg object-cover border-2 border-primary"
                    />
                    <div className="flex-1">
                      <h2 className="text-xl mb-2">{videoInfo.title}</h2>
                      <p className="text-sm text-muted-foreground">{videoInfo.channelName}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Views</p>
                        <p className="text-xl font-bold">
                          {videoInfo.views?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Likes</p>
                        <p className="text-xl font-bold">
                          {videoInfo.likes?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Comments Analyzed</p>
                        <p className="text-xl font-bold">
                          {comments.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Insights Summary */}
          {insights?.summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-6 w-6 text-primary" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Top Demand
                    </h4>
                    <p className="text-muted-foreground">{insights.summary.topDemand}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Monetization Signals
                    </h4>
                    <p className="text-muted-foreground">{insights.summary.monetizationSignals}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Content Gaps
                    </h4>
                    <p className="text-muted-foreground">{insights.summary.gapsInContent}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Modules */}
          {insights?.modules && insights.modules.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Course Modules from Comments</h2>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {insights.modules.length} Modules Identified
                </Badge>
              </div>

              {insights.modules.map((module, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-3 rounded-lg ${getCategoryColor(module.category)}/20`}>
                            {getCategoryIcon(module.category)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getCategoryColor(module.category)}>
                                {module.category}
                              </Badge>
                              <Badge className={getPriorityColor(module.priority)}>
                                {module.priority} priority
                              </Badge>
                            </div>
                            <CardTitle className="text-2xl mb-2">{module.name}</CardTitle>
                            <CardDescription className="text-base">
                              {module.description}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Based on</p>
                          <p className="text-3xl font-bold text-primary">
                            {module.commentCount}
                          </p>
                          <p className="text-sm text-muted-foreground">comments</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Key Topics */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          Key Topics to Cover
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {module.keyTopics.map((topic, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span className="text-sm">{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            <strong>{module.estimatedLessons}</strong> estimated lessons
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Comments: {module.commentIds.slice(0, 5).join(', ')}
                            {module.commentIds.length > 5 && ` +${module.commentIds.length - 5} more`}
                          </span>
                        </div>
                      </div>

                      {/* Sample Comments */}
                      {module.commentIds.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
                            Sample Comments:
                          </h4>
                          <div className="space-y-2">
                            {module.commentIds.slice(0, 3).map((commentId) => {
                              const comment = comments[commentId - 1];
                              if (!comment) return null;
                              return (
                                <div key={commentId} className="flex gap-2 p-2 bg-muted/50 rounded text-xs">
                                  <img 
                                    src={comment.authorImage} 
                                    alt={comment.author}
                                    className="w-6 h-6 rounded-full"
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium">{comment.author}</p>
                                    <p className="text-muted-foreground line-clamp-2">
                                      {comment.textOriginal}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* How It Works */}
          {!insights && (
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>
                  AI-powered comment analysis to discover what your audience wants to learn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Youtube className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">1. Fetch Comments</h4>
                    <p className="text-sm text-muted-foreground">
                      We extract up to 500 top comments from your video using YouTube API
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">2. Process & Clean</h4>
                    <p className="text-sm text-muted-foreground">
                      Remove duplicates, spam, and low-quality comments to get meaningful insights
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">3. AI Clustering</h4>
                    <p className="text-sm text-muted-foreground">
                      Group comments by intent: beginner questions, advanced requests, monetization signals
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">4. Module Mapping</h4>
                    <p className="text-sm text-muted-foreground">
                      See which comments should become Module 1, Module 2, etc. with real demand proof
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
