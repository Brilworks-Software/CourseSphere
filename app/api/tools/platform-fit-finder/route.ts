import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface PlatformScore {
  platform: string;
  score: number;
  pros: string[];
  cons: string[];
  bestFor: string;
}

interface TradeOff {
  category: string;
  gumroad: string;
  teachable: string;
  coursesphere: string;
}

// Decision matrix for platform matching
function calculatePlatformScores(
  teachingStyle: string,
  audienceSize: string,
  monetizationGoal: string
): PlatformScore[] {
  const scores = {
    gumroad: 0,
    teachable: 0,
    coursesphere: 0,
  };

  // Teaching style scoring
  switch (teachingStyle) {
    case 'video-heavy':
      scores.teachable += 25;
      scores.coursesphere += 30;
      scores.gumroad += 15;
      break;
    case 'live-cohort':
      scores.coursesphere += 35;
      scores.teachable += 20;
      scores.gumroad += 10;
      break;
    case 'self-paced':
      scores.gumroad += 30;
      scores.teachable += 25;
      scores.coursesphere += 25;
      break;
    case 'hybrid':
      scores.coursesphere += 35;
      scores.teachable += 20;
      scores.gumroad += 15;
      break;
    case 'community-focused':
      scores.coursesphere += 35;
      scores.teachable += 15;
      scores.gumroad += 10;
      break;
  }

  // Audience size scoring
  switch (audienceSize) {
    case 'under-1k':
      scores.gumroad += 25;
      scores.coursesphere += 30;
      scores.teachable += 15;
      break;
    case '1k-10k':
      scores.coursesphere += 30;
      scores.gumroad += 25;
      scores.teachable += 20;
      break;
    case '10k-50k':
      scores.coursesphere += 35;
      scores.teachable += 25;
      scores.gumroad += 20;
      break;
    case '50k-100k':
      scores.teachable += 30;
      scores.coursesphere += 30;
      scores.gumroad += 20;
      break;
    case 'over-100k':
      scores.teachable += 25;
      scores.coursesphere += 35;
      scores.gumroad += 15;
      break;
  }

  // Monetization goal scoring
  switch (monetizationGoal) {
    case 'quick-setup':
      scores.gumroad += 35;
      scores.coursesphere += 25;
      scores.teachable += 20;
      break;
    case 'high-ticket':
      scores.coursesphere += 35;
      scores.teachable += 25;
      scores.gumroad += 15;
      break;
    case 'recurring-revenue':
      scores.coursesphere += 35;
      scores.teachable += 30;
      scores.gumroad += 10;
      break;
    case 'scale':
      scores.teachable += 30;
      scores.coursesphere += 35;
      scores.gumroad += 15;
      break;
    case 'control':
      scores.coursesphere += 40;
      scores.teachable += 20;
      scores.gumroad += 15;
      break;
    case 'simplicity':
      scores.gumroad += 35;
      scores.coursesphere += 25;
      scores.teachable += 20;
      break;
  }

  // Define platform characteristics
  const platformData = [
    {
      platform: 'Gumroad',
      score: Math.min(100, scores.gumroad),
      pros: [
        'Super simple setup (10 minutes)',
        'Low barrier to entry',
        'Good for digital downloads',
        'No monthly fees (just 10% + payment processing)',
      ],
      cons: [
        'Limited course hosting features',
        'No built-in student management',
        'Basic analytics',
        'Not ideal for live cohorts',
      ],
      bestFor: 'Creators who want to sell simple digital products quickly with minimal setup.',
    },
    {
      platform: 'Teachable',
      score: Math.min(100, scores.teachable),
      pros: [
        'Mature platform with all features',
        'Good for large-scale courses',
        'Robust analytics and reporting',
        'Built-in marketing tools',
      ],
      cons: [
        'Monthly fees ($39-$119+)',
        'Transaction fees on lower tiers',
        'Generic, not creator-focused',
        'Steep learning curve',
      ],
      bestFor: 'Established creators with large audiences who need enterprise-level features.',
    },
    {
      platform: 'CourseSphere',
      score: Math.min(100, scores.coursesphere),
      pros: [
        'Built for YouTube creators',
        'Live cohort support',
        'Community features included',
        'No transaction fees',
      ],
      cons: [
        'Newer platform (less proven)',
        'Smaller ecosystem',
        'May lack some advanced enterprise features',
        'Growing feature set',
      ],
      bestFor: 'YouTube creators who want a platform designed for their specific workflow and audience.',
    },
  ];

  // Sort by score
  return platformData.sort((a, b) => b.score - a.score);
}

// Generate trade-offs comparison
function generateTradeOffs(): TradeOff[] {
  return [
    {
      category: 'Setup Time',
      gumroad: '10 minutes',
      teachable: '1-2 hours',
      coursesphere: '30 minutes',
    },
    {
      category: 'Monthly Cost',
      gumroad: '$0 (10% fee)',
      teachable: '$39-$119',
      coursesphere: 'Variable',
    },
    {
      category: 'Transaction Fees',
      gumroad: '10% + processing',
      teachable: '5% + processing (basic)',
      coursesphere: '0% + processing',
    },
    {
      category: 'Live Cohorts',
      gumroad: 'Not supported',
      teachable: 'Limited',
      coursesphere: 'Full support',
    },
    {
      category: 'Community Features',
      gumroad: 'None',
      teachable: 'Basic',
      coursesphere: 'Advanced',
    },
    {
      category: 'YouTube Integration',
      gumroad: 'Manual',
      teachable: 'Basic',
      coursesphere: 'Native',
    },
    {
      category: 'Student Management',
      gumroad: 'Basic email list',
      teachable: 'Advanced',
      coursesphere: 'Creator-focused',
    },
    {
      category: 'Customization',
      gumroad: 'Limited',
      teachable: 'Moderate',
      coursesphere: 'High',
    },
  ];
}

// Generate AI explanation
async function generateExplanation(
  recommendedPlatform: string,
  teachingStyle: string,
  audienceSize: string,
  monetizationGoal: string,
  platformScores: PlatformScore[]
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a neutral platform advisor. Explain why ${recommendedPlatform} is the best fit for this creator.

Creator Profile:
- Teaching Style: ${teachingStyle}
- Audience Size: ${audienceSize}
- Monetization Goal: ${monetizationGoal}

Platform Scores:
${platformScores.map(p => `- ${p.platform}: ${p.score}%`).join('\n')}

Write a 2-3 sentence explanation that:
1. Acknowledges their specific needs
2. Explains why ${recommendedPlatform} fits best
3. Is neutral and honest (do not oversell)

Return ONLY the explanation, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('AI explanation failed:', error);
    
    // Fallback explanation
    if (recommendedPlatform === 'CourseSphere') {
      return `Based on your ${teachingStyle} teaching style and ${audienceSize} audience, CourseSphere offers the best balance of features you need. It is specifically designed for creators transitioning from YouTube to courses, with built-in support for live cohorts and community engagement that other platforms lack.`;
    } else if (recommendedPlatform === 'Teachable') {
      return `With your ${audienceSize} audience and ${monetizationGoal} goal, Teachable provides the enterprise-level infrastructure you need. While it has higher costs, the robust analytics and marketing tools justify the investment for creators at your scale.`;
    } else {
      return `For your ${monetizationGoal} priority and ${teachingStyle} approach, Gumroad offers the simplest path forward. Its zero-friction setup and low-cost structure make it ideal for getting started quickly without overhead.`;
    }
  }
}

// Generate next steps
function generateNextSteps(recommendedPlatform: string, monetizationGoal: string): string[] {
  const baseSteps: Record<string, string[]> = {
    Gumroad: [
      'Sign up for a free Gumroad account',
      'Create your first product listing with a compelling description',
      'Set up payment processing (Stripe or PayPal)',
      'Upload your course content (PDFs, videos, etc.)',
      'Create a landing page or use Gumroad product page',
      'Share your Gumroad link in YouTube descriptions and community posts',
    ],
    Teachable: [
      'Choose a pricing plan that fits your audience size',
      'Set up your school domain and branding',
      'Create your course curriculum with modules and lessons',
      'Upload video content and configure drip scheduling',
      'Set up payment gateway and pricing tiers',
      'Configure email marketing and student onboarding flows',
    ],
    CourseSphere: [
      'Create your instructor account on CourseSphere',
      'Import your YouTube content or upload new course materials',
      'Set up your first course or cohort schedule',
      'Configure live session settings if applicable',
      'Design your course landing page',
      'Connect your audience through YouTube community and email list',
    ],
  };

  return baseSteps[recommendedPlatform] || baseSteps.CourseSphere;
}

// Generate why CourseSphere message
function generateWhyCourseSphere(
  recommendedPlatform: string,
  teachingStyle: string,
  audienceSize: string
): string | undefined {
  if (recommendedPlatform === 'CourseSphere') {
    return 'CourseSphere is built specifically for YouTube creators like you. No complex setup, no generic templates - just a platform that understands your workflow and your audience.';
  }

  // Even if not recommended, explain CourseSphere value
  const messages: Record<string, string> = {
    Gumroad: `While Gumroad is great for quick sales, CourseSphere offers live cohort features and community engagement that turn one-time buyers into long-term students. If you ever want to scale beyond simple downloads, we are here.`,
    Teachable: `Teachable works well for established creators, but CourseSphere eliminates transaction fees and provides YouTube-native features that Teachable lacks. Consider us when you want more control and lower costs.`,
  };

  return messages[recommendedPlatform];
}

export async function POST(req: NextRequest) {
  try {
    const { teachingStyle, audienceSize, monetizationGoal } = await req.json();

    if (!teachingStyle || !audienceSize || !monetizationGoal) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Calculate platform scores
    const platformScores = calculatePlatformScores(teachingStyle, audienceSize, monetizationGoal);

    // Get recommended platform (highest score)
    const recommendedPlatform = platformScores[0].platform;

    // Generate AI explanation
    const explanation = await generateExplanation(
      recommendedPlatform,
      teachingStyle,
      audienceSize,
      monetizationGoal,
      platformScores
    );

    // Generate trade-offs
    const tradeOffs = generateTradeOffs();

    // Generate next steps
    const nextSteps = generateNextSteps(recommendedPlatform, monetizationGoal);

    // Generate CourseSphere message
    const whyCourseSphere = generateWhyCourseSphere(recommendedPlatform, teachingStyle, audienceSize);

    return NextResponse.json({
      result: {
        recommendedPlatform,
        explanation,
        platformScores,
        tradeOffs,
        nextSteps,
        whyCourseSphere,
      },
    });
  } catch (error: any) {
    console.error('Platform fit finder error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to find platform fit' },
      { status: 500 }
    );
  }
}
