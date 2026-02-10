import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FileText, DollarSign, MessageSquare, Video, Clock } from 'lucide-react';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ChecklistRequest {
  cohortSize: number;
  duration: '2-weeks' | '4-weeks' | '8-weeks' | '12-weeks';
  tools: string[];
}

interface ChecklistItem {
  id: string;
  task: string;
  priority: 'critical' | 'important' | 'recommended';
  completed: boolean;
  riskWarning?: string;
}

interface ChecklistCategory {
  category: string;
  icon: string;
  items: ChecklistItem[];
}

interface ChecklistResult {
  cohortSize: number;
  duration: string;
  tools: string[];
  checklist: ChecklistCategory[];
  riskWarnings: string[];
  priorityInsights: string;
  readinessScore: number;
}

// Generate base checklist based on user inputs
function generateBaseChecklist(req: ChecklistRequest): ChecklistResult {
  const { cohortSize, duration, tools } = req;

  const hasPaymentTool = tools.some((t) => ['Stripe', 'PayPal', 'Gumroad'].includes(t));
  const hasVideoTool = tools.some((t) => ['Zoom', 'Google Meet'].includes(t));
  const hasEmailTool = tools.some((t) => ['ConvertKit', 'Mailchimp'].includes(t));
  const hasCommunityTool = tools.some((t) => ['Discord', 'Slack'].includes(t));
  const hasContentTool = tools.some((t) => ['Notion', 'Google Drive', 'Loom'].includes(t));

  const isSmallCohort = cohortSize <= 15;
  const isMediumCohort = cohortSize > 15 && cohortSize <= 30;
  const isLargeCohort = cohortSize > 30;

  const durationWeeks = parseInt(duration.split('-')[0]);

  // Content Readiness
  const contentItems: ChecklistItem[] = [
    {
      id: 'content-1',
      task: `Create week-by-week curriculum outline for ${durationWeeks} weeks`,
      priority: 'critical',
      completed: false,
      riskWarning: 'Most creators wing it - do not do this',
    },
    {
      id: 'content-2',
      task: 'Prepare slide decks or teaching materials for first 2 sessions',
      priority: 'critical',
      completed: false,
    },
    {
      id: 'content-3',
      task: 'Record backup videos in case you cannot go live',
      priority: 'important',
      completed: false,
      riskWarning: 'Life happens - have backup content ready',
    },
    {
      id: 'content-4',
      task: 'Create student workbook or resources document',
      priority: isSmallCohort ? 'recommended' : 'important',
      completed: false,
    },
  ];

  if (hasContentTool) {
    contentItems.push({
      id: 'content-5',
      task: `Set up content repository in ${tools.find((t) => ['Notion', 'Google Drive'].includes(t)) || 'your tool'}`,
      priority: 'important',
      completed: false,
    });
  }

  if (durationWeeks >= 8) {
    contentItems.push({
      id: 'content-6',
      task: 'Plan mid-cohort check-in or feedback session',
      priority: 'recommended',
      completed: false,
    });
  }

  // Payment & Admin Setup
  const paymentItems: ChecklistItem[] = [];

  if (hasPaymentTool) {
    const paymentTool = tools.find((t) => ['Stripe', 'PayPal', 'Gumroad'].includes(t));
    paymentItems.push({
      id: 'payment-1',
      task: `Test ${paymentTool} checkout flow end-to-end`,
      priority: 'critical',
      completed: false,
      riskWarning: 'Broken checkout = lost sales',
    });
    paymentItems.push({
      id: 'payment-2',
      task: 'Set up refund policy and display it clearly',
      priority: 'critical',
      completed: false,
    });
  } else {
    paymentItems.push({
      id: 'payment-1',
      task: 'Choose and set up a payment processor (Stripe, PayPal, etc.)',
      priority: 'critical',
      completed: false,
      riskWarning: 'You need a way to collect payment',
    });
  }

  paymentItems.push(
    {
      id: 'payment-3',
      task: 'Create enrollment confirmation email with next steps',
      priority: 'critical',
      completed: false,
    },
    {
      id: 'payment-4',
      task: 'Set up student roster or tracking spreadsheet',
      priority: 'important',
      completed: false,
    },
    {
      id: 'payment-5',
      task: 'Prepare invoice template (if needed for your audience)',
      priority: cohortSize > 20 ? 'recommended' : 'important',
      completed: false,
    }
  );

  // Communication Setup
  const communicationItems: ChecklistItem[] = [
    {
      id: 'comm-1',
      task: 'Send welcome email with cohort start date and expectations',
      priority: 'critical',
      completed: false,
      riskWarning: 'Students need to know what to expect',
    },
    {
      id: 'comm-2',
      task: 'Create onboarding document with FAQs',
      priority: 'important',
      completed: false,
    },
  ];

  if (hasCommunityTool) {
    const communityTool = tools.find((t) => ['Discord', 'Slack'].includes(t));
    communicationItems.push({
      id: 'comm-3',
      task: `Set up ${communityTool} channels and invite students`,
      priority: 'critical',
      completed: false,
    });
    communicationItems.push({
      id: 'comm-4',
      task: `Post introduction prompt in ${communityTool} to break the ice`,
      priority: 'important',
      completed: false,
    });
  } else {
    communicationItems.push({
      id: 'comm-3',
      task: 'Decide on student communication method (email, Discord, Slack)',
      priority: 'critical',
      completed: false,
      riskWarning: 'You need a way to communicate with students',
    });
  }

  if (hasEmailTool) {
    communicationItems.push({
      id: 'comm-5',
      task: 'Schedule weekly reminder emails for live sessions',
      priority: 'important',
      completed: false,
    });
  }

  communicationItems.push({
    id: 'comm-6',
    task: 'Create template for weekly recap emails',
    priority: 'recommended',
    completed: false,
  });

  // Live Session Prep
  const liveSessionItems: ChecklistItem[] = [];

  if (hasVideoTool) {
    const videoTool = tools.find((t) => ['Zoom', 'Google Meet'].includes(t));
    liveSessionItems.push({
      id: 'live-1',
      task: `Test ${videoTool} setup: audio, video, screen share`,
      priority: 'critical',
      completed: false,
      riskWarning: 'Tech fails happen - test everything',
    });
    liveSessionItems.push({
      id: 'live-2',
      task: `Set up recurring ${videoTool} meetings for all sessions`,
      priority: 'critical',
      completed: false,
    });
    liveSessionItems.push({
      id: 'live-3',
      task: `Enable recording in ${videoTool} and test it`,
      priority: 'critical',
      completed: false,
      riskWarning: 'ALWAYS record sessions - students will miss them',
    });
  } else {
    liveSessionItems.push({
      id: 'live-1',
      task: 'Choose and set up video conferencing tool (Zoom, Google Meet)',
      priority: 'critical',
      completed: false,
      riskWarning: 'You need a platform for live sessions',
    });
  }

  liveSessionItems.push(
    {
      id: 'live-4',
      task: 'Prepare icebreaker or warm-up activity for first session',
      priority: 'important',
      completed: false,
    },
    {
      id: 'live-5',
      task: 'Create ground rules document (cameras on, mute when not speaking, etc.)',
      priority: 'important',
      completed: false,
    },
    {
      id: 'live-6',
      task: 'Plan backup activity if students do not engage',
      priority: isSmallCohort ? 'important' : 'recommended',
      completed: false,
    },
    {
      id: 'live-7',
      task: 'Send calendar invites with session links 48 hours before first session',
      priority: 'critical',
      completed: false,
    }
  );

  if (isLargeCohort) {
    liveSessionItems.push({
      id: 'live-8',
      task: 'Assign a co-host or moderator to help with large group',
      priority: 'important',
      completed: false,
    });
  }

  // Post-Session Follow-up
  const followUpItems: ChecklistItem[] = [
    {
      id: 'follow-1',
      task: 'Upload session recordings within 24 hours',
      priority: 'critical',
      completed: false,
      riskWarning: 'Students expect recordings quickly',
    },
    {
      id: 'follow-2',
      task: 'Send recap email with key takeaways and homework',
      priority: 'important',
      completed: false,
    },
    {
      id: 'follow-3',
      task: 'Check in with students who missed the session',
      priority: isSmallCohort ? 'important' : 'recommended',
      completed: false,
    },
    {
      id: 'follow-4',
      task: 'Collect feedback after first session',
      priority: 'important',
      completed: false,
    },
    {
      id: 'follow-5',
      task: 'Plan celebration or recognition for cohort completion',
      priority: 'recommended',
      completed: false,
    },
  ];

  if (durationWeeks >= 4) {
    followUpItems.push({
      id: 'follow-6',
      task: 'Create graduation certificate or completion badge',
      priority: 'recommended',
      completed: false,
    });
  }

  const checklist: ChecklistCategory[] = [
    {
      category: 'Content Readiness',
      icon: 'FileText',
      items: contentItems,
    },
    {
      category: 'Payment & Admin Setup',
      icon: 'DollarSign',
      items: paymentItems,
    },
    {
      category: 'Communication Setup',
      icon: 'MessageSquare',
      items: communicationItems,
    },
    {
      category: 'Live Session Prep',
      icon: 'Video',
      items: liveSessionItems,
    },
    {
      category: 'Post-Session Follow-up',
      icon: 'Clock',
      items: followUpItems,
    },
  ];

  // Risk Warnings
  const riskWarnings: string[] = [
    'Most creators forget to record their sessions - ALWAYS hit record',
    'Test your tech setup 48 hours before launch, not 5 minutes before',
    'Students will ask for refunds if you do not deliver on your promises',
    'Have backup plans for when students do not engage or show up',
  ];

  if (!hasPaymentTool) {
    riskWarnings.push('You have not selected a payment tool - set this up ASAP');
  }
  if (!hasVideoTool) {
    riskWarnings.push('You have not selected a video tool - cohorts need live interaction');
  }
  if (!hasCommunityTool && cohortSize > 10) {
    riskWarnings.push('Consider a community tool (Discord/Slack) for larger cohorts');
  }

  return {
    cohortSize,
    duration,
    tools,
    checklist,
    riskWarnings,
    priorityInsights: '',
    readinessScore: 0,
  };
}

// AI enhancement for personalized insights
async function enhanceChecklist(baseChecklist: ChecklistResult): Promise<ChecklistResult> {
  const { cohortSize, duration, tools } = baseChecklist;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a cohort launch expert helping a creator prepare.

Context:
- Cohort Size: ${cohortSize} students
- Duration: ${duration}
- Tools: ${tools.join(', ')}

Generate a personalized priority insight (2-3 sentences) that tells them:
1. What to focus on FIRST
2. What matters most for their cohort size
3. One specific recommendation based on their tools

Be specific, practical, and encouraging. No generic advice.

Output as plain text only (no JSON).`;

    const result = await model.generateContent(prompt);
    const priorityInsights = result.response.text().trim();

    return {
      ...baseChecklist,
      priorityInsights:
        priorityInsights ||
        `Start with the critical tasks first - especially payment setup and content prep. With ${cohortSize} students, personal attention will matter. Focus on creating a welcoming first session that sets the tone.`,
    };
  } catch (error) {
    console.error('AI enhancement failed:', error);

    // Fallback insights based on cohort size
    let fallbackInsights = '';

    if (cohortSize <= 15) {
      fallbackInsights = `With ${cohortSize} students, you can offer highly personalized attention. Focus on building strong relationships and creating an intimate learning environment. Prioritize your content and payment setup first.`;
    } else if (cohortSize <= 30) {
      fallbackInsights = `With ${cohortSize} students, balance is key. Focus on scalable systems (email automation, community tools) while maintaining personal touch. Get your payment and communication systems rock-solid first.`;
    } else {
      fallbackInsights = `With ${cohortSize} students, systems and automation are critical. Consider a co-host or moderator. Focus on payment setup, recording systems, and clear communication channels. You cannot do everything manually.`;
    }

    return {
      ...baseChecklist,
      priorityInsights: fallbackInsights,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChecklistRequest = await request.json();

    // Validate input
    if (!body.cohortSize || !body.duration || !body.tools || body.tools.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (body.cohortSize < 1) {
      return NextResponse.json(
        { error: 'Cohort size must be at least 1' },
        { status: 400 }
      );
    }

    // Generate base checklist
    const baseChecklist = generateBaseChecklist(body);

    // Enhance with AI insights
    const enhancedChecklist = await enhanceChecklist(baseChecklist);

    return NextResponse.json({ result: enhancedChecklist });
  } catch (error) {
    console.error('Cohort checklist error:', error);
    return NextResponse.json(
      { error: 'Failed to generate checklist' },
      { status: 500 }
    );
  }
}
