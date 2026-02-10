import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface PlannerInput {
  weeklyAvailability: number;
  desiredIncome: number;
  teachingComfort: number; // 1-5 scale
  audienceSize: number;
}

function calculateCohortPlan(input: PlannerInput) {
  // Rule 1: Determine base cohort size based on weekly availability
  let baseCohortSize: number;
  let maxCohortSize: number;
  
  if (input.weeklyAvailability < 5) {
    // Very limited time - small, intimate cohort
    baseCohortSize = 12;
    maxCohortSize = 20;
  } else if (input.weeklyAvailability < 8) {
    // Moderate time - medium cohort
    baseCohortSize = 20;
    maxCohortSize = 30;
  } else if (input.weeklyAvailability < 12) {
    // Good availability - larger cohort possible
    baseCohortSize = 25;
    maxCohortSize = 40;
  } else {
    // High availability - can handle large cohort
    baseCohortSize = 30;
    maxCohortSize = 50;
  }
  
  // Rule 2: Adjust based on teaching comfort
  // Lower comfort = smaller cohort for better control
  const comfortMultiplier = 0.6 + (input.teachingComfort / 5) * 0.4; // 0.6 to 1.0
  const adjustedCohortSize = Math.round(baseCohortSize * comfortMultiplier);
  const adjustedMaxSize = Math.round(maxCohortSize * comfortMultiplier);
  
  // Rule 3: Check audience size feasibility
  // Typical cohort conversion: 2-5% of engaged audience
  const minAudienceNeeded = adjustedCohortSize * 50; // Need 50× the cohort size in audience
  const audienceFeasible = input.audienceSize >= minAudienceNeeded;
  
  // Final cohort size recommendation
  const recommendedSize = Math.max(Math.min(adjustedCohortSize, 50), 10); // Between 10-50
  const minSize = Math.max(Math.round(recommendedSize * 0.6), 8);
  const maxSize = Math.min(adjustedMaxSize, 50);
  
  // Rule 4: Calculate pricing
  // Smaller cohort = higher price (inverse relationship)
  // Base pricing tiers:
  // 10-15 students: $997-$1,997 (premium, high-touch)
  // 16-25 students: $697-$997 (mid-tier)
  // 26-40 students: $497-$697 (accessible)
  // 40+ students: $297-$497 (scale)
  
  let basePrice: number;
  let pricingTier: string;
  
  if (recommendedSize <= 15) {
    basePrice = 1200;
    pricingTier = "premium high-touch";
  } else if (recommendedSize <= 25) {
    basePrice = 850;
    pricingTier = "mid-tier";
  } else if (recommendedSize <= 35) {
    basePrice = 600;
    pricingTier = "accessible";
  } else {
    basePrice = 400;
    pricingTier = "scale";
  }
  
  // Adjust price to meet desired income
  const targetPriceForIncome = input.desiredIncome / recommendedSize;
  
  // Use whichever is higher: base pricing logic or income-driven price
  const recommendedPrice = Math.max(basePrice, Math.round(targetPriceForIncome / 50) * 50); // Round to nearest $50
  
  // Calculate revenue scenarios
  const conservativeRevenue = minSize * recommendedPrice;
  const recommendedRevenue = recommendedSize * recommendedPrice;
  const optimisticRevenue = maxSize * recommendedPrice;
  
  // Rule 5: Energy cost calculation
  // Estimate hours per student per week
  const hoursPerStudent = calculateHoursPerStudent(recommendedSize, input.weeklyAvailability);
  const totalWeeklyHours = hoursPerStudent * recommendedSize;
  
  // Determine energy level
  let energyLevel: "low" | "moderate" | "high";
  let energyIndicator: string;
  
  const utilizationRate = totalWeeklyHours / input.weeklyAvailability;
  
  if (utilizationRate < 0.7) {
    energyLevel = "low";
    energyIndicator = "Sustainable workload - you'll have energy to spare";
  } else if (utilizationRate < 0.9) {
    energyLevel = "moderate";
    energyIndicator = "Balanced workload - manageable with good systems";
  } else {
    energyLevel = "high";
    energyIndicator = "Intense workload - requires strong boundaries";
  }
  
  // Build insights
  const benefits: string[] = [];
  const warnings: string[] = [];
  
  // Benefits
  if (recommendedSize <= 20) {
    benefits.push("Intimate cohort size allows for high-touch mentoring and personalized feedback");
  }
  if (recommendedPrice >= 997) {
    benefits.push("Premium pricing attracts serious, committed students who get better results");
  }
  if (energyLevel === "low" || energyLevel === "moderate") {
    benefits.push("Workload is sustainable - you can maintain quality without burning out");
  }
  if (recommendedRevenue >= input.desiredIncome) {
    benefits.push("Revenue meets or exceeds your goal with room for no-shows");
  }
  
  // Warnings
  if (!audienceFeasible) {
    warnings.push(`Your audience size (${input.audienceSize.toLocaleString()}) might make it challenging to fill ${recommendedSize} spots. Consider building your list first.`);
  }
  if (input.teachingComfort < 3 && recommendedSize > 15) {
    warnings.push("With lower teaching confidence, consider starting with a smaller pilot cohort first");
  }
  if (energyLevel === "high") {
    warnings.push("This workload is intense. Make sure you have strong systems and boundaries in place");
  }
  if (recommendedRevenue < input.desiredIncome * 0.8) {
    warnings.push("Projected revenue is below your goal. Consider raising prices or accepting more students");
  }
  
  // Comparison data
  const comparison = [
    {
      label: "Students per instructor hour",
      value: `${(recommendedSize / input.weeklyAvailability).toFixed(1)} students`
    },
    {
      label: "Revenue per hour invested",
      value: `$${Math.round(recommendedRevenue / (input.weeklyAvailability * 4))}/hr` // Assuming 4-week cohort
    },
    {
      label: "Attention per student",
      value: `${Math.round((input.weeklyAvailability / recommendedSize) * 60)} min/week`
    },
    {
      label: "Audience conversion needed",
      value: `${((recommendedSize / input.audienceSize) * 100).toFixed(1)}%`
    }
  ];
  
  return {
    cohortSize: {
      min: minSize,
      recommended: recommendedSize,
      max: maxSize
    },
    pricing: {
      perSeat: recommendedPrice,
      reasoning: `At ${recommendedSize} students, ${pricingTier} pricing of $${recommendedPrice.toLocaleString()} balances accessibility with revenue. This positions your cohort as ${recommendedSize <= 20 ? 'a premium, high-touch experience' : 'a valuable group learning opportunity'}.`
    },
    revenue: {
      conservative: conservativeRevenue,
      recommended: recommendedRevenue,
      optimistic: optimisticRevenue
    },
    energyCost: {
      level: energyLevel,
      indicator: energyIndicator,
      hoursPerStudent,
      totalWeeklyHours
    },
    insights: {
      benefits,
      warnings
    },
    comparison,
    metrics: {
      recommendedSize,
      recommendedPrice,
      recommendedRevenue,
      audienceFeasible,
      utilizationRate
    }
  };
}

function calculateHoursPerStudent(cohortSize: number, weeklyAvailability: number): number {
  // Smaller cohorts = more time per student
  // Larger cohorts = more efficiency through group dynamics
  
  if (cohortSize <= 15) {
    return 0.5; // 30 min per student per week (high-touch)
  } else if (cohortSize <= 25) {
    return 0.3; // ~20 min per student per week
  } else if (cohortSize <= 35) {
    return 0.2; // ~12 min per student per week
  } else {
    return 0.15; // ~9 min per student per week (mostly group)
  }
}

async function generateAIInsights(
  input: PlannerInput,
  metrics: any
) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are a cohort-based course expert. A creator has these parameters:

Creator Situation:
- Weekly Availability: ${input.weeklyAvailability} hours
- Desired Income: $${input.desiredIncome.toLocaleString()}
- Teaching Comfort: ${input.teachingComfort}/5
- Audience Size: ${input.audienceSize.toLocaleString()}

Our Recommendation:
- Cohort Size: ${metrics.recommendedSize} students
- Price per Seat: $${metrics.recommendedPrice.toLocaleString()}
- Expected Revenue: $${metrics.recommendedRevenue.toLocaleString()}
- Energy Level: ${metrics.utilizationRate < 0.7 ? 'LOW' : metrics.utilizationRate < 0.9 ? 'MODERATE' : 'HIGH'}

Provide the following in a structured format:

1. REASONING (2-3 sentences): Explain why this cohort size and pricing protects their energy while maximizing outcomes. Be specific about the benefits of this particular size.

2. RECOMMENDATIONS (exactly 3 steps): Specific actions to successfully launch with this cohort size and pricing.

Format your response as:
REASONING: [your reasoning]
RECOMMENDATIONS:
- [step 1]
- [step 2]
- [step 3]`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Parse the response
    const reasoningMatch = response.match(/REASONING:\s*(.+?)(?=RECOMMENDATIONS:|$)/s);
    const recommendationsMatch = response.match(/RECOMMENDATIONS:\s*(.+?)$/s);
    
    const reasoning = reasoningMatch 
      ? reasoningMatch[1].trim() 
      : getFallbackReasoning(metrics);
    
    let recommendations: string[] = [];
    if (recommendationsMatch) {
      recommendations = recommendationsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    
    if (recommendations.length < 3) {
      recommendations = getFallbackRecommendations(metrics);
    }
    
    return {
      reasoning,
      recommendations: recommendations.slice(0, 3)
    };
    
  } catch (error) {
    console.error('AI generation error:', error);
    
    return {
      reasoning: getFallbackReasoning(metrics),
      recommendations: getFallbackRecommendations(metrics)
    };
  }
}

function getFallbackReasoning(metrics: any): string {
  const sizeDescriptor = metrics.recommendedSize <= 15 ? "intimate" : metrics.recommendedSize <= 25 ? "manageable" : "scalable";
  return `This ${sizeDescriptor} cohort of ${metrics.recommendedSize} students at $${metrics.recommendedPrice.toLocaleString()} per seat protects your energy while maximizing student outcomes. You'll have ${Math.round((60 * metrics.utilizationRate * 100) / 60)} minutes per student weekly, enough for meaningful interactions without burning out. The pricing reflects the transformation value you provide, not just information access.`;
}

function getFallbackRecommendations(metrics: any): string[] {
  return [
    `Launch with early-bird pricing of $${Math.round(metrics.recommendedPrice * 0.85)} for the first ${Math.round(metrics.recommendedSize * 0.4)} spots to build momentum`,
    `Cap enrollment at ${metrics.recommendedSize} students to maintain the quality and energy you can sustain`,
    `Set clear expectations: students get transformation, not just access. This justifies your premium positioning.`
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weeklyAvailability, desiredIncome, teachingComfort, audienceSize } = body;

    // Validate inputs
    if (
      weeklyAvailability === undefined || weeklyAvailability === null ||
      desiredIncome === undefined || desiredIncome === null ||
      teachingComfort === undefined || teachingComfort === null ||
      audienceSize === undefined || audienceSize === null
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate types and ranges
    if (
      typeof weeklyAvailability !== 'number' || weeklyAvailability <= 0 ||
      typeof desiredIncome !== 'number' || desiredIncome < 0 ||
      typeof teachingComfort !== 'number' || teachingComfort < 1 || teachingComfort > 5 ||
      typeof audienceSize !== 'number' || audienceSize < 0
    ) {
      return NextResponse.json(
        { error: 'Invalid input values' },
        { status: 400 }
      );
    }

    const input: PlannerInput = {
      weeklyAvailability,
      desiredIncome,
      teachingComfort,
      audienceSize
    };

    // Calculate base plan
    const calculationResult = calculateCohortPlan(input);

    // Generate AI insights
    const aiInsights = await generateAIInsights(input, calculationResult.metrics);

    const result = {
      cohortSize: calculationResult.cohortSize,
      pricing: calculationResult.pricing,
      revenue: calculationResult.revenue,
      energyCost: calculationResult.energyCost,
      insights: {
        reasoning: aiInsights.reasoning,
        benefits: calculationResult.insights.benefits,
        warnings: calculationResult.insights.warnings
      },
      recommendations: aiInsights.recommendations,
      comparison: calculationResult.comparison
    };

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Cohort size planner error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate plan' },
      { status: 500 }
    );
  }
}
