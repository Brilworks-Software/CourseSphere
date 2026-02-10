import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface WorkshopInput {
  duration: number;
  ticketPrice: number;
  attendance: number;
  prepTime: number;
  pastWebinarAttendance?: number;
}

// Static benchmarks
const BENCHMARKS = {
  averageSponsorshipDeal: 500, // $500 per sponsorship
  averageCoachingRate: 200, // $200 per hour of coaching
  averageHourlyJob: 50, // $50/hr for comparison
  showUpRate: 0.65, // 65% of registrants typically show up
};

function calculateROI(input: WorkshopInput) {
  // Calculate total time invested
  const totalTime = input.prepTime + input.duration;
  
  // Calculate revenue
  const grossRevenue = input.ticketPrice * input.attendance;
  const revenuePerStudent = input.ticketPrice;
  const effectiveHourlyRate = grossRevenue / totalTime;
  
  // Calculate comparisons
  const sponsorshipsEquivalent = Math.round(grossRevenue / BENCHMARKS.averageSponsorshipDeal * 10) / 10;
  const coachingCallsEquivalent = Math.round(totalTime * effectiveHourlyRate / BENCHMARKS.averageCoachingRate);
  const hourlyJobMultiplier = Math.round(effectiveHourlyRate / BENCHMARKS.averageHourlyJob * 10) / 10;
  
  // Build confidence factors
  const confidenceFactors: { label: string; value: string; isPositive: boolean }[] = [];
  
  // Factor 1: Effective hourly rate
  if (effectiveHourlyRate >= 200) {
    confidenceFactors.push({
      label: "Excellent Hourly Rate",
      value: `$${Math.round(effectiveHourlyRate)}/hr`,
      isPositive: true
    });
  } else if (effectiveHourlyRate >= 100) {
    confidenceFactors.push({
      label: "Strong Hourly Rate",
      value: `$${Math.round(effectiveHourlyRate)}/hr`,
      isPositive: true
    });
  } else if (effectiveHourlyRate >= 50) {
    confidenceFactors.push({
      label: "Moderate Hourly Rate",
      value: `$${Math.round(effectiveHourlyRate)}/hr`,
      isPositive: true
    });
  } else {
    confidenceFactors.push({
      label: "Low Hourly Rate",
      value: `$${Math.round(effectiveHourlyRate)}/hr`,
      isPositive: false
    });
  }
  
  // Factor 2: Attendance vs past performance
  if (input.pastWebinarAttendance) {
    const attendanceRatio = input.attendance / input.pastWebinarAttendance;
    if (attendanceRatio >= 0.8) {
      confidenceFactors.push({
        label: "Realistic Attendance Goal",
        value: `${Math.round(attendanceRatio * 100)}% of past`,
        isPositive: true
      });
    } else if (attendanceRatio >= 0.5) {
      confidenceFactors.push({
        label: "Conservative Estimate",
        value: `${Math.round(attendanceRatio * 100)}% of past`,
        isPositive: true
      });
    } else {
      confidenceFactors.push({
        label: "Optimistic Projection",
        value: `${Math.round(attendanceRatio * 100)}% of past`,
        isPositive: false
      });
    }
  }
  
  // Factor 3: Prep efficiency
  const prepRatio = input.prepTime / input.duration;
  if (prepRatio <= 2) {
    confidenceFactors.push({
      label: "Efficient Prep Time",
      value: `${prepRatio.toFixed(1)}:1 ratio`,
      isPositive: true
    });
  } else if (prepRatio <= 4) {
    confidenceFactors.push({
      label: "Moderate Prep Time",
      value: `${prepRatio.toFixed(1)}:1 ratio`,
      isPositive: true
    });
  } else {
    confidenceFactors.push({
      label: "Heavy Prep Time",
      value: `${prepRatio.toFixed(1)}:1 ratio`,
      isPositive: false
    });
  }
  
  // Factor 4: Price positioning
  if (input.ticketPrice >= 97) {
    confidenceFactors.push({
      label: "Premium Pricing",
      value: `$${input.ticketPrice} ticket`,
      isPositive: true
    });
  } else if (input.ticketPrice >= 47) {
    confidenceFactors.push({
      label: "Market-Rate Pricing",
      value: `$${input.ticketPrice} ticket`,
      isPositive: true
    });
  } else {
    confidenceFactors.push({
      label: "Low-Barrier Entry",
      value: `$${input.ticketPrice} ticket`,
      isPositive: true
    });
  }
  
  // Factor 5: Group size
  if (input.attendance >= 30) {
    confidenceFactors.push({
      label: "Strong Attendance",
      value: `${input.attendance} students`,
      isPositive: true
    });
  } else if (input.attendance >= 15) {
    confidenceFactors.push({
      label: "Solid Group Size",
      value: `${input.attendance} students`,
      isPositive: true
    });
  } else if (input.attendance >= 10) {
    confidenceFactors.push({
      label: "Intimate Workshop",
      value: `${input.attendance} students`,
      isPositive: true
    });
  } else {
    confidenceFactors.push({
      label: "Very Small Group",
      value: `${input.attendance} students`,
      isPositive: false
    });
  }
  
  return {
    revenue: {
      gross: grossRevenue,
      perStudent: revenuePerStudent,
      effectiveHourly: effectiveHourlyRate
    },
    comparisons: {
      sponsorships: {
        equivalent: sponsorshipsEquivalent,
        description: `This workshop earns as much as ${sponsorshipsEquivalent} sponsorship deals, with zero brand negotiations or approval delays.`
      },
      coachingCalls: {
        equivalent: coachingCallsEquivalent,
        description: `Equivalent to ${coachingCallsEquivalent} one-on-one coaching calls, but teaching ${input.attendance} people at once.`
      },
      hourlyJob: {
        equivalent: hourlyJobMultiplier,
        description: `Your effective rate is ${hourlyJobMultiplier}× higher than a $${BENCHMARKS.averageHourlyJob}/hr job.`
      }
    },
    breakdown: {
      totalTime,
      prepTime: input.prepTime,
      deliveryTime: input.duration,
      revenuePerHour: effectiveHourlyRate
    },
    confidenceFactors,
    metrics: {
      grossRevenue,
      effectiveHourlyRate,
      sponsorshipsEquivalent,
      totalTime
    }
  };
}

async function generateAIInsights(
  input: WorkshopInput,
  metrics: any
) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are a workshop business strategist. A creator is considering running a live workshop with these details:

Workshop Details:
- Duration: ${input.duration} hours
- Ticket Price: $${input.ticketPrice}
- Expected Attendance: ${input.attendance} people
- Prep Time: ${input.prepTime} hours
- Total Revenue: $${metrics.grossRevenue}
- Effective Hourly Rate: $${Math.round(metrics.effectiveHourlyRate)}/hr
- Equivalent to ${metrics.sponsorshipsEquivalent} sponsorships

Provide the following in a structured format:

1. NARRATIVE (2-3 sentences): A compelling insight comparing this workshop to other income streams (sponsorships, one-off coaching, etc.). Make it specific and confidence-building.

2. RISK_ASSESSMENT (2 sentences): Explain why workshops are low-risk validation tools. Mention the ability to test demand, get feedback, and convert to evergreen content.

3. RECOMMENDATION (2 sentences): Clear recommendation on whether they should do it and how to maximize success.

4. NEXT_STEPS (exactly 3 steps): Specific, actionable steps to launch this workshop successfully.

Format your response as:
NARRATIVE: [your narrative]
RISK_ASSESSMENT: [your risk assessment]
RECOMMENDATION: [your recommendation]
NEXT_STEPS:
- [step 1]
- [step 2]
- [step 3]`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Parse the response
    const narrativeMatch = response.match(/NARRATIVE:\s*(.+?)(?=RISK_ASSESSMENT:|$)/s);
    const riskMatch = response.match(/RISK_ASSESSMENT:\s*(.+?)(?=RECOMMENDATION:|$)/s);
    const recommendationMatch = response.match(/RECOMMENDATION:\s*(.+?)(?=NEXT_STEPS:|$)/s);
    const nextStepsMatch = response.match(/NEXT_STEPS:\s*(.+?)$/s);
    
    const narrative = narrativeMatch 
      ? narrativeMatch[1].trim() 
      : getFallbackNarrative(metrics);
    
    const riskAssessment = riskMatch 
      ? riskMatch[1].trim() 
      : "Workshops are low-risk because you validate demand before building a full course. You get paid to test your content, gather testimonials, and see what resonates—all while recording for future use.";
    
    const recommendation = recommendationMatch 
      ? recommendationMatch[1].trim() 
      : getFallbackRecommendation(metrics);
    
    let nextSteps: string[] = [];
    if (nextStepsMatch) {
      nextSteps = nextStepsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    
    if (nextSteps.length < 3) {
      nextSteps = getFallbackNextSteps(input);
    }
    
    return {
      narrative,
      riskAssessment,
      recommendation,
      nextSteps: nextSteps.slice(0, 3)
    };
    
  } catch (error) {
    console.error('AI generation error:', error);
    
    return {
      narrative: getFallbackNarrative(metrics),
      riskAssessment: "Workshops are low-risk because you validate demand before building a full course. You get paid to test your content, gather testimonials, and see what resonates—all while recording for future use.",
      recommendation: getFallbackRecommendation(metrics),
      nextSteps: getFallbackNextSteps(input)
    };
  }
}

function getFallbackNarrative(metrics: any): string {
  const sponsorshipText = metrics.sponsorshipsEquivalent >= 2 
    ? `more than ${Math.floor(metrics.sponsorshipsEquivalent)} sponsorship deals` 
    : 'more than a typical sponsorship';
    
  return `This workshop generates $${metrics.grossRevenue.toLocaleString()} in ${metrics.totalTime} hours—earning ${sponsorshipText} with zero brand coordination. At $${Math.round(metrics.effectiveHourlyRate)}/hr effective rate, you're building your business on your terms, not a brand's timeline.`;
}

function getFallbackRecommendation(metrics: any): string {
  if (metrics.effectiveHourlyRate >= 150) {
    return "Absolutely do this workshop. Your numbers show strong ROI and this is an excellent way to validate your content before investing in a full course. Record everything and you'll have evergreen content to sell.";
  } else if (metrics.effectiveHourlyRate >= 75) {
    return "This workshop makes sense financially and gives you low-risk validation. Launch it, gather testimonials, and use the recordings as the foundation for a larger course offering.";
  } else {
    return "Consider raising your ticket price or reducing prep time to improve ROI. Workshops should pay you well for validation work. Aim for $100+/hr effective rate by streamlining your prep process.";
  }
}

function getFallbackNextSteps(input: WorkshopInput): string[] {
  return [
    `Create a simple landing page with your workshop topic, ${input.duration}-hour duration, and $${input.ticketPrice} early-bird price`,
    `Announce to your audience with a specific date 2-3 weeks out, emphasizing the live interaction and limited spots`,
    `Set up recording software and plan to convert this workshop into a mini-course if it sells well`
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { duration, ticketPrice, attendance, prepTime, pastWebinarAttendance } = body;

    // Validate inputs
    if (
      duration === undefined || duration === null ||
      ticketPrice === undefined || ticketPrice === null ||
      attendance === undefined || attendance === null ||
      prepTime === undefined || prepTime === null
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate types and ranges
    if (
      typeof duration !== 'number' || duration <= 0 ||
      typeof ticketPrice !== 'number' || ticketPrice < 0 ||
      typeof attendance !== 'number' || attendance < 1 ||
      typeof prepTime !== 'number' || prepTime < 0
    ) {
      return NextResponse.json(
        { error: 'Invalid input values' },
        { status: 400 }
      );
    }

    const input: WorkshopInput = {
      duration,
      ticketPrice,
      attendance,
      prepTime,
      pastWebinarAttendance
    };

    // Calculate base ROI
    const calculationResult = calculateROI(input);

    // Generate AI insights
    const aiInsights = await generateAIInsights(input, calculationResult.metrics);

    const result = {
      revenue: calculationResult.revenue,
      comparisons: calculationResult.comparisons,
      breakdown: calculationResult.breakdown,
      confidenceFactors: calculationResult.confidenceFactors,
      insights: {
        narrative: aiInsights.narrative,
        riskAssessment: aiInsights.riskAssessment,
        recommendation: aiInsights.recommendation
      },
      nextSteps: aiInsights.nextSteps
    };

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Workshop ROI error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate ROI' },
      { status: 500 }
    );
  }
}
