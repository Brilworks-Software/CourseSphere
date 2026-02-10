import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface IncomeSource {
  id: string;
  percentage: number;
  frequency: 'monthly' | 'launch';
}

interface SourceConfig {
  label: string;
  stabilityScore: number; // 0-100
  ownership: 'owned' | 'platform' | 'brands' | 'service';
  predictability: 'high' | 'medium' | 'low';
  scalability: 'high' | 'medium' | 'low';
}

// Stability ratings for each income source
const SOURCE_CONFIGS: Record<string, SourceConfig> = {
  'adsense': {
    label: 'AdSense / Ad Revenue',
    stabilityScore: 30,
    ownership: 'platform',
    predictability: 'low',
    scalability: 'medium'
  },
  'sponsorships': {
    label: 'Brand Sponsorships',
    stabilityScore: 50,
    ownership: 'brands',
    predictability: 'medium',
    scalability: 'low'
  },
  'affiliate': {
    label: 'Affiliate Marketing',
    stabilityScore: 45,
    ownership: 'platform',
    predictability: 'medium',
    scalability: 'medium'
  },
  'courses': {
    label: 'Online Courses',
    stabilityScore: 90,
    ownership: 'owned',
    predictability: 'high',
    scalability: 'high'
  },
  'coaching': {
    label: '1-on-1 Coaching',
    stabilityScore: 75,
    ownership: 'owned',
    predictability: 'high',
    scalability: 'low'
  },
  'memberships': {
    label: 'Membership/Community',
    stabilityScore: 85,
    ownership: 'owned',
    predictability: 'high',
    scalability: 'high'
  },
  'digital-products': {
    label: 'Digital Products',
    stabilityScore: 88,
    ownership: 'owned',
    predictability: 'high',
    scalability: 'high'
  },
  'freelance': {
    label: 'Freelance/Consulting',
    stabilityScore: 60,
    ownership: 'service',
    predictability: 'medium',
    scalability: 'low'
  },
  'youtube-premium': {
    label: 'YouTube Premium Revenue',
    stabilityScore: 35,
    ownership: 'platform',
    predictability: 'low',
    scalability: 'medium'
  },
  'patreon': {
    label: 'Patreon/Ko-fi',
    stabilityScore: 70,
    ownership: 'platform',
    predictability: 'high',
    scalability: 'medium'
  }
};

function calculateStabilityScore(sources: IncomeSource[]) {
  // Factor 1: Diversification Score (0-30 points)
  const numSources = sources.length;
  let diversificationScore = 0;
  if (numSources === 1) diversificationScore = 5;
  else if (numSources === 2) diversificationScore = 12;
  else if (numSources === 3) diversificationScore = 20;
  else if (numSources >= 4) diversificationScore = 30;
  
  // Penalty for single source over 70%
  const maxPercentage = Math.max(...sources.map(s => s.percentage));
  if (maxPercentage > 70) {
    diversificationScore = Math.max(diversificationScore * 0.5, 5);
  }
  
  // Factor 2: Weighted Stability Score (0-40 points)
  const weightedStability = sources.reduce((total, source) => {
    const config = SOURCE_CONFIGS[source.id];
    if (!config) return total;
    return total + (config.stabilityScore * source.percentage / 100);
  }, 0);
  const stabilityScore = (weightedStability / 100) * 40;
  
  // Factor 3: Ownership Score (0-20 points)
  const ownedPercentage = sources.reduce((total, source) => {
    const config = SOURCE_CONFIGS[source.id];
    if (!config || config.ownership !== 'owned') return total;
    return total + source.percentage;
  }, 0);
  const ownershipScore = (ownedPercentage / 100) * 20;
  
  // Factor 4: Predictability Score (0-10 points)
  const monthlyPercentage = sources.reduce((total, source) => {
    if (source.frequency === 'monthly') return total + source.percentage;
    return total;
  }, 0);
  const predictabilityScore = (monthlyPercentage / 100) * 10;
  
  // Total Score
  const totalScore = Math.round(diversificationScore + stabilityScore + ownershipScore + predictabilityScore);
  
  // Determine rating
  let rating: "critical" | "risky" | "moderate" | "stable" | "excellent";
  if (totalScore >= 80) rating = "excellent";
  else if (totalScore >= 60) rating = "stable";
  else if (totalScore >= 40) rating = "moderate";
  else if (totalScore >= 20) rating = "risky";
  else rating = "critical";
  
  // Generate risk flags
  const riskFlags: { level: "high" | "medium" | "low"; message: string }[] = [];
  
  // Check platform dependence
  const platformPercentage = sources.reduce((total, source) => {
    const config = SOURCE_CONFIGS[source.id];
    if (!config || config.ownership !== 'platform') return total;
    return total + source.percentage;
  }, 0);
  
  if (platformPercentage > 60) {
    riskFlags.push({
      level: "high",
      message: `${platformPercentage.toFixed(0)}% of your income depends on platforms you don't control. Algorithm changes or policy updates could devastate your income overnight.`
    });
  } else if (platformPercentage > 40) {
    riskFlags.push({
      level: "medium",
      message: `${platformPercentage.toFixed(0)}% platform-dependent income. Consider diversifying into owned assets.`
    });
  }
  
  // Check brand dependence
  const brandPercentage = sources.reduce((total, source) => {
    const config = SOURCE_CONFIGS[source.id];
    if (!config || config.ownership !== 'brands') return total;
    return total + source.percentage;
  }, 0);
  
  if (brandPercentage > 50) {
    riskFlags.push({
      level: "high",
      message: `${brandPercentage.toFixed(0)}% from brand deals. When marketing budgets tighten, you're the first to get cut.`
    });
  } else if (brandPercentage > 30) {
    riskFlags.push({
      level: "medium",
      message: `${brandPercentage.toFixed(0)}% from sponsorships. Brands are fickle—build owned assets as backup.`
    });
  }
  
  // Check single source dominance
  if (maxPercentage > 70) {
    const dominantSource = sources.find(s => s.percentage === maxPercentage);
    if (dominantSource) {
      const config = SOURCE_CONFIGS[dominantSource.id];
      riskFlags.push({
        level: "high",
        message: `${maxPercentage.toFixed(0)}% from ${config.label}. You're one policy change away from losing most of your income.`
      });
    }
  }
  
  // Check lack of owned assets
  if (ownedPercentage < 20) {
    riskFlags.push({
      level: "high",
      message: "Less than 20% from owned assets. You're building someone else's platform, not your own business."
    });
  } else if (ownedPercentage < 40) {
    riskFlags.push({
      level: "medium",
      message: "Only ${ownedPercentage.toFixed(0)}% from owned assets. Increase this to build true stability."
    });
  }
  
  // Check launch-based income
  const launchPercentage = sources.reduce((total, source) => {
    if (source.frequency === 'launch') return total + source.percentage;
    return total;
  }, 0);
  
  if (launchPercentage > 60) {
    riskFlags.push({
      level: "medium",
      message: `${launchPercentage.toFixed(0)}% is launch-based. Add recurring revenue for smoother cash flow.`
    });
  }
  
  // Check diversification
  if (numSources === 1) {
    riskFlags.push({
      level: "high",
      message: "Single income stream. If this disappears, you're at zero. Diversify immediately."
    });
  } else if (numSources === 2) {
    riskFlags.push({
      level: "medium",
      message: "Only 2 income streams. Add at least one more for resilience."
    });
  }
  
  // Source analysis
  const sourceAnalysis = sources.map(source => {
    const config = SOURCE_CONFIGS[source.id];
    return {
      source: config.label,
      stability: config.stabilityScore,
      ownership: config.ownership === 'owned' ? 'You own it' : 
                 config.ownership === 'platform' ? 'Platform-dependent' :
                 config.ownership === 'brands' ? 'Brand-dependent' : 'Service-based',
      risk: config.stabilityScore >= 70 ? 'Low' :
            config.stabilityScore >= 50 ? 'Medium' : 'High'
    };
  });
  
  // Improvements
  const improvements: string[] = [];
  
  if (ownedPercentage < 50) {
    improvements.push("Launch an online course or digital product to build owned assets that compound over time");
  }
  
  if (numSources < 3) {
    improvements.push("Add at least one more income stream to protect against single-source failure");
  }
  
  if (platformPercentage > 40) {
    improvements.push("Reduce platform dependence by growing email list and owned products");
  }
  
  if (launchPercentage > 50) {
    improvements.push("Add recurring revenue (membership, subscriptions) for predictable monthly income");
  }
  
  if (maxPercentage > 60) {
    improvements.push("Diversify away from your dominant income source - it's too risky to rely on one stream");
  }
  
  if (!sources.some(s => s.id === 'courses' || s.id === 'digital-products')) {
    improvements.push("Consider creating a course or digital product - they're scalable and you own them completely");
  }
  
  return {
    score: totalScore,
    rating,
    breakdown: {
      diversification: Math.round(diversificationScore),
      predictability: Math.round(predictabilityScore * 10), // Scale to 100
      ownership: Math.round(ownershipScore * 5), // Scale to 100
      scalability: Math.round(stabilityScore * 2.5) // Scale to 100
    },
    riskFlags: riskFlags.slice(0, 5), // Top 5 risks
    sourceAnalysis,
    improvements: improvements.slice(0, 5), // Top 5 improvements
    metrics: {
      platformPercentage,
      ownedPercentage,
      brandPercentage,
      monthlyPercentage,
      launchPercentage,
      numSources,
      maxPercentage
    }
  };
}

async function generateAIInsights(
  sources: IncomeSource[],
  metrics: any
) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const sourcesList = sources.map(s => {
      const config = SOURCE_CONFIGS[s.id];
      return `${config.label}: ${s.percentage.toFixed(0)}% (${s.frequency})`;
    }).join('\n');
    
    const prompt = `You are a creator income strategist. Analyze this income breakdown:

Income Sources:
${sourcesList}

Key Metrics:
- Platform-Dependent: ${metrics.platformPercentage.toFixed(0)}%
- Owned Assets: ${metrics.ownedPercentage.toFixed(0)}%
- Brand-Dependent: ${metrics.brandPercentage.toFixed(0)}%
- Monthly/Recurring: ${metrics.monthlyPercentage.toFixed(0)}%
- Number of Streams: ${metrics.numSources}

Provide the following in a structured format:

1. SUMMARY (2 sentences): Overall assessment of their income stability and diversification.

2. PLATFORM_DEPENDENCE (2 sentences): Specific insight about how dependent they are on external platforms and what this means for their business risk.

3. RECOMMENDATION (2 sentences): Clear, actionable recommendation for improving stability. Focus on what matters most for their situation.

Format your response as:
SUMMARY: [your summary]
PLATFORM_DEPENDENCE: [your platform dependence analysis]
RECOMMENDATION: [your recommendation]`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Parse the response
    const summaryMatch = response.match(/SUMMARY:\s*(.+?)(?=PLATFORM_DEPENDENCE:|$)/s);
    const platformMatch = response.match(/PLATFORM_DEPENDENCE:\s*(.+?)(?=RECOMMENDATION:|$)/s);
    const recommendationMatch = response.match(/RECOMMENDATION:\s*(.+?)$/s);
    
    const summary = summaryMatch 
      ? summaryMatch[1].trim() 
      : getFallbackSummary(metrics);
    
    const platformDependence = platformMatch 
      ? platformMatch[1].trim() 
      : getFallbackPlatformDependence(metrics);
    
    const recommendation = recommendationMatch 
      ? recommendationMatch[1].trim() 
      : getFallbackRecommendation(metrics);
    
    return {
      summary,
      platformDependence,
      recommendation
    };
    
  } catch (error) {
    console.error('AI generation error:', error);
    
    return {
      summary: getFallbackSummary(metrics),
      platformDependence: getFallbackPlatformDependence(metrics),
      recommendation: getFallbackRecommendation(metrics)
    };
  }
}

function getFallbackSummary(metrics: any): string {
  if (metrics.ownedPercentage >= 60) {
    return `You have strong income stability with ${metrics.ownedPercentage.toFixed(0)}% from owned assets. You're building a resilient business across ${metrics.numSources} income streams.`;
  } else if (metrics.platformPercentage >= 60) {
    return `Your income is heavily platform-dependent (${metrics.platformPercentage.toFixed(0)}%). This puts you at high risk from algorithm changes and policy updates beyond your control.`;
  } else {
    return `You're building across ${metrics.numSources} income streams, but ${(100 - metrics.ownedPercentage).toFixed(0)}% depends on external parties. Shift more toward owned assets for true stability.`;
  }
}

function getFallbackPlatformDependence(metrics: any): string {
  if (metrics.platformPercentage >= 60) {
    return `Your income depends heavily on platforms you don't control. When YouTube changes its algorithm or AdSense policies shift, your income can drop overnight—and there's nothing you can do about it.`;
  } else if (metrics.platformPercentage >= 30) {
    return `${metrics.platformPercentage.toFixed(0)}% platform dependence means you're building on rented land. Platforms optimize for their business, not yours. Owned assets protect you from their changes.`;
  } else {
    return `You've wisely limited platform dependence to ${metrics.platformPercentage.toFixed(0)}%. This gives you control over your income destiny and protection from algorithm whims.`;
  }
}

function getFallbackRecommendation(metrics: any): string {
  if (metrics.ownedPercentage < 30) {
    return "Launch a course or digital product immediately. Owned assets are the foundation of creator stability—they compound over time and can't be taken away by platform changes.";
  } else if (metrics.numSources < 3) {
    return "Add at least one more income stream to reduce risk. Diversification protects you when any single source dries up, which happens more often than creators expect.";
  } else {
    return "Focus on growing your owned assets (courses, products, memberships) to 60%+ of income. This shift from platform-dependent to owned income transforms your business from fragile to antifragile.";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sources } = body;

    // Validate inputs
    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid income sources' },
        { status: 400 }
      );
    }

    // Validate each source
    for (const source of sources) {
      if (!source.id || typeof source.percentage !== 'number' || !source.frequency) {
        return NextResponse.json(
          { error: 'Invalid source data' },
          { status: 400 }
        );
      }
      
      if (!SOURCE_CONFIGS[source.id]) {
        return NextResponse.json(
          { error: `Unknown income source: ${source.id}` },
          { status: 400 }
        );
      }
    }

    // Calculate stability score
    const calculationResult = calculateStabilityScore(sources);

    // Generate AI insights
    const aiInsights = await generateAIInsights(sources, calculationResult.metrics);

    const result = {
      score: calculationResult.score,
      rating: calculationResult.rating,
      breakdown: calculationResult.breakdown,
      riskFlags: calculationResult.riskFlags,
      insights: {
        summary: aiInsights.summary,
        platformDependence: aiInsights.platformDependence,
        recommendation: aiInsights.recommendation
      },
      improvements: calculationResult.improvements,
      sourceAnalysis: calculationResult.sourceAnalysis
    };

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Income stability error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate stability score' },
      { status: 500 }
    );
  }
}
