import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize YouTube API
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface Comment {
  text: string;
  author: string;
  likeCount: number;
}

// Trust signal patterns
const TRUST_PATTERNS = {
  appreciation: [
    /thank you/i,
    /thanks/i,
    /grateful/i,
    /appreciate/i,
    /this helped/i,
    /you saved/i,
    /life saver/i,
    /lifesaver/i,
    /game changer/i,
    /exactly what i needed/i,
    /perfect timing/i,
    /godsend/i,
    /love this/i,
    /love your/i,
  ],
  adviceSeeking: [
    /how do i/i,
    /how can i/i,
    /what should i/i,
    /can you help/i,
    /need help/i,
    /question:/i,
    /could you/i,
    /would you recommend/i,
    /any advice/i,
    /tips on/i,
    /suggestions/i,
    /what about/i,
    /how would you/i,
  ],
  outcomeMentions: [
    /it worked/i,
    /this worked/i,
    /got results/i,
    /finally/i,
    /success/i,
    /solved/i,
    /fixed/i,
    /now i can/i,
    /i was able to/i,
    /i managed to/i,
    /i did it/i,
    /accomplished/i,
  ],
};

function extractChannelId(url: string): string | null {
  try {
    const patterns = [
      /youtube\.com\/@([^\/\?]+)/,
      /youtube\.com\/channel\/([^\/\?]+)/,
      /youtube\.com\/c\/([^\/\?]+)/,
      /youtube\.com\/user\/([^\/\?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  } catch {
    return null;
  }
}

async function getChannelIdFromHandle(handle: string): Promise<string | null> {
  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      q: handle,
      type: ['channel'],
      maxResults: 1,
    });

    const channel = response.data.items?.[0];
    return channel?.snippet?.channelId || null;
  } catch (error) {
    console.error('Error fetching channel:', error);
    return null;
  }
}

async function fetchRecentComments(channelId: string): Promise<Comment[]> {
  try {
    // Get channel's recent videos
    const videosResponse = await youtube.search.list({
      part: ['id'],
      channelId,
      order: 'date',
      type: ['video'],
      maxResults: 10,
    });

    const videoIds = videosResponse.data.items
      ?.map(item => item.id?.videoId)
      .filter(Boolean) as string[];

    if (!videoIds || videoIds.length === 0) {
      return [];
    }

    // Fetch comments from these videos
    const allComments: Comment[] = [];

    for (const videoId of videoIds.slice(0, 5)) {
      try {
        const commentsResponse = await youtube.commentThreads.list({
          part: ['snippet'],
          videoId,
          maxResults: 100,
          order: 'relevance',
        });

        const comments = commentsResponse.data.items?.map(item => ({
          text: item.snippet?.topLevelComment?.snippet?.textDisplay || '',
          author: item.snippet?.topLevelComment?.snippet?.authorDisplayName || '',
          likeCount: item.snippet?.topLevelComment?.snippet?.likeCount || 0,
        })) || [];

        allComments.push(...comments);
      } catch (error) {
        console.error(`Error fetching comments for video ${videoId}:`, error);
      }
    }

    return allComments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

function analyzeTrustSignals(comments: Comment[]) {
  const appreciation: Comment[] = [];
  const adviceSeeking: Comment[] = [];
  const outcomeMentions: Comment[] = [];

  // Track repeat commenters
  const commenterCounts: Record<string, number> = {};

  for (const comment of comments) {
    // Track commenter
    commenterCounts[comment.author] = (commenterCounts[comment.author] || 0) + 1;

    // Check appreciation
    if (TRUST_PATTERNS.appreciation.some(pattern => pattern.test(comment.text))) {
      appreciation.push(comment);
    }

    // Check advice-seeking
    if (TRUST_PATTERNS.adviceSeeking.some(pattern => pattern.test(comment.text))) {
      adviceSeeking.push(comment);
    }

    // Check outcome mentions
    if (TRUST_PATTERNS.outcomeMentions.some(pattern => pattern.test(comment.text))) {
      outcomeMentions.push(comment);
    }
  }

  // Count repeat commenters (commented more than once)
  const repeatCommenters = Object.values(commenterCounts).filter(count => count > 1).length;
  const uniqueCommenters = Object.keys(commenterCounts).length;

  return {
    appreciation: {
      count: appreciation.length,
      percentage: (appreciation.length / comments.length) * 100,
      examples: appreciation
        .sort((a, b) => b.likeCount - a.likeCount)
        .slice(0, 5)
        .map(c => c.text.substring(0, 150)),
    },
    adviceSeeking: {
      count: adviceSeeking.length,
      percentage: (adviceSeeking.length / comments.length) * 100,
      examples: adviceSeeking
        .sort((a, b) => b.likeCount - a.likeCount)
        .slice(0, 5)
        .map(c => c.text.substring(0, 150)),
    },
    outcomeMentions: {
      count: outcomeMentions.length,
      percentage: (outcomeMentions.length / comments.length) * 100,
      examples: outcomeMentions
        .sort((a, b) => b.likeCount - a.likeCount)
        .slice(0, 5)
        .map(c => c.text.substring(0, 150)),
    },
    repeatCommenters: {
      count: repeatCommenters,
      percentage: (repeatCommenters / uniqueCommenters) * 100,
      examples: [],
    },
    metrics: {
      totalComments: comments.length,
      uniqueCommenters,
      repeatCommenters,
    },
  };
}

function calculateTrustScore(signals: any) {
  // Score breakdown:
  // Appreciation: 0-30 points
  const appreciationScore = Math.min((signals.appreciation.percentage / 30) * 30, 30);
  
  // Advice-seeking: 0-25 points
  const adviceScore = Math.min((signals.adviceSeeking.percentage / 20) * 25, 25);
  
  // Outcome mentions: 0-25 points
  const outcomeScore = Math.min((signals.outcomeMentions.percentage / 10) * 25, 25);
  
  // Repeat commenters: 0-20 points
  const repeatScore = Math.min((signals.repeatCommenters.percentage / 30) * 20, 20);

  const totalScore = Math.round(appreciationScore + adviceScore + outcomeScore + repeatScore);

  let rating: 'excellent' | 'strong' | 'good' | 'developing' | 'early';
  if (totalScore >= 80) rating = 'excellent';
  else if (totalScore >= 60) rating = 'strong';
  else if (totalScore >= 40) rating = 'good';
  else if (totalScore >= 20) rating = 'developing';
  else rating = 'early';

  return { score: totalScore, rating };
}

async function analyzeCommentsWithAI(comments: Comment[], signals: any) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Select diverse comment examples
    const exampleComments = [
      ...comments.filter(c => 
        TRUST_PATTERNS.appreciation.some(p => p.test(c.text))
      ).slice(0, 3),
      ...comments.filter(c => 
        TRUST_PATTERNS.adviceSeeking.some(p => p.test(c.text))
      ).slice(0, 3),
      ...comments.filter(c => 
        TRUST_PATTERNS.outcomeMentions.some(p => p.test(c.text))
      ).slice(0, 2),
    ].slice(0, 8);

    const commentsList = exampleComments.map(c => `"${c.text}"`).join('\n\n');

    const prompt = `You are an expert at analyzing creator-audience relationships. Analyze these YouTube comments for trust and buying intent:

Sample Comments:
${commentsList}

Trust Metrics:
- Appreciation comments: ${signals.appreciation.percentage.toFixed(1)}%
- Advice-seeking: ${signals.adviceSeeking.percentage.toFixed(1)}%
- Outcome mentions: ${signals.outcomeMentions.percentage.toFixed(1)}%
- Repeat commenters: ${signals.repeatCommenters.percentage.toFixed(1)}%

Provide analysis in this format:

SUMMARY: (2 sentences about overall trust level and what the comments reveal)

BUYING_CONFIDENCE: (2-3 sentences directly answering "Will they buy from me?" with specific evidence from the patterns)

TEACHER_STATUS: (2 sentences affirming they're already viewed as a teacher, with proof from the comments)

RECOMMENDATION: (2 sentences on next steps to convert this trust into course sales)

Format as shown above with clear labels.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse response
    const summaryMatch = response.match(/SUMMARY:\s*(.+?)(?=BUYING_CONFIDENCE:|$)/s);
    const buyingMatch = response.match(/BUYING_CONFIDENCE:\s*(.+?)(?=TEACHER_STATUS:|$)/s);
    const teacherMatch = response.match(/TEACHER_STATUS:\s*(.+?)(?=RECOMMENDATION:|$)/s);
    const recommendationMatch = response.match(/RECOMMENDATION:\s*(.+?)$/s);

    return {
      summary: summaryMatch?.[1].trim() || getFallbackSummary(signals),
      buyingConfidence: buyingMatch?.[1].trim() || getFallbackBuyingConfidence(signals),
      teacherStatus: teacherMatch?.[1].trim() || getFallbackTeacherStatus(signals),
      recommendation: recommendationMatch?.[1].trim() || getFallbackRecommendation(signals),
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      summary: getFallbackSummary(signals),
      buyingConfidence: getFallbackBuyingConfidence(signals),
      teacherStatus: getFallbackTeacherStatus(signals),
      recommendation: getFallbackRecommendation(signals),
    };
  }
}

function getFallbackSummary(signals: any): string {
  if (signals.appreciation.percentage > 20) {
    return `Your audience shows strong trust signals with ${signals.appreciation.percentage.toFixed(0)}% expressing appreciation. They're actively seeking your guidance and reporting results from your content.`;
  }
  return `Your audience is engaged with ${signals.metrics.totalComments} comments analyzed. You're building trust through consistent teaching and value delivery.`;
}

function getFallbackBuyingConfidence(signals: any): string {
  if (signals.adviceSeeking.percentage > 15 && signals.appreciation.percentage > 15) {
    return `Yes, they will buy. When people thank you AND ask for more help, that's buying intent. They're telling you they trust your teaching and want to go deeper. A course is the natural next step.`;
  }
  if (signals.adviceSeeking.percentage > 10) {
    return `The advice-seeking questions (${signals.adviceSeeking.percentage.toFixed(0)}% of comments) signal buying readiness. People who ask for help are willing to invest in solutions. Package your knowledge into a course.`;
  }
  return `Build more trust by consistently delivering value. As appreciation and advice-seeking comments increase, so will buying confidence. You're on the right track.`;
}

function getFallbackTeacherStatus(signals: any): string {
  if (signals.repeatCommenters.percentage > 20) {
    return `${signals.repeatCommenters.percentage.toFixed(0)}% of commenters return multiple times. Repeat engagement means they see you as a trusted teacher, not just another content creator. They're already invested in learning from you.`;
  }
  return `Your audience treats you as an authority. The gratitude, questions, and outcome mentions prove they value your teaching. You don't need permission to create a course—you're already teaching.`;
}

function getFallbackRecommendation(signals: any): string {
  if (signals.appreciation.percentage > 20) {
    return `Start with a small workshop or mini-course. Your audience is ready—they're literally thanking you for free content. Imagine what they'd pay for structured, comprehensive teaching.`;
  }
  return `Continue building trust through valuable content. As your appreciation and advice-seeking signals grow, introduce a course. You're closer than you think.`;
}

function selectCommentExamples(comments: Comment[], signals: any) {
  const examples: any[] = [];

  // Get best appreciation examples
  const appreciationComments = comments.filter(c =>
    TRUST_PATTERNS.appreciation.some(p => p.test(c.text))
  ).sort((a, b) => b.likeCount - a.likeCount);

  examples.push(
    ...appreciationComments.slice(0, 3).map(c => ({
      text: c.text.substring(0, 200),
      category: 'appreciation' as const,
      trustLevel: c.likeCount > 10 ? 'high' : c.likeCount > 3 ? 'medium' : 'low' as const,
    }))
  );

  // Get best advice-seeking examples
  const adviceComments = comments.filter(c =>
    TRUST_PATTERNS.adviceSeeking.some(p => p.test(c.text))
  ).sort((a, b) => b.likeCount - a.likeCount);

  examples.push(
    ...adviceComments.slice(0, 2).map(c => ({
      text: c.text.substring(0, 200),
      category: 'advice-seeking' as const,
      trustLevel: c.likeCount > 5 ? 'high' : c.likeCount > 1 ? 'medium' : 'low' as const,
    }))
  );

  // Get best outcome examples
  const outcomeComments = comments.filter(c =>
    TRUST_PATTERNS.outcomeMentions.some(p => p.test(c.text))
  ).sort((a, b) => b.likeCount - a.likeCount);

  examples.push(
    ...outcomeComments.slice(0, 2).map(c => ({
      text: c.text.substring(0, 200),
      category: 'outcome' as const,
      trustLevel: 'high' as const,
    }))
  );

  return examples.slice(0, 8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelUrl } = body;

    // Validate input
    if (!channelUrl) {
      return NextResponse.json(
        { error: 'Channel URL is required' },
        { status: 400 }
      );
    }

    // Extract channel ID or handle
    const channelIdentifier = extractChannelId(channelUrl);
    if (!channelIdentifier) {
      return NextResponse.json(
        { error: 'Invalid YouTube channel URL' },
        { status: 400 }
      );
    }

    // Try to get channel ID if it's a handle
    let channelId = channelIdentifier;
    if (channelIdentifier.startsWith('@') || !channelIdentifier.includes('UC')) {
      const resolvedId = await getChannelIdFromHandle(channelIdentifier);
      if (!resolvedId) {
        return NextResponse.json(
          { error: 'Could not find channel' },
          { status: 404 }
        );
      }
      channelId = resolvedId;
    }

    // Fetch comments
    const comments = await fetchRecentComments(channelId);

    if (comments.length === 0) {
      return NextResponse.json(
        { error: 'No comments found. Make sure the channel has public comments.' },
        { status: 404 }
      );
    }

    // Analyze trust signals
    const signals = analyzeTrustSignals(comments);

    // Calculate trust score
    const { score, rating } = calculateTrustScore(signals);

    // Generate AI insights
    const insights = await analyzeCommentsWithAI(comments, signals);

    // Select best comment examples
    const commentExamples = selectCommentExamples(comments, signals);

    // Calculate engagement rate (simplified)
    const engagementRate = Math.min(
      ((signals.appreciation.count + signals.adviceSeeking.count) / comments.length) * 100,
      100
    );

    const result = {
      score,
      rating,
      trustSignals: {
        appreciation: signals.appreciation,
        adviceSeeking: signals.adviceSeeking,
        outcomeMentions: signals.outcomeMentions,
        repeatCommenters: signals.repeatCommenters,
      },
      commentExamples,
      insights,
      metrics: {
        totalComments: signals.metrics.totalComments,
        uniqueCommenters: signals.metrics.uniqueCommenters,
        engagementRate,
      },
    };

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Audience trust analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze audience trust' },
      { status: 500 }
    );
  }
}
