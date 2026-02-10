import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface EvaluationScore {
  ctaClarity: number;
  linkPlacement: number;
  messageRelevance: number;
  overall: number;
}

interface CTAVariation {
  context: string;
  copy: string;
}

interface VideoMetadata {
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  viewCount?: string;
}

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Fetch video metadata from YouTube API
async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    throw new Error('YouTube API key not configured');
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }

  const video = data.items[0];
  
  return {
    title: video.snippet.title,
    description: video.snippet.description,
    channelTitle: video.snippet.channelTitle,
    publishedAt: video.snippet.publishedAt,
    viewCount: video.statistics?.viewCount,
  };
}

// Evaluate current description
function evaluateDescription(description: string, goal: string): { evaluation: EvaluationScore; issues: string[] } {
  const issues: string[] = [];
  let ctaClarity = 100;
  let linkPlacement = 100;
  let messageRelevance = 100;

  // Check CTA clarity
  const ctaKeywords = ['click', 'join', 'enroll', 'register', 'sign up', 'get', 'download', 'learn more', 'check out'];
  const hasStrongCTA = ctaKeywords.some(keyword => description.toLowerCase().includes(keyword));
  
  if (!hasStrongCTA) {
    ctaClarity -= 40;
    issues.push('No clear call-to-action found');
  }

  const lines = description.split('\n');
  const firstFiveLines = lines.slice(0, 5).join('\n').toLowerCase();
  
  // Check link placement
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const allLinks = description.match(urlPattern) || [];
  const topLinks = firstFiveLines.match(urlPattern) || [];

  if (allLinks.length === 0) {
    linkPlacement -= 50;
    issues.push('No links found in description');
  } else if (topLinks.length === 0 && allLinks.length > 0) {
    linkPlacement -= 30;
    issues.push('Links buried at bottom - move them higher');
  }

  if (allLinks.length > 10) {
    linkPlacement -= 20;
    issues.push('Too many links - creates decision paralysis');
  }

  // Check message relevance based on goal
  const goalKeywords: Record<string, string[]> = {
    course: ['course', 'program', 'training', 'lesson', 'module', 'curriculum'],
    workshop: ['workshop', 'session', 'masterclass', 'webinar', 'live training'],
    'email-list': ['newsletter', 'subscribe', 'free guide', 'download', 'resource', 'bonus'],
  };

  const relevantKeywords = goalKeywords[goal] || [];
  const hasRelevantKeywords = relevantKeywords.some(keyword => 
    description.toLowerCase().includes(keyword)
  );

  if (!hasRelevantKeywords) {
    messageRelevance -= 30;
    issues.push(`Description does not mention ${goal.replace('-', ' ')}`);
  }

  // Check for weak opening
  const weakOpenings = ['in this video', 'today we', 'hey guys', 'what is up'];
  const hasWeakOpening = weakOpenings.some(opening => 
    description.toLowerCase().startsWith(opening)
  );

  if (hasWeakOpening) {
    messageRelevance -= 15;
    issues.push('Weak opening - start with value or urgency');
  }

  // Check for scarcity/urgency
  const scarcityKeywords = ['limited', 'exclusive', 'bonus', 'deadline', 'spots', 'only', 'now'];
  const hasScarcity = scarcityKeywords.some(keyword => description.toLowerCase().includes(keyword));

  if (!hasScarcity) {
    ctaClarity -= 15;
    issues.push('No urgency or scarcity - add deadline or limited availability');
  }

  // Calculate overall score
  const overall = Math.round((ctaClarity + linkPlacement + messageRelevance) / 3);

  return {
    evaluation: {
      ctaClarity: Math.max(0, ctaClarity),
      linkPlacement: Math.max(0, linkPlacement),
      messageRelevance: Math.max(0, messageRelevance),
      overall: Math.max(0, overall),
    },
    issues,
  };
}

// Generate optimized description using AI
async function generateOptimizedDescription(
  videoTitle: string,
  currentDescription: string,
  goal: string,
  channelTitle: string
): Promise<{ optimizedDescription: string; improvements: string[] }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const goalContext = {
    course: 'selling an online course',
    workshop: 'promoting a paid workshop or masterclass',
    'email-list': 'growing an email list with a free lead magnet',
  };

  const prompt = `You are a YouTube conversion copywriter. Rewrite this video description to convert viewers into ${goalContext[goal as keyof typeof goalContext]}.

Video Title: ${videoTitle}
Channel: ${channelTitle}
Current Description:
${currentDescription}

Goal: ${goalContext[goal as keyof typeof goalContext]}

Requirements:
1. Start with a HOOK (one sentence that makes them want to read more)
2. Add value bullets (3-4 bullets of what they will learn/get)
3. Include a STRONG CTA with link placeholder [LINK]
4. Add scarcity/urgency framing (limited spots, bonus expires, etc.)
5. Keep it under 250 words for the main pitch (timestamps can go after)
6. Use line breaks for readability

Format:
[Hook - one powerful sentence]

In this video, you will discover:
• [Benefit 1]
• [Benefit 2]
• [Benefit 3]

[STRONG CTA with urgency]
👉 [Link placeholder]: [LINK]

[Social proof or bonus if applicable]

---
(Then timestamps and other info)

Return ONLY the optimized description, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    const optimizedDescription = result.response.text().trim();

    // Identify improvements made
    const improvements: string[] = [];
    
    if (!currentDescription.toLowerCase().startsWith('in this video') && 
        optimizedDescription.toLowerCase().includes('in this video')) {
      improvements.push('Added clear value preview with bullets');
    }

    if (!(currentDescription.match(/👉|→|➡️/g)?.length || 0) && 
        (optimizedDescription.match(/👉|→|➡️/g)?.length || 0)) {
      improvements.push('Added visual CTA arrows for attention');
    }

    if (!(currentDescription.toLowerCase().match(/limited|exclusive|bonus|deadline/g)?.length || 0) &&
        (optimizedDescription.toLowerCase().match(/limited|exclusive|bonus|deadline/g)?.length || 0)) {
      improvements.push('Added urgency and scarcity framing');
    }

    const currentLinks = currentDescription.match(/(https?:\/\/[^\s]+)/g) || [];
    const optimizedHasLinkPlaceholder = optimizedDescription.includes('[LINK]');
    
    if (currentLinks.length === 0 || optimizedHasLinkPlaceholder) {
      improvements.push('Positioned primary CTA link at the top');
    }

    if (currentDescription.length > 500 && optimizedDescription.length <= 500) {
      improvements.push('Streamlined message for easier scanning');
    }

    if (improvements.length === 0) {
      improvements.push('Improved overall conversion structure');
      improvements.push('Enhanced CTA clarity and placement');
    }

    return { optimizedDescription, improvements };
  } catch (error) {
    console.error('AI generation failed:', error);
    
    // Fallback optimized structure
    const optimizedDescription = `Want to master ${videoTitle.toLowerCase().includes('how to') ? videoTitle.replace('How to', '').trim() : 'this skill'}? This video shows you exactly how.

In this video, you will discover:
• ${currentDescription.split('\n')[0] || 'Key strategies that work'}
• ${currentDescription.split('\n')[1] || 'Step-by-step implementation'}
• ${currentDescription.split('\n')[2] || 'Real examples and results'}

Ready to take action? Join my ${goal === 'course' ? 'complete course' : goal === 'workshop' ? 'live workshop' : 'free training'}.
👉 ${goal === 'course' ? 'Course' : goal === 'workshop' ? 'Workshop' : 'Free Guide'}: [LINK]

⚠️ Limited spots available - enrollment closes soon.

---
${currentDescription.includes('0:00') ? currentDescription.split('---')[1] || '' : ''}`;

    return {
      optimizedDescription,
      improvements: [
        'Added hook and value bullets',
        'Created clear CTA with urgency',
        'Improved structure for scanning',
      ],
    };
  }
}

// Generate pinned comment
async function generatePinnedComment(goal: string, videoTitle: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const goalContext = {
    course: 'course enrollment',
    workshop: 'workshop registration',
    'email-list': 'email signup',
  };

  const prompt = `Create a pinned comment for a YouTube video that drives ${goalContext[goal as keyof typeof goalContext]}.

Video: ${videoTitle}
Goal: ${goal}

Requirements:
- Start with an emoji or symbol
- 2-3 sentences max
- Clear CTA with link placeholder
- Create FOMO (fear of missing out)
- Use urgency language

Return ONLY the comment text, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Pinned comment generation failed:', error);
    
    // Fallback
    const fallbacks = {
      course: `🎯 Want the full system? My complete course breaks down everything step-by-step.\n\nEnroll now (link in description) - bonus templates expire this week! ⏰`,
      workshop: `🔥 Ready to implement this? Join my live workshop where I will walk you through it.\n\nGrab your spot (link in description) - limited to 50 people! ⏰`,
      'email-list': `📥 Want my free [RESOURCE] guide? I break down the exact process.\n\nDownload it here (link in description) - 100% free! 🎁`,
    };

    return fallbacks[goal as keyof typeof fallbacks];
  }
}

// Generate CTA variations
function generateCTAVariations(goal: string): CTAVariation[] {
  const variations: Record<string, CTAVariation[]> = {
    course: [
      {
        context: 'Direct',
        copy: '👉 Enroll in the full course: [LINK]',
      },
      {
        context: 'Value-focused',
        copy: '🎓 Get lifetime access + all bonuses: [LINK]',
      },
      {
        context: 'Urgent',
        copy: '⚠️ Enrollment closes Friday - secure your spot: [LINK]',
      },
      {
        context: 'Social proof',
        copy: '✅ Join 1,000+ students who transformed their [SKILL]: [LINK]',
      },
    ],
    workshop: [
      {
        context: 'Direct',
        copy: '👉 Register for the live workshop: [LINK]',
      },
      {
        context: 'Value-focused',
        copy: '🔥 Get the replay + workbook included: [LINK]',
      },
      {
        context: 'Urgent',
        copy: '⏰ Only 20 spots left - register now: [LINK]',
      },
      {
        context: 'Exclusive',
        copy: '🎟️ This workshop will not be recorded - join live: [LINK]',
      },
    ],
    'email-list': [
      {
        context: 'Direct',
        copy: '👉 Download the free guide: [LINK]',
      },
      {
        context: 'Value-focused',
        copy: '🎁 Get free templates + checklists: [LINK]',
      },
      {
        context: 'Benefit-focused',
        copy: '📧 Join my weekly newsletter (no spam, just value): [LINK]',
      },
      {
        context: 'Bonus',
        copy: '🔓 Unlock the bonus resource library: [LINK]',
      },
    ],
  };

  return variations[goal] || variations.course;
}

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, goal } = await req.json();

    if (!videoUrl || !goal) {
      return NextResponse.json(
        { error: 'Video URL and goal are required' },
        { status: 400 }
      );
    }

    // Extract video ID
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Fetch video metadata
    const metadata = await fetchVideoMetadata(videoId);

    // Evaluate current description
    const { evaluation, issues } = evaluateDescription(metadata.description, goal);

    // Generate optimized description
    const { optimizedDescription, improvements } = await generateOptimizedDescription(
      metadata.title,
      metadata.description,
      goal,
      metadata.channelTitle
    );

    // Generate pinned comment
    const pinnedComment = await generatePinnedComment(goal, metadata.title);

    // Generate CTA variations
    const ctaVariations = generateCTAVariations(goal);

    return NextResponse.json({
      result: {
        videoTitle: metadata.title,
        currentDescription: metadata.description,
        evaluation,
        issues,
        optimizedDescription,
        pinnedComment,
        ctaVariations,
        improvements,
      },
    });
  } catch (error: any) {
    console.error('Description optimizer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to optimize description' },
      { status: 500 }
    );
  }
}
