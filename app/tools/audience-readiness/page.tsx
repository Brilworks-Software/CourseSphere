"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  ArrowRight, 
  Target, 
  MessageCircle, 
  Users, 
  BookOpen, 
  TrendingUp,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface QuizAnswers {
  commentType: string;
  tutorialRequests: string;
  oneOnOneHelp: string;
  niche: string;
  engagementLevel: string;
  sharesProcesses: string;
  contentFrequency: string;
}

interface QuizResults {
  score: number;
  readinessLevel: "not-ready" | "almost-ready" | "course-ready";
  insights: string;
}

const questions = [
  {
    id: "commentType",
    question: "What do people comment most on your content?",
    icon: MessageCircle,
    options: [
      { value: "generic", label: "Generic praise (\"Great!\", \"Nice!\")", score: 1 },
      { value: "questions", label: "Questions asking for more info", score: 3 },
      { value: "implementation", label: "\"How do I do this?\" or implementation questions", score: 5 },
      { value: "results", label: "Sharing their results after following your advice", score: 4 },
    ]
  },
  {
    id: "tutorialRequests",
    question: "Do your followers ask for step-by-step tutorials?",
    icon: BookOpen,
    options: [
      { value: "never", label: "Never or rarely", score: 1 },
      { value: "sometimes", label: "Sometimes in comments", score: 3 },
      { value: "often", label: "Often and specifically", score: 5 },
      { value: "dms", label: "Yes, they even DM me about it", score: 5 },
    ]
  },
  {
    id: "oneOnOneHelp",
    question: "Have you ever helped someone 1:1 with your expertise?",
    icon: Users,
    options: [
      { value: "no", label: "No, not yet", score: 1 },
      { value: "once", label: "Once or twice informally", score: 3 },
      { value: "several", label: "Yes, several times", score: 4 },
      { value: "regularly", label: "Regularly (coaching, consulting, etc.)", score: 5 },
    ]
  },
  {
    id: "niche",
    question: "What's your main niche or topic area?",
    icon: Target,
    type: "text",
    placeholder: "e.g., fitness, cooking, productivity, design...",
  },
  {
    id: "engagementLevel",
    question: "How engaged is your audience with your content?",
    icon: TrendingUp,
    options: [
      { value: "low", label: "Low (mostly views, few interactions)", score: 1 },
      { value: "moderate", label: "Moderate (some likes and comments)", score: 3 },
      { value: "high", label: "High (consistent engagement)", score: 4 },
      { value: "veryHigh", label: "Very high (saves, shares, DMs)", score: 5 },
    ]
  },
  {
    id: "sharesProcesses",
    question: "Do you regularly share processes or methods in your content?",
    icon: CheckCircle,
    options: [
      { value: "no", label: "No, mostly inspiration/motivation", score: 1 },
      { value: "sometimes", label: "Sometimes, but not detailed", score: 2 },
      { value: "yes", label: "Yes, I explain how things work", score: 4 },
      { value: "detailed", label: "Yes, with detailed breakdowns", score: 5 },
    ]
  },
  {
    id: "contentFrequency",
    question: "What's your content creation frequency?",
    icon: Clock,
    options: [
      { value: "occasional", label: "Occasional (whenever inspired)", score: 2 },
      { value: "weekly", label: "Weekly or bi-weekly", score: 3 },
      { value: "several", label: "Several times per week", score: 4 },
      { value: "daily", label: "Daily or almost daily", score: 5 },
    ]
  },
];

export default function AudienceReadinessQuizPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [results, setResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(false);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const canProceed = () => {
    const questionId = currentQuestion.id as keyof QuizAnswers;
    return answers[questionId] && answers[questionId]?.trim() !== "";
  };

  const calculateScore = () => {
    let totalScore = 0;
    let maxScore = 0;

    questions.forEach((question) => {
      const answer = answers[question.id as keyof QuizAnswers];
      
      if (question.options) {
        const selectedOption = question.options.find(opt => opt.value === answer);
        if (selectedOption) {
          totalScore += selectedOption.score;
        }
        maxScore += 5;
      }
    });

    // Normalize to 100
    const normalizedScore = Math.round((totalScore / maxScore) * 100);
    return normalizedScore;
  };

  const getReadinessLevel = (score: number): "not-ready" | "almost-ready" | "course-ready" => {
    if (score >= 75) return "course-ready";
    if (score >= 50) return "almost-ready";
    return "not-ready";
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const score = calculateScore();
      const readinessLevel = getReadinessLevel(score);

      const response = await fetch("/api/audience-readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          score,
          readinessLevel,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults({
          score: data.score,
          readinessLevel: data.readinessLevel,
          insights: data.insights,
        });
      } else {
        throw new Error(data.error || "Failed to get results");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to get results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setResults(null);
  };

  if (results) {
    return (
      <div className="min-h-screen flex flex-col">
        <LandingHeader />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/tools">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tools
              </Button>
            </Link>

            <Card className="border-2">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  {results.readinessLevel === "course-ready" && (
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  )}
                  {results.readinessLevel === "almost-ready" && (
                    <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto" />
                  )}
                  {results.readinessLevel === "not-ready" && (
                    <Target className="h-16 w-16 text-blue-500 mx-auto" />
                  )}
                </div>
                <CardTitle className="text-3xl font-bold">
                  Your Course Readiness Score
                </CardTitle>
                <div className="text-6xl font-bold mt-4 mb-2">
                  {results.score}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <Badge 
                  variant={
                    results.readinessLevel === "course-ready" ? "default" :
                    results.readinessLevel === "almost-ready" ? "secondary" : 
                    "outline"
                  }
                  className="text-lg py-1 px-4"
                >
                  {results.readinessLevel === "course-ready" && "🎉 Course-Ready!"}
                  {results.readinessLevel === "almost-ready" && "⚡ Almost Ready"}
                  {results.readinessLevel === "not-ready" && "🌱 Building Stage"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Sparkles className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {results.insights}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={resetQuiz} variant="outline" className="flex-1">
                    Retake Quiz
                  </Button>
                  <Link href="/tools" className="flex-1">
                    <Button className="w-full">
                      Explore More Tools
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
        <Link href="/tools">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tools
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <Badge className="mb-4" variant="secondary">
              <Target className="mr-2 h-4 w-4" />
              Audience Readiness Quiz
            </Badge>
            <h1 className="text-4xl font-bold mb-4">
              Is Your Audience Course-Ready?
            </h1>
            <p className="text-lg text-muted-foreground">
              Answer {questions.length} quick questions to discover if your audience is ready for a course
            </p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Question {currentStep + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <currentQuestion.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">
                        {currentQuestion.question}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentQuestion.type === "text" ? (
                    <div className="space-y-2">
                      <Label htmlFor={currentQuestion.id}>Your answer</Label>
                      <Textarea
                        id={currentQuestion.id}
                        placeholder={currentQuestion.placeholder}
                        value={answers[currentQuestion.id as keyof QuizAnswers] || ""}
                        onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  ) : (
                    <RadioGroup
                      value={answers[currentQuestion.id as keyof QuizAnswers] || ""}
                      onValueChange={(value: string) => handleAnswer(currentQuestion.id, value)}
                      className="space-y-3"
                    >
                      {currentQuestion.options?.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => handleAnswer(currentQuestion.id, option.value)}
                        >
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label
                            htmlFor={option.value}
                            className="flex-1 cursor-pointer font-normal"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  <div className="flex gap-3 mt-6 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 0}
                      className="flex-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed() || loading}
                      className="flex-1"
                    >
                      {loading ? (
                        "Analyzing..."
                      ) : currentStep === questions.length - 1 ? (
                        <>
                          Get Results
                          <Sparkles className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </main>
      <LandingFooter />
    </div>
  );
}
