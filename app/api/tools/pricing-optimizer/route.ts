import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Pricing benchmarks database (static)
const NICHE_BENCHMARKS: Record<string, { baseMultiplier: number; avgPrice: number }> = {
  // Tech & Development
  'web development': { baseMultiplier: 1.3, avgPrice: 149 },
  'mobile development': { baseMultiplier: 1.4, avgPrice: 179 },
  'data science': { baseMultiplier: 1.6, avgPrice: 249 },
  'artificial intelligence': { baseMultiplier: 1.8, avgPrice: 299 },
  'ai': { baseMultiplier: 1.8, avgPrice: 299 },
  'machine learning': { baseMultiplier: 1.7, avgPrice: 279 },
  'programming': { baseMultiplier: 1.2, avgPrice: 129 },
  'python': { baseMultiplier: 1.3, avgPrice: 139 },
  'javascript': { baseMultiplier: 1.2, avgPrice: 129 },
  'react': { baseMultiplier: 1.3, avgPrice: 149 },
  'nodejs': { baseMultiplier: 1.3, avgPrice: 149 },
  
  // Business & Marketing
  'digital marketing': { baseMultiplier: 1.4, avgPrice: 197 },
  'social media marketing': { baseMultiplier: 1.2, avgPrice: 147 },
  'email marketing': { baseMultiplier: 1.1, avgPrice: 127 },
  'seo': { baseMultiplier: 1.3, avgPrice: 167 },
  'content marketing': { baseMultiplier: 1.2, avgPrice: 147 },
  'copywriting': { baseMultiplier: 1.3, avgPrice: 177 },
  'business': { baseMultiplier: 1.3, avgPrice: 167 },
  'entrepreneurship': { baseMultiplier: 1.4, avgPrice: 197 },
  'ecommerce': { baseMultiplier: 1.3, avgPrice: 177 },
  
  // Creative
  'photography': { baseMultiplier: 1.2, avgPrice: 147 },
  'videography': { baseMultiplier: 1.3, avgPrice: 167 },
  'graphic design': { baseMultiplier: 1.2, avgPrice: 147 },
  'video editing': { baseMultiplier: 1.2, avgPrice: 147 },
  'music production': { baseMultiplier: 1.3, avgPrice: 167 },
  'drawing': { baseMultiplier: 1.0, avgPrice: 97 },
  'painting': { baseMultiplier: 1.0, avgPrice: 97 },
  
  // Lifestyle & Personal Development
  'fitness': { baseMultiplier: 1.1, avgPrice: 127 },
  'yoga': { baseMultiplier: 1.0, avgPrice: 97 },
  'nutrition': { baseMultiplier: 1.2, avgPrice: 147 },
  'cooking': { baseMultiplier: 0.9, avgPrice: 87 },
  'personal development': { baseMultiplier: 1.3, avgPrice: 167 },
  'productivity': { baseMultiplier: 1.2, avgPrice: 147 },
  'mindfulness': { baseMultiplier: 1.1, avgPrice: 117 },
  
  // Finance & Investment
  'investing': { baseMultiplier: 1.7, avgPrice: 297 },
  'trading': { baseMultiplier: 1.8, avgPrice: 347 },
  'cryptocurrency': { baseMultiplier: 1.6, avgPrice: 247 },
  'personal finance': { baseMultiplier: 1.3, avgPrice: 167 },
  'real estate': { baseMultiplier: 1.5, avgPrice: 227 },
  
  // Default
  'default': { baseMultiplier: 1.2, avgPrice: 147 }
};

// Format multipliers
const FORMAT_MULTIPLIERS = {
  'self-paced': 1.0,
  'live-cohort': 3.0,
  'workshop': 2.0
};

// Audience level adjustments
const AUDIENCE_ADJUSTMENTS = {
  'beginner': 0.8,
  'intermediate': 1.0,
  'advanced': 1.4
};

function findNicheBenchmark(niche: string): { baseMultiplier: number; avgPrice: number } {
  const normalizedNiche = niche.toLowerCase().trim();
  
  // Try exact match first
  if (NICHE_BENCHMARKS[normalizedNiche]) {
    return NICHE_BENCHMARKS[normalizedNiche];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(NICHE_BENCHMARKS)) {
    if (normalizedNiche.includes(key) || key.includes(normalizedNiche)) {
      return value;
    }
  }
  
  // Return default
  return NICHE_BENCHMARKS['default'];
}

function calculatePricing(
  niche: string,
  audienceLevel: 'beginner' | 'intermediate' | 'advanced',
  courseFormat: 'self-paced' | 'live-cohort' | 'workshop',
  duration: number,
  durationType: 'hours' | 'weeks'
) {
  // Convert duration to hours
  const durationInHours = durationType === 'weeks' ? duration * 8 : duration;
  
  // Get niche benchmark
  const nicheBenchmark = findNicheBenchmark(niche);
  
  // Base price calculation (per hour of content)
  const baseHourlyRate = 25; // $25 per hour of content
  const basePrice = Math.max(durationInHours * baseHourlyRate, 49); // Minimum $49
  
  // Apply multipliers
  const formatMultiplier = FORMAT_MULTIPLIERS[courseFormat];
  const nicheMultiplier = nicheBenchmark.baseMultiplier;
  const audienceAdjustment = AUDIENCE_ADJUSTMENTS[audienceLevel];
  
  // Calculate confident price (recommended)
  const confidentPrice = Math.round(
    basePrice * formatMultiplier * nicheMultiplier * audienceAdjustment
  );
  
  // Calculate conservative and premium ranges
  const conservativePrice = Math.round(confidentPrice * 0.7);
  const premiumPrice = Math.round(confidentPrice * 1.5);
  
  return {
    priceRanges: {
      conservative: Math.max(conservativePrice, 29),
      confident: Math.max(confidentPrice, 49),
      premium: Math.max(premiumPrice, 99)
    },
    reasoning: {
      basePrice: Math.round(basePrice),
      formatMultiplier,
      nicheMultiplier,
      audienceAdjustment
    }
  };
}

async function generateAIInsights(
  niche: string,
  audienceLevel: string,
  courseFormat: string,
  duration: number,
  durationType: string,
  priceRanges: { conservative: number; confident: number; premium: number }
) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const formatLabel = courseFormat.replace('-', ' ');
    const prompt = `You are a course pricing expert. A creator is planning to launch a ${formatLabel} course about "${niche}" targeting ${audienceLevel}-level students. The course duration is ${duration} ${durationType}.

Based on the calculated pricing recommendations:
- Conservative: $${priceRanges.conservative}
- Confident (Recommended): $${priceRanges.confident}
- Premium: $${priceRanges.premium}

Provide the following in a structured format:

1. JUSTIFICATION (2-3 sentences): Explain why the recommended price of $${priceRanges.confident} makes sense for this audience and niche. Focus on value perception and market positioning.

2. POSITIONING (1 sentence): A powerful positioning statement they should use when marketing this course at this price point.

3. RECOMMENDATIONS (exactly 3 bullet points): Specific actionable tips to justify this pricing and increase perceived value.

Format your response as:
JUSTIFICATION: [your justification]
POSITIONING: [your positioning statement]
RECOMMENDATIONS:
- [recommendation 1]
- [recommendation 2]
- [recommendation 3]`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Parse the response
    const justificationMatch = response.match(/JUSTIFICATION:\s*(.+?)(?=POSITIONING:|$)/s);
    const positioningMatch = response.match(/POSITIONING:\s*(.+?)(?=RECOMMENDATIONS:|$)/s);
    const recommendationsMatch = response.match(/RECOMMENDATIONS:\s*(.+?)$/s);
    
    const justification = justificationMatch 
      ? justificationMatch[1].trim() 
      : `At $${priceRanges.confident}, you're positioning this ${niche} course as a serious investment in transformation, not just information. This price point attracts committed students who will actually complete the course and get results, while filtering out tire-kickers.`;
    
    const positioning = positioningMatch 
      ? positioningMatch[1].trim() 
      : `"This isn't just a ${niche} course—it's a transformation system that takes you from ${audienceLevel} to confident practitioner."`;
    
    let recommendations: string[] = [];
    if (recommendationsMatch) {
      recommendations = recommendationsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    
    // Fallback recommendations if parsing fails
    if (recommendations.length < 3) {
      recommendations = [
        `Include a clear transformation promise in your sales page`,
        `Offer a payment plan to make the ${priceRanges.confident} investment more accessible`,
        `Add social proof and case studies to justify the premium positioning`
      ];
    }
    
    return {
      justification,
      positioning,
      recommendations: recommendations.slice(0, 3)
    };
    
  } catch (error) {
    console.error('AI generation error:', error);
    
    // Fallback content if AI fails
    return {
      justification: `At $${priceRanges.confident}, you're positioning this ${niche} course as a serious investment in transformation, not just information. This price point attracts committed students who will actually complete the course and get results. ${courseFormat === 'live-cohort' ? 'Live cohort courses command premium pricing due to the real-time interaction and community value.' : ''}`,
      positioning: `Frame this as a transformation system, not just content. You're selling the outcome and the ${audienceLevel}-to-expert journey, not hours of videos.`,
      recommendations: [
        `Emphasize the transformation and outcomes rather than content volume`,
        `Include bonuses or guarantees to increase perceived value`,
        `Create urgency with limited enrollment or early-bird pricing`
      ]
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { niche, audienceLevel, courseFormat, duration, durationType } = body;

    // Validate inputs
    if (!niche || !audienceLevel || !courseFormat || !duration || !durationType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate base pricing
    const pricingData = calculatePricing(
      niche,
      audienceLevel,
      courseFormat,
      duration,
      durationType
    );

    // Generate AI insights
    const aiInsights = await generateAIInsights(
      niche,
      audienceLevel,
      courseFormat,
      duration,
      durationType,
      pricingData.priceRanges
    );

    const result = {
      ...pricingData,
      ...aiInsights
    };

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Pricing optimizer error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate pricing' },
      { status: 500 }
    );
  }
}
