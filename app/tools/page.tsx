"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Youtube, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ArrowRight
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

export default function ToolsPage() {
  const tools = [
    {
      title: "YouTube Monetization Readiness",
      description: "Check how close you are to meeting YouTube's monetization requirements. Get instant feedback on your progress.",
      icon: Youtube,
      iconColor: "text-red-500",
      href: "/tools/youtube-monetization",
      badge: "Calculator",
      features: ["Track subscriber count", "Monitor watch hours", "Get readiness score"]
    },
    {
      title: "Is Your Audience Course-Ready?",
      description: "Evaluate if your audience is ready for your online course based on engagement, size, and activity metrics.",
      icon: Users,
      iconColor: "text-blue-500",
      href: "/tools/audience-readiness",
      badge: "Assessment",
      features: ["Analyze engagement rate", "Evaluate audience size", "Get actionable insights"]
    },
    {
      title: "Course Pricing Calculator",
      description: "Get a suggested price for your online course based on duration, expertise level, and additional offerings.",
      icon: DollarSign,
      iconColor: "text-green-500",
      href: "/tools/pricing-calculator",
      badge: "Calculator",
      features: ["Duration-based pricing", "Expertise multiplier", "Support add-ons"]
    },
    {
      title: "Revenue Projection Tool",
      description: "Estimate your potential course revenue based on your audience reach, pricing, and expected conversion rates.",
      icon: TrendingUp,
      iconColor: "text-purple-500",
      href: "/tools/revenue-projection",
      badge: "Projection",
      features: ["Calculate enrollments", "Project revenue", "Monthly breakdown"]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Free Tools for Content Creators
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Analyze your content, understand your audience, and make data-driven decisions 
                to grow your business with our powerful free tools.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Tools Grid Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              {tools.map((tool, index) => (
                <ToolCard key={index} tool={tool} index={index} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

function ToolCard({ tool, index }: { tool: any; index: number }) {
  const Icon = tool.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow duration-300 group">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`h-6 w-6 ${tool.iconColor}`} />
            <Badge variant="secondary">{tool.badge}</Badge>
          </div>
          <CardTitle className="text-xl">{tool.title}</CardTitle>
          <CardDescription className="text-base">
            {tool.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 mb-6">
            {tool.features.map((feature: string, idx: number) => (
              <li key={idx} className="flex items-center text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                {feature}
              </li>
            ))}
          </ul>
          <Button asChild className="w-full group-hover:gap-3 transition-all">
            <Link href={tool.href}>
              Try This Tool
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function YouTubeMonetizationTool() {
  const [subscribers, setSubscribers] = useState("");
  const [watchHours, setWatchHours] = useState("");
  const [score, setScore] = useState<number | null>(null);

  const calculateScore = () => {
    const subs = parseInt(subscribers) || 0;
    const hours = parseInt(watchHours) || 0;

    const subsScore = Math.min((subs / 1000) * 50, 50);
    const hoursScore = Math.min((hours / 4000) * 50, 50);
    const totalScore = subsScore + hoursScore;

    setScore(totalScore);
  };

  const getRecommendation = () => {
    if (!score) return "";
    if (score >= 100) return "🎉 You're ready for monetization!";
    if (score >= 75) return "💪 Almost there! Keep going!";
    if (score >= 50) return "📈 You're halfway there!";
    if (score >= 25) return "🌱 Good start! Keep building.";
    return "🚀 Start creating and growing!";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Youtube className="h-6 w-6 text-red-500" />
            <Badge variant="secondary">Calculator</Badge>
          </div>
          <CardTitle>YouTube Monetization Readiness</CardTitle>
          <CardDescription>
            Check how close you are to meeting YouTube's monetization requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subscribers">Subscribers</Label>
            <Input
              id="subscribers"
              type="number"
              placeholder="1,000 required"
              value={subscribers}
              onChange={(e) => setSubscribers(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="watchHours">Watch Hours (Last 12 months)</Label>
            <Input
              id="watchHours"
              type="number"
              placeholder="4,000 required"
              value={watchHours}
              onChange={(e) => setWatchHours(e.target.value)}
            />
          </div>

          <Button onClick={calculateScore} className="w-full">
            Calculate Score
          </Button>

          {score !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 mt-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Readiness Score</span>
                <span className="text-2xl font-bold">{score.toFixed(0)}%</span>
              </div>
              <Progress value={score} className="h-3" />
              <p className="text-sm text-center font-medium text-primary">
                {getRecommendation()}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Target Subs</p>
                  <p className="text-lg font-bold">1,000</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Hours</p>
                  <p className="text-lg font-bold">4,000</p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AudienceReadinessTool() {
  const [engagementRate, setEngagementRate] = useState([3]);
  const [audienceSize, setAudienceSize] = useState("");
  const [contentFrequency, setContentFrequency] = useState([2]);
  const [readiness, setReadiness] = useState<number | null>(null);

  const calculateReadiness = () => {
    const size = parseInt(audienceSize) || 0;
    const sizeScore = Math.min((size / 10000) * 40, 40);
    const engagementScore = engagementRate[0] * 6;
    const frequencyScore = contentFrequency[0] * 5;

    const totalReadiness = sizeScore + engagementScore + frequencyScore;
    setReadiness(Math.min(totalReadiness, 100));
  };

  const getReadinessLevel = () => {
    if (!readiness) return { level: "", description: "", color: "" };
    if (readiness >= 80) return { 
      level: "Highly Ready", 
      description: "Your audience is primed for a course!",
      color: "text-green-600 dark:text-green-400" 
    };
    if (readiness >= 60) return { 
      level: "Ready", 
      description: "Good foundation. Start planning your course.",
      color: "text-blue-600 dark:text-blue-400" 
    };
    if (readiness >= 40) return { 
      level: "Developing", 
      description: "Keep growing and engaging your audience.",
      color: "text-yellow-600 dark:text-yellow-400" 
    };
    return { 
      level: "Early Stage", 
      description: "Focus on building your audience first.",
      color: "text-orange-600 dark:text-orange-400" 
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-6 w-6 text-blue-500" />
            <Badge variant="secondary">Assessment</Badge>
          </div>
          <CardTitle>Is Your Audience Course-Ready?</CardTitle>
          <CardDescription>
            Evaluate if your audience is ready for your online course
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="audienceSize">Total Audience Size</Label>
            <Input
              id="audienceSize"
              type="number"
              placeholder="e.g., 5000"
              value={audienceSize}
              onChange={(e) => setAudienceSize(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Engagement Rate (1-10)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={engagementRate}
                onValueChange={setEngagementRate}
                max={10}
                min={1}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-8">{engagementRate[0]}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Content Frequency (posts/week)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={contentFrequency}
                onValueChange={setContentFrequency}
                max={10}
                min={1}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-8">{contentFrequency[0]}</span>
            </div>
          </div>

          <Button onClick={calculateReadiness} className="w-full">
            Assess Readiness
          </Button>

          {readiness !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 mt-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Readiness Level</span>
                <span className="text-2xl font-bold">{readiness.toFixed(0)}%</span>
              </div>
              <Progress value={readiness} className="h-3" />
              <div className="text-center pt-2">
                <p className={`text-lg font-bold ${getReadinessLevel().color}`}>
                  {getReadinessLevel().level}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getReadinessLevel().description}
                </p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CoursePricingCalculator() {
  const [courseHours, setCourseHours] = useState("");
  const [expertiseLevel, setExpertiseLevel] = useState([5]);
  const [includeSupport, setIncludeSupport] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);

  const calculatePrice = () => {
    const hours = parseFloat(courseHours) || 0;
    const basePrice = hours * 20;
    const expertiseMultiplier = 1 + (expertiseLevel[0] / 10);
    const supportBonus = includeSupport ? 50 : 0;

    const price = basePrice * expertiseMultiplier + supportBonus;
    setSuggestedPrice(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      viewport={{ once: true }}
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-6 w-6 text-green-500" />
            <Badge variant="secondary">Calculator</Badge>
          </div>
          <CardTitle>Course Pricing Calculator</CardTitle>
          <CardDescription>
            Get a suggested price for your online course based on key factors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="courseHours">Course Duration (hours)</Label>
            <Input
              id="courseHours"
              type="number"
              placeholder="e.g., 10"
              value={courseHours}
              onChange={(e) => setCourseHours(e.target.value)}
              step="0.5"
            />
          </div>

          <div className="space-y-3">
            <Label>Your Expertise Level (1-10)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={expertiseLevel}
                onValueChange={setExpertiseLevel}
                max={10}
                min={1}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-8">{expertiseLevel[0]}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="support"
              checked={includeSupport}
              onChange={(e) => setIncludeSupport(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="support" className="cursor-pointer">
              Include 1-on-1 Support
            </Label>
          </div>

          <Button onClick={calculatePrice} className="w-full">
            Calculate Price
          </Button>

          {suggestedPrice !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 mt-4 p-4 bg-muted rounded-lg"
            >
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Suggested Price</p>
                <p className="text-4xl font-bold text-primary">
                  ${suggestedPrice.toFixed(0)}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Low</p>
                  <p className="text-sm font-bold">${(suggestedPrice * 0.7).toFixed(0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Mid</p>
                  <p className="text-sm font-bold">${suggestedPrice.toFixed(0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Premium</p>
                  <p className="text-sm font-bold">${(suggestedPrice * 1.5).toFixed(0)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RevenueProjectionTool() {
  const [expectedStudents, setExpectedStudents] = useState("");
  const [coursePrice, setCoursePrice] = useState("");
  const [conversionRate, setConversionRate] = useState([2]);
  const [projection, setProjection] = useState<any>(null);

  const calculateProjection = () => {
    const students = parseInt(expectedStudents) || 0;
    const price = parseFloat(coursePrice) || 0;
    const conversion = conversionRate[0] / 100;

    const enrollments = Math.floor(students * conversion);
    const revenue = enrollments * price;
    const monthlyRevenue = revenue / 12;

    setProjection({
      enrollments,
      revenue,
      monthlyRevenue,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      viewport={{ once: true }}
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-6 w-6 text-purple-500" />
            <Badge variant="secondary">Projection</Badge>
          </div>
          <CardTitle>Revenue Projection Tool</CardTitle>
          <CardDescription>
            Estimate your potential course revenue based on your audience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="expectedStudents">Expected Reach (people)</Label>
            <Input
              id="expectedStudents"
              type="number"
              placeholder="e.g., 5000"
              value={expectedStudents}
              onChange={(e) => setExpectedStudents(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coursePrice">Course Price ($)</Label>
            <Input
              id="coursePrice"
              type="number"
              placeholder="e.g., 99"
              value={coursePrice}
              onChange={(e) => setCoursePrice(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Expected Conversion Rate (%)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={conversionRate}
                onValueChange={setConversionRate}
                max={10}
                min={1}
                step={0.5}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">{conversionRate[0]}%</span>
            </div>
          </div>

          <Button onClick={calculateProjection} className="w-full">
            Project Revenue
          </Button>

          {projection && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 mt-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Enrollments</p>
                  <p className="text-2xl font-bold">{projection.enrollments}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${projection.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Monthly Average</p>
                <p className="text-3xl font-bold text-primary">
                  ${projection.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
