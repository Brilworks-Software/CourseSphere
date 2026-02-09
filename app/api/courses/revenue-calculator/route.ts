import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface CalculateRequest {
  subscriberCount: number;
  avgViews: number;
  engagementLevel: "low" | "medium" | "high";
  coursePrice: number | null;
  emailListSize?: number | null;
  communitySize?: number | null;
}

interface RevenueScenario {
  name: string;
  conversionRate: number;
  revenue: number;
  studentCount: number;
}

interface RevenueResult {
  subscriberCount: number;
  avgViews: number;
  coursePrice: number;
  engagementLevel: string;
  emailListSize?: number;
  communitySize?: number;
  scenarios: RevenueScenario[];
  adSenseComparison: {
    monthlyAdSense: number;
    courseVsAdSenseMonths: number;
  };
  explanation: string;
  insights: string[];
  suggestedPrice?: number;
}

// Conversion rate ranges based on engagement
const CONVERSION_RATES = {
  low: {
    conservative: 0.003, // 0.3%
    realistic: 0.005, // 0.5%
    aggressive: 0.01, // 1.0%
  },
  medium: {
    conservative: 0.005, // 0.5%
    realistic: 0.007, // 0.7%
    aggressive: 0.012, // 1.2%
  },
  high: {
    conservative: 0.007, // 0.7%
    realistic: 0.01, // 1.0%
    aggressive: 0.015, // 1.5%
  },
};

// AdSense CPM ranges (per 1000 views)
const ADSENSE_CPM = {
  low: 2,
  medium: 3,
  high: 4,
};

function suggestCoursePrice(subscriberCount: number, avgViews: number): number {
  // Price suggestion based on audience size
  if (subscriberCount < 1000) return 29;
  if (subscriberCount < 5000) return 49;
  if (subscriberCount < 10000) return 79;
  if (subscriberCount < 50000) return 99;
  if (subscriberCount < 100000) return 149;
  return 197;
}

function calculateRevenue(
  avgViews: number,
  conversionRate: number,
  coursePrice: number,
  emailListSize?: number,
  communitySize?: number
): { revenue: number; studentCount: number } {
  let baseStudents = avgViews * conversionRate;

  // Boost from email list (higher conversion)
  if (emailListSize && emailListSize > 0) {
    const emailConversion = conversionRate * 2; // Email converts 2x better
    baseStudents += emailListSize * emailConversion;
  }

  // Boost from community (moderate conversion)
  if (communitySize && communitySize > 0) {
    const communityConversion = conversionRate * 1.5; // Community converts 1.5x better
    baseStudents += communitySize * communityConversion;
  }

  const studentCount = Math.floor(baseStudents);
  const revenue = studentCount * coursePrice;

  return { revenue, studentCount };
}

function calculateAdSenseRevenue(avgViews: number, engagementLevel: string): number {
  const cpm = ADSENSE_CPM[engagementLevel as keyof typeof ADSENSE_CPM] || ADSENSE_CPM.medium;
  // Assuming 4 videos per month
  const monthlyViews = avgViews * 4;
  const monthlyRevenue = (monthlyViews / 1000) * cpm;
  return Math.floor(monthlyRevenue);
}

async function generateAIExplanation(data: {
  subscriberCount: number;
  avgViews: number;
  engagementLevel: string;
  scenarios: RevenueScenario[];
  adSenseComparison: { monthlyAdSense: number; courseVsAdSenseMonths: number };
  coursePrice: number;
}): Promise<{ explanation: string; insights: string[] }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateFallbackExplanation(data);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a realistic, encouraging business advisor helping creators understand their course income potential. No hype, just honest numbers.

Creator Stats:
- ${data.subscriberCount.toLocaleString()} subscribers
- ${data.avgViews.toLocaleString()} avg views per video
- ${data.engagementLevel} engagement
- $${data.coursePrice} course price

Revenue Scenarios (based on real conversion rates):
- Conservative: ${data.scenarios[0].studentCount} students = $${data.scenarios[0].revenue.toLocaleString()}
- Realistic: ${data.scenarios[1].studentCount} students = $${data.scenarios[1].revenue.toLocaleString()}
- Aggressive: ${data.scenarios[2].studentCount} students = $${data.scenarios[2].revenue.toLocaleString()}

Current AdSense: $${data.adSenseComparison.monthlyAdSense}/month
One course = ~${data.adSenseComparison.courseVsAdSenseMonths} months of AdSense

Write a 2-3 sentence explanation in realistic, non-hype tone. Acknowledge their current position, highlight the realistic scenario, and provide genuine encouragement about course income potential.

Then provide 3-4 actionable insights as bullet points.

Return JSON only:
{
  "explanation": "2-3 sentence realistic explanation",
  "insights": ["insight 1", "insight 2", "insight 3"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return generateFallbackExplanation(data);
  } catch (error) {
    console.error("AI generation error:", error);
    return generateFallbackExplanation(data);
  }
}

function generateFallbackExplanation(data: {
  subscriberCount: number;
  avgViews: number;
  engagementLevel: string;
  scenarios: RevenueScenario[];
  adSenseComparison: { monthlyAdSense: number; courseVsAdSenseMonths: number };
  coursePrice: number;
}): { explanation: string; insights: string[] } {
  const realisticRevenue = data.scenarios[1].revenue;
  const realisticStudents = data.scenarios[1].studentCount;
  const monthlyAdSense = data.adSenseComparison.monthlyAdSense;
  const months = data.adSenseComparison.courseVsAdSenseMonths;

  let explanation = "";
  let sizeCategory = "";

  if (data.subscriberCount < 5000) {
    sizeCategory = "small but engaged";
    explanation = `With ${data.subscriberCount.toLocaleString()} subscribers, you're in the perfect position to launch your first course. At realistic conversion rates, you could make ${formatCurrency(realisticRevenue)} from ${realisticStudents} students. That's ${months} months of AdSense income from one launch—not bad for a starting creator.`;
  } else if (data.subscriberCount < 50000) {
    sizeCategory = "growing";
    explanation = `Your ${data.subscriberCount.toLocaleString()} subscriber base puts you in prime course-selling territory. With ${data.engagementLevel} engagement, you could realistically reach ${realisticStudents} students and generate ${formatCurrency(realisticRevenue)}. Compare that to your ${formatCurrency(monthlyAdSense)}/month from AdSense—one course launch equals ${months} months of passive income.`;
  } else {
    sizeCategory = "established";
    explanation = `At ${data.subscriberCount.toLocaleString()} subscribers with ${data.engagementLevel} engagement, you have serious earning potential. The realistic scenario—${realisticStudents} students at ${formatCurrency(data.coursePrice)}—would bring in ${formatCurrency(realisticRevenue)}. That's ${months}x your monthly AdSense. Time to build that course.`;
  }

  const insights = [
    `Your ${sizeCategory} audience size suggests a ${formatCurrency(data.coursePrice)} course price is appropriate`,
    `The realistic scenario (${data.scenarios[1].conversionRate}% conversion) is based on actual creator benchmarks`,
    `One successful course launch could equal ${months} months of YouTube ad revenue`,
    `Starting with a focused, valuable course to your core audience gives you the best shot at hitting realistic numbers`,
  ];

  return { explanation, insights };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function POST(request: NextRequest) {
  try {
    const body: CalculateRequest = await request.json();

    const {
      subscriberCount,
      avgViews,
      engagementLevel,
      coursePrice: inputPrice,
      emailListSize,
      communitySize,
    } = body;

    // Validation
    if (!subscriberCount || subscriberCount <= 0) {
      return NextResponse.json(
        { error: "Invalid subscriber count" },
        { status: 400 }
      );
    }

    if (!avgViews || avgViews <= 0) {
      return NextResponse.json(
        { error: "Invalid average views" },
        { status: 400 }
      );
    }

    // Determine course price
    let coursePrice = inputPrice;
    let suggestedPrice: number | undefined;

    if (!coursePrice || coursePrice <= 0) {
      coursePrice = suggestCoursePrice(subscriberCount, avgViews);
      suggestedPrice = coursePrice;
    }

    // Get conversion rates for engagement level
    const rates = CONVERSION_RATES[engagementLevel] || CONVERSION_RATES.medium;

    // Calculate scenarios
    const scenarios: RevenueScenario[] = [
      {
        name: "Conservative",
        conversionRate: rates.conservative * 100,
        ...calculateRevenue(
          avgViews,
          rates.conservative,
          coursePrice,
          emailListSize ?? undefined,
          communitySize ?? undefined
        ),
      },
      {
        name: "Realistic",
        conversionRate: rates.realistic * 100,
        ...calculateRevenue(
          avgViews,
          rates.realistic,
          coursePrice,
          emailListSize ?? undefined,
          communitySize ?? undefined
        ),
      },
      {
        name: "Aggressive",
        conversionRate: rates.aggressive * 100,
        ...calculateRevenue(
          avgViews,
          rates.aggressive,
          coursePrice,
          emailListSize ?? undefined,
          communitySize ?? undefined
        ),
      },
    ];

    // Calculate AdSense comparison
    const monthlyAdSense = calculateAdSenseRevenue(avgViews, engagementLevel);
    const realisticCourseRevenue = scenarios[1].revenue;
    const courseVsAdSenseMonths = Math.round(realisticCourseRevenue / monthlyAdSense);

    const adSenseComparison = {
      monthlyAdSense,
      courseVsAdSenseMonths,
    };

    // Generate AI explanation
    const { explanation, insights } = await generateAIExplanation({
      subscriberCount,
      avgViews,
      engagementLevel,
      scenarios,
      adSenseComparison,
      coursePrice,
    });

    const result: RevenueResult = {
      subscriberCount,
      avgViews,
      coursePrice,
      engagementLevel,
      emailListSize: emailListSize ?? undefined,
      communitySize: communitySize ?? undefined,
      scenarios,
      adSenseComparison,
      explanation,
      insights,
      suggestedPrice,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Revenue calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate revenue" },
      { status: 500 }
    );
  }
}
