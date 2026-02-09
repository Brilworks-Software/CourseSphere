import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Course {
  title: string;
  platform: string;
  price: number;
  currency: string;
  format: "self-paced" | "cohort" | "hybrid";
  students?: number;
  rating?: number;
  url?: string;
}

// Mock course database - In production, this would come from actual scraping/APIs
const COURSE_DATABASE: Record<string, Course[]> = {
  "digital marketing": [
    { title: "Complete Digital Marketing Masterclass", platform: "Udemy", price: 3499, currency: "₹", format: "self-paced", students: 45230, rating: 4.5, url: "https://udemy.com" },
    { title: "Digital Marketing for Entrepreneurs", platform: "Gumroad", price: 5999, currency: "₹", format: "self-paced", students: 3420, rating: 4.7 },
    { title: "Advanced Facebook Ads Bootcamp", platform: "Creator Site", price: 12999, currency: "₹", format: "cohort", students: 856, rating: 4.9 },
    { title: "SEO Blueprint 2026", platform: "Udemy", price: 2999, currency: "₹", format: "self-paced", students: 28500, rating: 4.4 },
    { title: "Social Media Marketing Pro", platform: "Gumroad", price: 4499, currency: "₹", format: "self-paced", students: 5600, rating: 4.6 },
    { title: "Email Marketing Mastery", platform: "Creator Site", price: 15999, currency: "₹", format: "cohort", students: 423, rating: 4.8 },
    { title: "Content Marketing Strategy", platform: "Udemy", price: 3299, currency: "₹", format: "self-paced", students: 19800, rating: 4.3 },
    { title: "Growth Hacking for Startups", platform: "Gumroad", price: 7999, currency: "₹", format: "hybrid", students: 2100, rating: 4.7 },
  ],
  "web development": [
    { title: "Full Stack Web Development Bootcamp", platform: "Udemy", price: 4999, currency: "₹", format: "self-paced", students: 82300, rating: 4.6, url: "https://udemy.com" },
    { title: "React & Next.js Complete Guide", platform: "Creator Site", price: 18999, currency: "₹", format: "cohort", students: 1250, rating: 4.9 },
    { title: "JavaScript Mastery Course", platform: "Udemy", price: 3499, currency: "₹", format: "self-paced", students: 65400, rating: 4.5 },
    { title: "Advanced Node.js Development", platform: "Gumroad", price: 8999, currency: "₹", format: "self-paced", students: 4200, rating: 4.7 },
    { title: "Modern CSS & Tailwind CSS", platform: "Udemy", price: 2499, currency: "₹", format: "self-paced", students: 34500, rating: 4.4 },
    { title: "TypeScript for Professionals", platform: "Creator Site", price: 14999, currency: "₹", format: "cohort", students: 890, rating: 4.8 },
    { title: "MongoDB & Database Design", platform: "Gumroad", price: 5999, currency: "₹", format: "self-paced", students: 7800, rating: 4.6 },
    { title: "API Development Masterclass", platform: "Udemy", price: 3999, currency: "₹", format: "self-paced", students: 28900, rating: 4.5 },
  ],
  "yoga": [
    { title: "Yoga Teacher Training 200hr", platform: "Creator Site", price: 24999, currency: "₹", format: "cohort", students: 320, rating: 4.9 },
    { title: "Beginner's Yoga Journey", platform: "Udemy", price: 1999, currency: "₹", format: "self-paced", students: 15600, rating: 4.6 },
    { title: "Advanced Asana Practice", platform: "Gumroad", price: 4999, currency: "₹", format: "self-paced", students: 2100, rating: 4.7 },
    { title: "Pranayama & Meditation", platform: "Creator Site", price: 8999, currency: "₹", format: "hybrid", students: 1450, rating: 4.8 },
    { title: "Yoga for Weight Loss", platform: "Udemy", price: 1499, currency: "₹", format: "self-paced", students: 22300, rating: 4.4 },
    { title: "Restorative Yoga Certification", platform: "Creator Site", price: 19999, currency: "₹", format: "cohort", students: 560, rating: 4.9 },
    { title: "Power Yoga Transformation", platform: "Gumroad", price: 3499, currency: "₹", format: "self-paced", students: 4200, rating: 4.5 },
  ],
  "photography": [
    { title: "Professional Photography Masterclass", platform: "Udemy", price: 3999, currency: "₹", format: "self-paced", students: 38200, rating: 4.7 },
    { title: "Portrait Photography Bootcamp", platform: "Creator Site", price: 16999, currency: "₹", format: "cohort", students: 680, rating: 4.9 },
    { title: "Lightroom & Photoshop Mastery", platform: "Udemy", price: 2999, currency: "₹", format: "self-paced", students: 45600, rating: 4.6 },
    { title: "Wedding Photography Business", platform: "Gumroad", price: 9999, currency: "₹", format: "hybrid", students: 1800, rating: 4.8 },
    { title: "Mobile Photography Pro", platform: "Udemy", price: 1499, currency: "₹", format: "self-paced", students: 28900, rating: 4.4 },
    { title: "Commercial Photography Course", platform: "Creator Site", price: 21999, currency: "₹", format: "cohort", students: 420, rating: 4.9 },
  ],
  "content creation": [
    { title: "YouTube Creator Bootcamp", platform: "Gumroad", price: 6999, currency: "₹", format: "self-paced", students: 8900, rating: 4.7 },
    { title: "Video Editing Pro Course", platform: "Udemy", price: 3499, currency: "₹", format: "self-paced", students: 34200, rating: 4.5 },
    { title: "Podcasting Masterclass", platform: "Creator Site", price: 12999, currency: "₹", format: "cohort", students: 1100, rating: 4.8 },
    { title: "Instagram Growth Strategy", platform: "Gumroad", price: 4999, currency: "₹", format: "self-paced", students: 12300, rating: 4.6 },
    { title: "TikTok Creator Academy", platform: "Udemy", price: 2499, currency: "₹", format: "self-paced", students: 19800, rating: 4.4 },
    { title: "Content Strategy & Planning", platform: "Creator Site", price: 15999, currency: "₹", format: "cohort", students: 890, rating: 4.9 },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { niche, channelUrl } = body;

    if (!niche) {
      return NextResponse.json(
        { error: "Niche keyword is required" },
        { status: 400 }
      );
    }

    // Normalize niche keyword
    const normalizedNiche = niche.toLowerCase().trim();

    // Get courses for this niche or use a generic approach
    let courses = COURSE_DATABASE[normalizedNiche] || generateGenericCourses(niche);

    // Calculate pricing patterns
    const prices = courses.map(c => c.price);
    const cohortPrices = courses.filter(c => c.format === "cohort").map(c => c.price);
    const selfPacedPrices = courses.filter(c => c.format === "self-paced").map(c => c.price);

    const avgCohortPrice = cohortPrices.length > 0 
      ? cohortPrices.reduce((a, b) => a + b, 0) / cohortPrices.length 
      : 0;
    const avgSelfPacedPrice = selfPacedPrices.length > 0 
      ? selfPacedPrices.reduce((a, b) => a + b, 0) / selfPacedPrices.length 
      : 0;

    const pricingPattern = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      currency: courses[0].currency,
      cohortMultiplier: avgSelfPacedPrice > 0 
        ? Number((avgCohortPrice / avgSelfPacedPrice).toFixed(1)) 
        : 2.5,
    };

    // Use AI to generate insights
    const aiInsights = await generateAIInsights(niche, courses, channelUrl);

    const result = {
      niche: niche,
      courseCount: courses.length,
      courses: courses,
      pricingPattern,
      trends: aiInsights.trends,
      gaps: aiInsights.gaps,
      insight: aiInsights.insight,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in niche explorer:", error);
    return NextResponse.json(
      { error: "Failed to analyze niche" },
      { status: 500 }
    );
  }
}

function generateGenericCourses(niche: string): Course[] {
  // Generate generic courses for niches not in database
  const formats: Array<"self-paced" | "cohort" | "hybrid"> = ["self-paced", "cohort", "hybrid"];
  const platforms = ["Udemy", "Gumroad", "Creator Site"];
  
  return [
    { title: `Complete ${niche} Masterclass`, platform: "Udemy", price: 3499, currency: "₹", format: "self-paced", students: 15000, rating: 4.5 },
    { title: `${niche} for Beginners`, platform: "Udemy", price: 2499, currency: "₹", format: "self-paced", students: 28000, rating: 4.4 },
    { title: `Advanced ${niche} Bootcamp`, platform: "Creator Site", price: 14999, currency: "₹", format: "cohort", students: 650, rating: 4.8 },
    { title: `Professional ${niche} Course`, platform: "Gumroad", price: 5999, currency: "₹", format: "self-paced", students: 4200, rating: 4.6 },
    { title: `${niche} Business Strategy`, platform: "Creator Site", price: 18999, currency: "₹", format: "cohort", students: 420, rating: 4.9 },
    { title: `${niche} Fundamentals`, platform: "Udemy", price: 1999, currency: "₹", format: "self-paced", students: 22000, rating: 4.3 },
  ];
}

async function generateAIInsights(niche: string, courses: Course[], channelUrl?: string) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // Fallback insights if no API key
  if (!geminiApiKey) {
    return generateFallbackInsights(niche, courses);
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const courseData = courses.map(c => 
      `${c.title} - ${c.platform} - ${c.currency}${c.price} - ${c.format} - ${c.students || 'N/A'} students`
    ).join("\n");

    const prompt = `Analyze the following online course market data for "${niche}":

${courseData}

Please provide:
1. 3-4 key market trends (e.g., pricing patterns, popular formats, demand indicators)
2. 2-3 market gaps or opportunities (e.g., underserved sub-niches, missing course types, price points)
3. One compelling insight about why competition validates this market (make it encouraging for creators)

Format your response as JSON:
{
  "trends": ["trend1", "trend2", "trend3"],
  "gaps": ["gap1", "gap2"],
  "insight": "encouraging statement about competition = validation"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        trends: parsed.trends || [],
        gaps: parsed.gaps || [],
        insight: parsed.insight || "High competition indicates proven market demand. There's room for your unique approach!",
      };
    }

    return generateFallbackInsights(niche, courses);
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return generateFallbackInsights(niche, courses);
  }
}

function generateFallbackInsights(niche: string, courses: Course[]) {
  const avgPrice = courses.reduce((sum, c) => sum + c.price, 0) / courses.length;
  const cohortCount = courses.filter(c => c.format === "cohort").length;
  const selfPacedCount = courses.filter(c => c.format === "self-paced").length;
  const totalStudents = courses.reduce((sum, c) => sum + (c.students || 0), 0);

  const trends = [
    `Most courses are priced between ₹${Math.round(avgPrice * 0.6).toLocaleString()} - ₹${Math.round(avgPrice * 1.4).toLocaleString()}`,
    `${selfPacedCount} self-paced courses vs ${cohortCount} live cohorts - ${cohortCount > selfPacedCount ? 'premium cohorts dominate' : 'self-paced learning is popular'}`,
    `Over ${totalStudents.toLocaleString()} students enrolled across all courses`,
    cohortCount > 0 ? `Live cohorts charge 2-4× more, indicating willingness to pay for interaction` : `Opportunity to create premium cohort-based offerings`,
  ];

  const gaps = [
    cohortCount === 0 ? `No advanced live cohort exists - premium opportunity` : `Room for specialized sub-niche cohorts`,
    `Beginner-friendly courses dominate - consider intermediate/advanced content`,
    `Hybrid models (self-paced + community) are underutilized`,
  ];

  const insight = `Found ${courses.length} courses in ${niche} - this is GOOD NEWS! Competition = Proven Demand. Your unique teaching style and audience connection will set you apart.`;

  return { trends, gaps, insight };
}
