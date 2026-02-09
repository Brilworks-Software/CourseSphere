"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Lightbulb, 
  ArrowLeft, 
  Sparkles, 
  Youtube, 
  FileText,
  Users,
  DollarSign,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  ThumbsUp,
  MessageCircle,
  Eye,
  Calendar,
  Info
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

interface CourseIdea {
  title: string;
  targetAudience: string;
  problemSolved: string;
  format: string;
  duration: string;
  priceRange: { min: number; max: number };
  keyTopics: string[];
  demandSignal: string;
  confidence: "high" | "medium" | "low";
}

export default function YouTubeCourseIdeaPage() {
  const [inputType, setInputType] = useState<"channel" | "video" | "transcript">("channel");
  const [channelUrl, setChannelUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [channelData, setChannelData] = useState<any>(null);
  const [courseIdeas, setCourseIdeas] = useState<CourseIdea[]>([]);
  const [rawAnalysis, setRawAnalysis] = useState<string>("");

  const handleAnalyze = async () => {
    setError(null);
    setIsAnalyzing(true);
    setCourseIdeas([]);
    setChannelData(null);

    try {
      console.log('Step 1: Fetching YouTube data...');
      // Step 1: Fetch YouTube data
      const fetchResponse = await fetch('/api/youtube/course-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelUrl: inputType === "channel" ? channelUrl : undefined,
          videoUrl: inputType === "video" ? videoUrl : undefined,
          transcript: inputType === "transcript" ? transcript : undefined,
          inputType,
        }),
      });

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const fetchData = await fetchResponse.json();
      console.log('Fetch Data Response:', fetchData);
      console.log('Channel Image:', fetchData.data?.channelImage);
      setChannelData(fetchData.data);

      // Step 2: Generate course ideas using AI
      console.log('Step 2: Generating course ideas with AI...');
      setIsGenerating(true);
      const generateResponse = await fetch('/api/youtube/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topVideos: fetchData.data.topVideos,
          transcript: fetchData.data.transcript,
          channelName: fetchData.data.channelName,
          subscribers: fetchData.data.subscribers,
          engagementRate: fetchData.data.engagementRate,
          inputType,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        console.error('Generation Error:', errorData);
        throw new Error(errorData.error || 'Failed to generate ideas');
      }

      const generateData = await generateResponse.json();
      console.log('Generated Ideas:', generateData.courseIdeas);
      setCourseIdeas(generateData.courseIdeas || []);
      setRawAnalysis(generateData.rawAnalysis || '');

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
      setIsGenerating(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const isFormValid = () => {
    if (inputType === "channel") return channelUrl.trim() !== "";
    if (inputType === "video") return videoUrl.trim() !== "";
    if (inputType === "transcript") return transcript.trim().length > 100;
    return false;
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
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">YouTube Course Idea Generator</h1>
                <Badge variant="secondary" className="mt-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
              </div>
            </div>
            
            <p className="text-lg text-muted-foreground">
              Discover profitable course ideas based on your YouTube content and audience needs.
              Get AI-powered insights from video topics, comments, and engagement patterns.
            </p>
          </motion.div>

          {/* Input Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What Should You Analyze?</CardTitle>
              <CardDescription>
                Choose your input method: analyze an entire channel, a specific video, or paste a transcript
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={inputType} onValueChange={(v) => setInputType(v as any)} className="mb-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="channel">
                    <Youtube className="h-4 w-4 mr-2" />
                    Channel URL
                  </TabsTrigger>
                  <TabsTrigger value="video">
                    <Youtube className="h-4 w-4 mr-2" />
                    Video URL
                  </TabsTrigger>
                  <TabsTrigger value="transcript">
                    <FileText className="h-4 w-4 mr-2" />
                    Transcript
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="channel" className="space-y-4">
                  <div>
                    <Label htmlFor="channelUrl">YouTube Channel URL</Label>
                    <Input
                      id="channelUrl"
                      placeholder="https://youtube.com/@channelname or @channelname"
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      We'll analyze your top videos, comments, and engagement patterns
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="video" className="space-y-4">
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
                      We'll analyze this specific video's comments and engagement
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="transcript" className="space-y-4">
                  <div>
                    <Label htmlFor="transcript">Video Transcript</Label>
                    <Textarea
                      id="transcript"
                      placeholder="Paste your video transcript here..."
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      className="mt-2 min-h-[200px]"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Minimum 100 characters required. More content = better analysis
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <Button 
                onClick={handleAnalyze} 
                disabled={!isFormValid() || isAnalyzing || isGenerating}
                className="w-full"
                size="lg"
              >
                {isAnalyzing || isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isAnalyzing ? "Analyzing..." : "Generating Ideas..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Course Ideas
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Channel/Video Overview */}
          {channelData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              {inputType === 'channel' ? (
                /* Channel Overview */
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      {channelData.channelImage && (
                        <img 
                          src={channelData.channelImage} 
                          alt={channelData.channelName}
                          className="w-16 h-16 rounded-full border-2 border-primary"
                        />
                      )}
                      <div>
                        <h2 className="text-2xl">{channelData.channelName || "Channel Analysis"}</h2>
                        <Badge variant="secondary" className="mt-1">Channel</Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Subscribers</p>
                          <p className="text-xl font-bold">
                            {(channelData.subscribers && channelData.subscribers > 0) 
                              ? channelData.subscribers.toLocaleString() 
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Views</p>
                          <p className="text-xl font-bold">
                            {(channelData.avgViews && channelData.avgViews > 0) 
                              ? channelData.avgViews.toLocaleString() 
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Engagement</p>
                          <p className="text-xl font-bold">
                            {(channelData.engagementRate && channelData.engagementRate > 0) 
                              ? channelData.engagementRate.toFixed(2) + "%" 
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Youtube className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Videos</p>
                          <p className="text-xl font-bold">
                            {(channelData.totalPosts && channelData.totalPosts > 0) 
                              ? channelData.totalPosts.toLocaleString() 
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                    {(!channelData.subscribers || channelData.subscribers === 0) && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          <Info className="inline h-4 w-4 mr-2" />
                          Some channel statistics may not be available. Course ideas will be generated based on content analysis.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : inputType === 'video' && channelData.videoThumbnail ? (
                /* Video Overview */
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-start gap-4">
                      <img 
                        src={channelData.videoThumbnail} 
                        alt={channelData.videoTitle}
                        className="w-40 h-24 rounded-lg object-cover border-2 border-primary"
                      />
                      <div className="flex-1">
                        <h2 className="text-xl mb-2">{channelData.videoTitle || "Video Analysis"}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary">Video</Badge>
                          <span>{channelData.channelName}</span>
                          {channelData.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(channelData.publishedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Views</p>
                          <p className="text-xl font-bold">
                            {channelData.videoViews?.toLocaleString() || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Likes</p>
                          <p className="text-xl font-bold">
                            {channelData.videoLikes?.toLocaleString() || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Comments</p>
                          <p className="text-xl font-bold">
                            {channelData.videoComments?.toLocaleString() || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Display top 5 comments */}
                    {channelData.topVideos?.[0]?.comments && channelData.topVideos[0].comments.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          Top Comments
                        </h3>
                        <div className="space-y-3">
                          {channelData.topVideos[0].comments.slice(0, 5).map((comment: any, index: number) => (
                            <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                              {comment.authorImage && (
                                <img 
                                  src={comment.authorImage} 
                                  alt={comment.author}
                                  className="w-10 h-10 rounded-full"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{comment.author}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.publishedAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm" dangerouslySetInnerHTML={{ __html: comment.text }} />
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <ThumbsUp className="h-3 w-3" />
                                  <span>{comment.likeCount}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* Transcript Overview */
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <span>Transcript Analysis</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Analyzing {transcript?.length || 0} characters of transcript content
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Course Ideas */}
          <AnimatePresence mode="wait">
            {courseIdeas.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold">Your Course Ideas</h2>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {courseIdeas.length} Ideas Generated
                  </Badge>
                </div>

                {courseIdeas.map((idea, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getConfidenceColor(idea.confidence)}>
                                {idea.confidence} confidence
                              </Badge>
                              <Badge variant="outline">{idea.format}</Badge>
                            </div>
                            <CardTitle className="text-2xl mb-2">{idea.title}</CardTitle>
                            <CardDescription className="text-base">
                              {idea.targetAudience}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Price Range</p>
                            <p className="text-2xl font-bold text-green-600">
                              ₹{idea.priceRange.min.toLocaleString()} - ₹{idea.priceRange.max.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Problem */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="h-5 w-5 text-orange-500" />
                              <h4 className="font-semibold">Problem It Solves</h4>
                            </div>
                            <p className="text-muted-foreground">{idea.problemSolved}</p>
                          </div>

                          {/* Demand Signal */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-5 w-5 text-blue-500" />
                              <h4 className="font-semibold">Why People Will Buy This</h4>
                            </div>
                            <p className="text-muted-foreground">{idea.demandSignal}</p>
                          </div>

                          {/* Duration */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5 text-purple-500" />
                              <span className="text-sm">
                                <strong>Duration:</strong> {idea.duration}
                              </span>
                            </div>
                          </div>

                          {/* Key Topics */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <h4 className="font-semibold">Key Topics Covered</h4>
                            </div>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {idea.keyTopics.map((topic, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span className="text-sm">{topic}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {/* Raw Analysis (Optional Debug)
                {rawAnalysis && (
                  <Card className="mt-8">
                    <CardHeader>
                      <CardTitle>Full AI Analysis</CardTitle>
                      <CardDescription>
                        Detailed analysis from our AI system
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
                        {rawAnalysis}
                      </pre>
                    </CardContent>
                  </Card>
                )} */}
              </motion.div>
            )}
          </AnimatePresence>

          {/* How It Works */}
          {courseIdeas.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>
                  Our AI analyzes your content to find profitable course opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Youtube className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">1. Analyze Your Content</h4>
                    <p className="text-sm text-muted-foreground">
                      We fetch your top-performing videos, engagement metrics, and audience comments
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">2. Identify Problems</h4>
                    <p className="text-sm text-muted-foreground">
                      AI clusters topics and extracts pain points from comments and video content
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">3. Rank by Demand</h4>
                    <p className="text-sm text-muted-foreground">
                      Problems are prioritized by frequency, urgency, and willingness to pay
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">4. Generate Course Ideas</h4>
                    <p className="text-sm text-muted-foreground">
                      Get 5 specific course ideas with titles, pricing, format, and curriculum outline
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
