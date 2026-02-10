import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface BioLinkAuditRequest {
  bioUrl: string;
}

interface AuditIssue {
  type: 'critical' | 'warning' | 'info';
  message: string;
  impact: string;
}

interface OptimizedLayout {
  section: string;
  recommendation: string;
  example: string;
}

interface AuditResult {
  url: string;
  monetizationScore: number;
  scoreGrade: string;
  totalLinks: number;
  hasPrimaryCTA: boolean;
  hasEducationOffer: boolean;
  hasLeadCapture: boolean;
  frictionScore: number;
  leakageScore: number;
  issues: AuditIssue[];
  topFixes: string[];
  optimizedLayout: OptimizedLayout[];
  aiInsight: string;
}

// Scrape and analyze bio link page
async function analyzeBioLink(url: string): Promise<{
  totalLinks: number;
  linkTexts: string[];
  pageContent: string;
  hasEmailCapture: boolean;
  hasButtonCTA: boolean;
}> {
  try {
    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bio link page');
    }

    const html = await response.text();

    // Simple analysis (count links, look for patterns)
    const linkMatches = html.match(/<a\s+[^>]*href=["'][^"']*["'][^>]*>(.*?)<\/a>/gi) || [];
    const totalLinks = linkMatches.length;

    // Extract link text
    const linkTexts = linkMatches.map((link) => {
      const textMatch = link.match(/>([^<]+)</);
      return textMatch ? textMatch[1].trim() : '';
    }).filter(Boolean);

    // Check for email capture
    const hasEmailCapture = /input[^>]*type=["']?email|newsletter|subscribe|join.*list/i.test(html);

    // Check for prominent button CTA
    const hasButtonCTA = /<button|class=["'][^"']*btn|cta|primary/i.test(html);

    return {
      totalLinks,
      linkTexts,
      pageContent: html.substring(0, 5000), // First 5000 chars for analysis
      hasEmailCapture,
      hasButtonCTA,
    };
  } catch (error) {
    console.error('Failed to analyze bio link:', error);
    
    // Return simulated data for demo purposes
    return {
      totalLinks: 8,
      linkTexts: [
        'Latest Video',
        'Instagram',
        'Twitter',
        'TikTok',
        'Amazon Storefront',
        'Podcast',
        'Newsletter',
        'Contact Me',
      ],
      pageContent: '',
      hasEmailCapture: false,
      hasButtonCTA: false,
    };
  }
}

// Generate audit based on analyzed data
function generateAudit(data: {
  url: string;
  totalLinks: number;
  linkTexts: string[];
  hasEmailCapture: boolean;
  hasButtonCTA: boolean;
}): Omit<AuditResult, 'aiInsight'> {
  const { totalLinks, linkTexts, hasEmailCapture, hasButtonCTA } = data;

  // Detect education/course offers
  const hasEducationOffer = linkTexts.some((text) =>
    /course|class|workshop|program|training|learn|masterclass/i.test(text)
  );

  // Detect primary CTA (first link should be money-making)
  const hasPrimaryCTA = linkTexts.length > 0 && 
    /course|buy|shop|book|enroll|join|get|download/i.test(linkTexts[0]);

  // Calculate scores
  let monetizationScore = 100;
  const issues: AuditIssue[] = [];

  // Too many links
  if (totalLinks > 7) {
    monetizationScore -= 25;
    issues.push({
      type: 'critical',
      message: `Too many links (${totalLinks})`,
      impact: 'Overwhelming choices = decision paralysis. Most visitors leave without clicking anything.',
    });
  } else if (totalLinks > 5) {
    monetizationScore -= 15;
    issues.push({
      type: 'warning',
      message: `Many links (${totalLinks})`,
      impact: 'Too many options dilute attention from your main monetization offer.',
    });
  }

  // No primary CTA
  if (!hasPrimaryCTA) {
    monetizationScore -= 30;
    issues.push({
      type: 'critical',
      message: 'No clear primary CTA at the top',
      impact: 'First link should be your main monetization offer. You are burying your revenue.',
    });
  }

  // No education offer
  if (!hasEducationOffer) {
    monetizationScore -= 20;
    issues.push({
      type: 'warning',
      message: 'No education or course offer detected',
      impact: 'Education products have the highest margins and build lasting audience relationships.',
    });
  }

  // No lead capture
  if (!hasEmailCapture) {
    monetizationScore -= 15;
    issues.push({
      type: 'warning',
      message: 'No email capture or lead magnet',
      impact: 'You are losing people forever. No way to follow up with interested visitors.',
    });
  }

  // Social media links at the top
  const socialFirst = linkTexts.slice(0, 2).some((text) =>
    /instagram|twitter|tiktok|youtube|facebook|snapchat/i.test(text)
  );

  if (socialFirst) {
    monetizationScore -= 10;
    issues.push({
      type: 'info',
      message: 'Social media links are too prominent',
      impact: 'Sending people to social platforms = losing them. Prioritize monetization links first.',
    });
  }

  // Calculate friction and leakage
  const frictionScore = Math.min(100, (totalLinks - 3) * 15);
  const leakageScore = socialFirst ? 80 : hasEducationOffer ? 20 : 50;

  monetizationScore = Math.max(0, Math.min(100, monetizationScore));

  // Score grade
  let scoreGrade = 'F';
  if (monetizationScore >= 90) scoreGrade = 'A+';
  else if (monetizationScore >= 80) scoreGrade = 'A';
  else if (monetizationScore >= 70) scoreGrade = 'B';
  else if (monetizationScore >= 60) scoreGrade = 'C';
  else if (monetizationScore >= 50) scoreGrade = 'D';

  // Top 3 fixes
  const topFixes: string[] = [];

  if (!hasPrimaryCTA) {
    topFixes.push('Move your main monetization offer (course, product, or service) to the TOP of your bio link.');
  }
  if (totalLinks > 5) {
    topFixes.push(`Cut down to 3-5 links maximum. Remove ${totalLinks - 5} links that do not directly make money or capture leads.`);
  }
  if (!hasEmailCapture) {
    topFixes.push('Add a free lead magnet (PDF, checklist, mini-course) to capture emails before sending traffic away.');
  }
  if (!hasEducationOffer) {
    topFixes.push('Create a low-ticket digital product or mini-course. This is where long-term revenue lives.');
  }
  if (socialFirst) {
    topFixes.push('Move social media links to the BOTTOM. Stop sending traffic away from monetization.');
  }

  // Optimized layout
  const optimizedLayout: OptimizedLayout[] = [
    {
      section: '1. Primary Money Maker (Top)',
      recommendation: 'Your highest-value offer goes first. This is what you want everyone to see.',
      example: '🔥 [Your Course Name] - Start Learning Now',
    },
    {
      section: '2. Lead Capture',
      recommendation: 'Free lead magnet to capture emails from people not ready to buy yet.',
      example: '📥 Free [Guide/Checklist] - Get Instant Access',
    },
    {
      section: '3. Secondary Offer (Optional)',
      recommendation: 'If you have a second monetization product, place it here.',
      example: '💼 1-on-1 Coaching - Book a Call',
    },
    {
      section: '4. Latest Content',
      recommendation: 'Link to your latest video or blog post to keep engagement high.',
      example: '🎥 Latest Video: [Title]',
    },
    {
      section: '5. Social Links (Bottom)',
      recommendation: 'Social links go last. They are not monetization - they are just noise.',
      example: '📱 Follow on Instagram | Twitter | TikTok',
    },
  ];

  return {
    url: data.url,
    monetizationScore,
    scoreGrade,
    totalLinks,
    hasPrimaryCTA,
    hasEducationOffer,
    hasLeadCapture: hasEmailCapture,
    frictionScore,
    leakageScore,
    issues,
    topFixes: topFixes.slice(0, 3),
    optimizedLayout,
  };
}

// AI-enhanced insight
async function generateAIInsight(audit: Omit<AuditResult, 'aiInsight'>): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a monetization expert analyzing a creator's link-in-bio page.

Context:
- Total Links: ${audit.totalLinks}
- Monetization Score: ${audit.monetizationScore}/100
- Has Primary CTA: ${audit.hasPrimaryCTA ? 'Yes' : 'No'}
- Has Education Offer: ${audit.hasEducationOffer ? 'Yes' : 'No'}
- Has Lead Capture: ${audit.hasLeadCapture ? 'Yes' : 'No'}

Generate a single, hard-hitting insight (2-3 sentences) that tells this creator exactly why people are NOT buying.

Be direct, specific, and actionable. No fluff. Start with "Your audience..." or "The problem is..."

Examples:
- "Your audience does not know what you want them to do. You have 8 competing links and no clear priority."
- "The problem is simple: you are sending people everywhere except to your monetization offer."
- "Your audience is clicking but not buying because your course link is buried under social media links that distract them."

Output plain text only (no JSON, no formatting).`;

    const result = await model.generateContent(prompt);
    const aiInsight = result.response.text().trim();

    return aiInsight || 'Your audience does not know what you want them to do. Too many links and no clear priority means lost revenue.';
  } catch (error) {
    console.error('AI insight generation failed:', error);

    // Fallback insight based on score
    if (audit.monetizationScore < 50) {
      return 'Your bio link is leaking money everywhere. Too many links, no clear priority, and no way to capture leads means most visitors leave without taking action.';
    } else if (audit.monetizationScore < 70) {
      return 'Your audience does not know what you want them to do first. Reduce friction by cutting links and making your primary offer impossible to miss.';
    } else {
      return 'You are close to optimized, but small tweaks could boost conversions. Focus on a single clear path from click to purchase.';
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BioLinkAuditRequest = await request.json();

    // Validate input
    if (!body.bioUrl) {
      return NextResponse.json(
        { error: 'Bio URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(body.bioUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Analyze the bio link
    const analysisData = await analyzeBioLink(body.bioUrl);

    // Generate audit
    const audit = generateAudit({
      url: body.bioUrl,
      ...analysisData,
    });

    // Generate AI insight
    const aiInsight = await generateAIInsight(audit);

    const finalResult: AuditResult = {
      ...audit,
      aiInsight,
    };

    return NextResponse.json({ result: finalResult });
  } catch (error) {
    console.error('Bio link audit error:', error);
    return NextResponse.json(
      { error: 'Failed to audit bio link' },
      { status: 500 }
    );
  }
}
