import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface DecisionFactors {
  timeAvailability: number;
  audienceSize: number;
  teachingConfidence: number;
  revenueGoal: number;
}

function calculateRecommendation(factors: DecisionFactors) {
  let cohortScore = 0;
  let selfPacedScore = 0;
  const strengths: string[] = [];
  const concerns: string[] = [];

  // Factor 1: Audience Size
  // Small audience benefits more from cohorts (high-touch, premium pricing)
  if (factors.audienceSize < 1000) {
    cohortScore += 30;
    selfPacedScore += 10;
    strengths.push("Your smaller audience is perfect for an intimate, high-value cohort experience");
  } else if (factors.audienceSize < 5000) {
    cohortScore += 25;
    selfPacedScore += 20;
  } else if (factors.audienceSize < 20000) {
    cohortScore += 20;
    selfPacedScore += 30;
  } else {
    cohortScore += 10;
    selfPacedScore += 35;
    strengths.push("Your large audience gives you great scale potential with self-paced");
  }

  // Factor 2: Time Availability
  // Cohorts require more consistent time commitment (4-8 hours/week minimum)
  if (factors.timeAvailability >= 15) {
    cohortScore += 30;
    selfPacedScore += 25;
    strengths.push("You have enough time to run live sessions and provide cohort support");
  } else if (factors.timeAvailability >= 8) {
    cohortScore += 25;
    selfPacedScore += 20;
  } else if (factors.timeAvailability >= 5) {
    cohortScore += 15;
    selfPacedScore += 30;
    concerns.push("Limited time might make live sessions challenging - consider recorded content");
  } else {
    cohortScore += 5;
    selfPacedScore += 35;
    strengths.push("Self-paced fits your time constraints - create once, sell repeatedly");
    concerns.push("With limited time, a cohort would be very demanding");
  }

  // Factor 3: Teaching Confidence
  // Higher confidence = better cohort experience
  if (factors.teachingConfidence >= 7) {
    cohortScore += 25;
    selfPacedScore += 15;
    strengths.push("Your teaching confidence will shine in live sessions");
  } else if (factors.teachingConfidence >= 5) {
    cohortScore += 15;
    selfPacedScore += 20;
  } else if (factors.teachingConfidence >= 3) {
    cohortScore += 10;
    selfPacedScore += 25;
    concerns.push("You might feel more comfortable with pre-recorded content you can edit");
  } else {
    cohortScore += 5;
    selfPacedScore += 30;
    strengths.push("Self-paced lets you perfect your content without live pressure");
    concerns.push("Live teaching might be stressful - start with recorded content");
  }

  // Factor 4: Revenue Goal
  // Cohorts can charge 2-4x more but with fewer students
  const revenuePerStudentCohort = 997; // Average cohort pricing
  const revenuePerStudentSelfPaced = 297; // Average self-paced pricing
  
  const studentsNeededCohort = Math.ceil(factors.revenueGoal / revenuePerStudentCohort);
  const studentsNeededSelfPaced = Math.ceil(factors.revenueGoal / revenuePerStudentSelfPaced);
  
  // Can they realistically get enough students from their audience?
  const conversionRateCohort = 0.02; // 2% for cohort (more commitment required)
  const conversionRateSelfPaced = 0.03; // 3% for self-paced
  
  const potentialStudentsCohort = factors.audienceSize * conversionRateCohort;
  const potentialStudentsSelfPaced = factors.audienceSize * conversionRateSelfPaced;
  
  if (potentialStudentsCohort >= studentsNeededCohort) {
    cohortScore += 15;
    selfPacedScore += 10;
  } else {
    cohortScore += 5;
    selfPacedScore += 15;
    if (potentialStudentsSelfPaced >= studentsNeededSelfPaced) {
      strengths.push("Self-paced pricing makes your revenue goal more achievable");
    }
  }

  // Additional scoring for revenue alignment
  if (factors.revenueGoal < 5000) {
    // Small goal - either works
    cohortScore += 10;
    selfPacedScore += 10;
  } else if (factors.revenueGoal < 20000) {
    // Medium goal - cohort's premium pricing helps
    cohortScore += 15;
    selfPacedScore += 10;
  } else {
    // Large goal - need scale
    cohortScore += 10;
    selfPacedScore += 20;
    if (factors.audienceSize < 5000) {
      concerns.push("Your revenue goal is ambitious for your current audience size");
    }
  }

  // Calculate percentages and confidence
  const totalScore = cohortScore + selfPacedScore;
  const cohortPercentage = Math.round((cohortScore / totalScore) * 100);
  const selfPacedPercentage = Math.round((selfPacedScore / totalScore) * 100);
  
  const scoreDifference = Math.abs(cohortScore - selfPacedScore);
  let confidence = 0;
  if (scoreDifference >= 30) confidence = 90;
  else if (scoreDifference >= 20) confidence = 80;
  else if (scoreDifference >= 15) confidence = 75;
  else if (scoreDifference >= 10) confidence = 70;
  else confidence = 65;

  // Determine recommendation
  let recommendation: "cohort" | "self-paced" | "hybrid";
  if (scoreDifference < 10) {
    recommendation = "hybrid";
    strengths.push("You're in a great position to try a hybrid approach");
  } else if (cohortScore > selfPacedScore) {
    recommendation = "cohort";
  } else {
    recommendation = "self-paced";
  }

  // Build comparison matrix
  const comparisonMatrix = {
    timeCommitment: {
      cohort: `${Math.max(8, Math.ceil(factors.timeAvailability * 0.8))} hrs/week during cohort`,
      selfPaced: `${Math.max(20, Math.ceil(factors.timeAvailability * 4))} hrs upfront, then minimal`,
      winner: factors.timeAvailability >= 10 ? 'cohort' : 'self-paced'
    },
    revenuePerStudent: {
      cohort: "$497-$1,997",
      selfPaced: "$97-$497",
      winner: 'cohort'
    },
    scalability: {
      cohort: "20-50 students max per cohort",
      selfPaced: "Unlimited students",
      winner: 'self-paced'
    },
    studentResults: {
      cohort: "85%+ completion with accountability",
      selfPaced: "15-30% completion typical",
      winner: 'cohort'
    },
    upfrontWork: {
      cohort: "Minimal - teach live, record later",
      selfPaced: "Heavy - all content upfront",
      winner: 'cohort'
    }
  };

  return {
    recommendation,
    confidence,
    score: {
      cohortScore,
      selfPacedScore
    },
    reasoning: {
      strengths: strengths.slice(0, 3), // Top 3 strengths
      concerns: concerns.slice(0, 2)     // Top 2 concerns
    },
    comparisonMatrix,
    metrics: {
      studentsNeededCohort,
      studentsNeededSelfPaced,
      potentialStudentsCohort: Math.round(potentialStudentsCohort),
      potentialStudentsSelfPaced: Math.round(potentialStudentsSelfPaced)
    }
  };
}

async function generateAIInsights(
  factors: DecisionFactors,
  recommendation: string,
  metrics: any
) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are a course launch expert. A creator has the following situation:

- Time Available: ${factors.timeAvailability} hours/week
- Audience Size: ${factors.audienceSize.toLocaleString()}
- Teaching Confidence: ${factors.teachingConfidence}/10
- Revenue Goal: $${factors.revenueGoal.toLocaleString()}

Our recommendation engine suggests: ${recommendation === 'cohort' ? 'LIVE COHORT' : recommendation === 'self-paced' ? 'SELF-PACED COURSE' : 'HYBRID APPROACH'}

Provide the following in a structured format:

1. EXPLANATION (3-4 sentences): Explain why this recommendation makes sense. Include reassurance and common success patterns. Be encouraging but realistic.

2. NEXT_STEPS (exactly 3 steps): Specific, actionable steps to launch this format successfully.

3. PRO_TIP (2 sentences): An insider tip about this format that most creators don't know.

Format your response as:
EXPLANATION: [your explanation]
NEXT_STEPS:
- [step 1]
- [step 2]
- [step 3]
PRO_TIP: [your pro tip]`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Parse the response
    const explanationMatch = response.match(/EXPLANATION:\s*(.+?)(?=NEXT_STEPS:|$)/s);
    const nextStepsMatch = response.match(/NEXT_STEPS:\s*(.+?)(?=PRO_TIP:|$)/s);
    const proTipMatch = response.match(/PRO_TIP:\s*(.+?)$/s);
    
    const explanation = explanationMatch 
      ? explanationMatch[1].trim() 
      : getFallbackExplanation(recommendation, factors);
    
    let nextSteps: string[] = [];
    if (nextStepsMatch) {
      nextSteps = nextStepsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    
    if (nextSteps.length < 3) {
      nextSteps = getFallbackNextSteps(recommendation);
    }
    
    const proTip = proTipMatch 
      ? proTipMatch[1].trim() 
      : getFallbackProTip(recommendation);
    
    return {
      explanation,
      nextSteps: nextSteps.slice(0, 3),
      proTip
    };
    
  } catch (error) {
    console.error('AI generation error:', error);
    
    return {
      explanation: getFallbackExplanation(recommendation, factors),
      nextSteps: getFallbackNextSteps(recommendation),
      proTip: getFallbackProTip(recommendation)
    };
  }
}

function getFallbackExplanation(recommendation: string, factors: DecisionFactors): string {
  if (recommendation === 'cohort') {
    return `A live cohort is perfect for your situation. With ${factors.timeAvailability} hours per week, you can run engaging live sessions. Your audience size of ${factors.audienceSize.toLocaleString()} is ideal for a cohort - small enough to be intimate, yet large enough to hit your revenue goals with premium pricing. Many successful creators start with cohorts to validate their content, then convert recordings into self-paced courses later.`;
  } else if (recommendation === 'self-paced') {
    return `A self-paced course makes the most sense for you right now. With your available time and audience size, you can create quality content once and sell it repeatedly. Self-paced courses give you the flexibility to work around your schedule while building passive income. Plus, you can always add live elements or upgrade to cohorts later once you validate demand.`;
  } else {
    return `A hybrid approach gives you the best of both worlds. Start with a small pilot cohort (10-20 students) to validate your content and gather testimonials. Record everything, then package it as a self-paced course. This way, you get the premium pricing and student results of cohorts, plus the scalability of self-paced. It's the smart way to de-risk your launch.`;
  }
}

function getFallbackNextSteps(recommendation: string): string[] {
  if (recommendation === 'cohort') {
    return [
      "Set a cohort start date 4-6 weeks out and open enrollment with early-bird pricing",
      "Map out 4-6 weekly topics and plan your live session format (teaching + Q&A)",
      "Set up a simple community platform (Discord/Circle) for student interaction between sessions"
    ];
  } else if (recommendation === 'self-paced') {
    return [
      "Outline your course modules and create a detailed content roadmap",
      "Record your first module completely before launching to validate quality",
      "Set up your course platform and create a compelling sales page with clear outcomes"
    ];
  } else {
    return [
      "Plan a small pilot cohort (10-20 students max) with the understanding you'll record everything",
      "Price it between cohort and self-paced ($297-$497) as a 'founding member' offer",
      "After the cohort, polish the recordings and launch as self-paced to your full audience"
    ];
  }
}

function getFallbackProTip(recommendation: string): string {
  if (recommendation === 'cohort') {
    return "Most successful cohort creators don't create any content upfront. They teach live, let students ask questions, and record everything. This 'just-in-time' content creation saves time and ensures you're teaching exactly what students need.";
  } else if (recommendation === 'self-paced') {
    return "Don't try to create the perfect course upfront. Launch with 60% of the content ready, then release modules weekly. This creates momentum, gives you feedback, and prevents months of work on something that might not sell.";
  } else {
    return "The hybrid 'cohort-to-evergreen' model is how most six-figure course creators operate. Run 2-3 cohorts per year for premium income, and sell self-paced in between. You get both recurring launches and passive sales.";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timeAvailability, audienceSize, teachingConfidence, revenueGoal } = body;

    // Validate inputs
    if (
      timeAvailability === undefined || timeAvailability === null ||
      audienceSize === undefined || audienceSize === null ||
      teachingConfidence === undefined || teachingConfidence === null ||
      revenueGoal === undefined || revenueGoal === null
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate types and ranges
    if (
      typeof timeAvailability !== 'number' || timeAvailability < 0 ||
      typeof audienceSize !== 'number' || audienceSize < 0 ||
      typeof teachingConfidence !== 'number' || teachingConfidence < 1 || teachingConfidence > 10 ||
      typeof revenueGoal !== 'number' || revenueGoal < 0
    ) {
      return NextResponse.json(
        { error: 'Invalid input values' },
        { status: 400 }
      );
    }

    const factors: DecisionFactors = {
      timeAvailability,
      audienceSize,
      teachingConfidence,
      revenueGoal
    };

    // Calculate base recommendation
    const calculationResult = calculateRecommendation(factors);

    // Generate AI insights
    const aiInsights = await generateAIInsights(
      factors,
      calculationResult.recommendation,
      calculationResult.metrics
    );

    const result = {
      recommendation: calculationResult.recommendation,
      confidence: calculationResult.confidence,
      score: calculationResult.score,
      reasoning: calculationResult.reasoning,
      comparisonMatrix: calculationResult.comparisonMatrix,
      ...aiInsights
    };

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Cohort recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendation' },
      { status: 500 }
    );
  }
}
