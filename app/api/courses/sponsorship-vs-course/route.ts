import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface CompareRequest {
  sponsorshipPayout: number;
  sponsorshipFrequency: "weekly" | "biweekly" | "monthly" | "quarterly";
  coursePrice: number | null;
  audienceSize: number;
}

interface ComparisonResult {
  sponsorshipIncome: {
    perDeal: number;
    frequency: string;
    annualIncome: number;
  };
  courseIncome: {
    coursePrice: number;
    launchRevenue: number;
    monthlyRevenue: number;
    annualRevenue: number;
    studentCount: number;
  };
  comparison: {
    coursesVsSponsorships: number;
    timeToBreakEven: string;
    stabilityScore: number;
  };
  aiExplanation: string;
  insights: string[];
  keyTakeaway: string;
}

// Frequency multipliers
const FREQUENCY_MAP = {
  weekly: { perYear: 52, label: "Weekly" },
  biweekly: { perYear: 26, label: "Bi-Weekly" },
  monthly: { perYear: 12, label: "Monthly" },
  quarterly: { perYear: 4, label: "Quarterly" },
};

// Course conversion rates (realistic)
const CONVERSION_RATE = 0.007; // 0.7% realistic conversion

function suggestCoursePrice(audienceSize: number): number {
  if (audienceSize < 1000) return 29;
  if (audienceSize < 5000) return 49;
  if (audienceSize < 10000) return 79;
  if (audienceSize < 50000) return 99;
  if (audienceSize < 100000) return 149;
  return 197;
}

function calculateCourseIncome(audienceSize: number, coursePrice: number) {
  // Launch estimate (realistic conversion)
  const launchStudents = Math.floor(audienceSize * CONVERSION_RATE);
  const launchRevenue = launchStudents * coursePrice;

  // Monthly passive income (after launch, assume 10% of launch per month)
  const monthlyStudents = Math.floor(launchStudents * 0.1);
  const monthlyRevenue = monthlyStudents * coursePrice;

  // Annual = Launch + 11 months of passive income
  const annualRevenue = launchRevenue + (monthlyRevenue * 11);

  return {
    coursePrice,
    launchRevenue,
    monthlyRevenue,
    annualRevenue,
    studentCount: launchStudents,
  };
}

function calculateSponsorshipIncome(payout: number, frequency: string) {
  const frequencyData = FREQUENCY_MAP[frequency as keyof typeof FREQUENCY_MAP];
  const annualIncome = payout * frequencyData.perYear;

  return {
    perDeal: payout,
    frequency: frequencyData.label,
    annualIncome,
  };
}

async function generateAIExplanation(data: {
  sponsorshipIncome: { perDeal: number; annualIncome: number; frequency: string };
  courseIncome: { coursePrice: number; launchRevenue: number; annualRevenue: number };
  coursesVsSponsorships: number;
}): Promise<{ explanation: string; insights: string[]; keyTakeaway: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateFallbackExplanation(data);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a business advisor helping creators break free from sponsorship dependency.

Current Income Model:
- Sponsorship: $${data.sponsorshipIncome.perDeal} per deal (${data.sponsorshipIncome.frequency})
- Annual sponsorship income: $${data.sponsorshipIncome.annualIncome.toLocaleString()}

Course Alternative:
- Course price: $${data.courseIncome.coursePrice}
- Launch revenue: $${data.courseIncome.launchRevenue.toLocaleString()}
- Annual course income: $${data.courseIncome.annualRevenue.toLocaleString()}
- 1 course = ${data.coursesVsSponsorships}x sponsorship deals

Write a 2-3 sentence explanation focusing on:
1. Why courses compound while sponsorships don't
2. Control and independence from brands
3. Time investment comparison

Then provide 3-4 actionable insights about why courses win.

Finally, create a punchy one-liner takeaway like "1 course launch = X sponsorship deals".

Return JSON only:
{
  "explanation": "2-3 sentence explanation about compounding value",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "keyTakeaway": "punchy one-liner"
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
  sponsorshipIncome: { perDeal: number; annualIncome: number; frequency: string };
  courseIncome: { coursePrice: number; launchRevenue: number; annualRevenue: number };
  coursesVsSponsorships: number;
}): { explanation: string; insights: string[]; keyTakeaway: string } {
  const sponsorCount = data.coursesVsSponsorships;

  const explanation = `Sponsorships pay once and disappear—you trade time for money every single deal. A course? Build it once, sell it forever. Your ${formatCurrency(data.courseIncome.coursePrice)} course could generate ${formatCurrency(data.courseIncome.annualRevenue)} in year one, while sponsorships cap you at ${formatCurrency(data.sponsorshipIncome.annualIncome)}. Plus, you keep full control—no brand guidelines, no approval processes, just your expertise on your terms.`;

  const insights = [
    `One course launch equals ${sponsorCount} sponsorship deals—but you only build it once`,
    `Sponsorships force you to trade time for money repeatedly. Courses compound over time.`,
    `With sponsors, brands control your content. With courses, you control everything.`,
    `Course income is predictable and scalable. Sponsorships depend on brand budgets and approval.`,
  ];

  const keyTakeaway = `1 course launch = ${sponsorCount} sponsorship deals (and you own the asset)`;

  return { explanation, insights, keyTakeaway };
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
    const body: CompareRequest = await request.json();

    const {
      sponsorshipPayout,
      sponsorshipFrequency,
      coursePrice: inputPrice,
      audienceSize,
    } = body;

    // Validation
    if (!sponsorshipPayout || sponsorshipPayout <= 0) {
      return NextResponse.json(
        { error: "Invalid sponsorship payout" },
        { status: 400 }
      );
    }

    if (!audienceSize || audienceSize <= 0) {
      return NextResponse.json(
        { error: "Invalid audience size" },
        { status: 400 }
      );
    }

    // Determine course price
    const coursePrice = inputPrice && inputPrice > 0 
      ? inputPrice 
      : suggestCoursePrice(audienceSize);

    // Calculate incomes
    const sponsorshipIncome = calculateSponsorshipIncome(
      sponsorshipPayout,
      sponsorshipFrequency
    );

    const courseIncome = calculateCourseIncome(audienceSize, coursePrice);

    // Comparison metrics
    const coursesVsSponsorships = Math.round(
      courseIncome.launchRevenue / sponsorshipPayout
    );

    const timeToBreakEven = coursesVsSponsorships === 1
      ? "Immediate"
      : `${coursesVsSponsorships} sponsorships`;

    const stabilityScore = Math.min(
      Math.round((courseIncome.annualRevenue / sponsorshipIncome.annualIncome) * 100),
      100
    );

    const comparison = {
      coursesVsSponsorships,
      timeToBreakEven,
      stabilityScore,
    };

    // Generate AI explanation
    const { explanation, insights, keyTakeaway } = await generateAIExplanation({
      sponsorshipIncome,
      courseIncome,
      coursesVsSponsorships,
    });

    const result: ComparisonResult = {
      sponsorshipIncome,
      courseIncome,
      comparison,
      aiExplanation: explanation,
      insights,
      keyTakeaway,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Comparison error:", error);
    return NextResponse.json(
      { error: "Failed to compare income models" },
      { status: 500 }
    );
  }
}
