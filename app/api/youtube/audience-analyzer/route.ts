import { NextRequest, NextResponse } from 'next/server';

interface CommentData {
  text: string;
  authorDisplayName: string;
  likeCount: number;
}

interface ClassifiedComment {
  text: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  confidence: number;
}

interface AudienceLevelBreakdown {
  beginner: number;
  intermediate: number;
  advanced: number;
}

interface AnalyzerResult {
  breakdown: AudienceLevelBreakdown;
  totalComments: number;
  recommendation: string;
  courseSuggestion: string;
  pricingStrategy: string;
  sampleComments: {
    beginner: { text: string; level: string }[];
    intermediate: { text: string; level: string }[];
    advanced: { text: string; level: string }[];
  };
  dominantLevel: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url, inputType } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      return NextResponse.json(
        { error: 'YouTube API key not configured' },
        { status: 500 }
      );
    }

    let comments: CommentData[] = [];
    let videoTitle = '';
    let channelName = '';

    if (inputType === 'video') {
      const videoId = extractVideoId(url);
      if (!videoId) {
        return NextResponse.json(
          { error: 'Invalid YouTube video URL' },
          { status: 400 }
        );
      }

      // Fetch video details
      const videoDetails = await fetchVideoDetails(videoId, youtubeApiKey);
      videoTitle = videoDetails.title;
      channelName = videoDetails.channelTitle;

      // Fetch comments for single video
      comments = await fetchVideoComments(videoId, youtubeApiKey);
    } else {
      // Channel mode: fetch comments from multiple popular videos
      const channelHandle = extractChannelHandle(url);
      if (!channelHandle) {
        return NextResponse.json(
          { error: 'Invalid YouTube channel URL' },
          { status: 400 }
        );
      }

      const channelId = await getChannelIdFromHandle(channelHandle, youtubeApiKey);
      if (!channelId) {
        return NextResponse.json(
          { error: 'Could not find YouTube channel' },
          { status: 404 }
        );
      }

      // Get channel name
      const channelDetails = await getChannelDetails(channelId, youtubeApiKey);
      channelName = channelDetails?.title || '';

      // Fetch top videos and their comments
      comments = await fetchChannelComments(channelId, youtubeApiKey);
    }

    if (comments.length === 0) {
      return NextResponse.json(
        { error: 'No comments found to analyze' },
        { status: 404 }
      );
    }

    // Filter meaningful comments (questions, longer comments)
    const meaningfulComments = comments.filter(c => 
      c.text.length > 20 && (
        c.text.includes('?') || 
        c.text.split(' ').length > 5
      )
    );

    // Classify comments using AI
    const classifiedComments = await classifyCommentsWithAI(meaningfulComments);

    // Generate result
    const result = generateAnalyzerResult(classifiedComments);

    return NextResponse.json({
      result,
      videoTitle,
      channelName,
    });

  } catch (error) {
    console.error('Audience analyzer error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze audience' },
      { status: 500 }
    );
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function extractChannelHandle(url: string): string | null {
  const patterns = [
    /@([^/?]+)/,
    /channel\/([^/?]+)/,
    /c\/([^/?]+)/,
    /user\/([^/?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1].startsWith('@') ? match[1] : '@' + match[1];
    }
  }

  return null;
}

async function fetchVideoDetails(
  videoId: string,
  apiKey: string
): Promise<{ title: string; channelTitle: string }> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoId}&part=snippet`
    );

    if (!response.ok) return { title: '', channelTitle: '' };

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return {
        title: data.items[0].snippet.title,
        channelTitle: data.items[0].snippet.channelTitle,
      };
    }

    return { title: '', channelTitle: '' };
  } catch (error) {
    console.error('Error fetching video details:', error);
    return { title: '', channelTitle: '' };
  }
}

async function fetchVideoComments(
  videoId: string,
  apiKey: string,
  maxComments: number = 200
): Promise<CommentData[]> {
  const comments: CommentData[] = [];
  let nextPageToken: string | undefined;

  try {
    while (comments.length < maxComments) {
      const url = new URL('https://www.googleapis.com/youtube/v3/commentThreads');
      url.searchParams.set('key', apiKey);
      url.searchParams.set('videoId', videoId);
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('maxResults', '100');
      url.searchParams.set('order', 'relevance');
      if (nextPageToken) {
        url.searchParams.set('pageToken', nextPageToken);
      }

      const response = await fetch(url.toString());
      if (!response.ok) break;

      const data = await response.json();
      
      for (const item of data.items || []) {
        const comment = item.snippet.topLevelComment.snippet;
        comments.push({
          text: comment.textDisplay.replace(/<[^>]*>/g, ''), // Strip HTML
          authorDisplayName: comment.authorDisplayName,
          likeCount: comment.likeCount || 0,
        });
      }

      nextPageToken = data.nextPageToken;
      if (!nextPageToken) break;
    }

    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return comments;
  }
}

async function getChannelIdFromHandle(
  handle: string,
  apiKey: string
): Promise<string | null> {
  try {
    const searchQuery = handle.replace('@', '');
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(searchQuery)}&type=channel&part=snippet&maxResults=1`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.channelId || data.items[0].id.channelId;
    }

    return null;
  } catch (error) {
    console.error('Error getting channel ID:', error);
    return null;
  }
}

async function getChannelDetails(
  channelId: string,
  apiKey: string
): Promise<{ title: string } | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=snippet`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return {
        title: data.items[0].snippet.title,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting channel details:', error);
    return null;
  }
}

async function fetchChannelComments(
  channelId: string,
  apiKey: string
): Promise<CommentData[]> {
  try {
    // First, get top videos from the channel
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=viewCount&type=video&maxResults=10`
    );

    if (!videosResponse.ok) return [];

    const videosData = await videosResponse.json();
    const videoIds = videosData.items.map((item: any) => item.id.videoId);

    // Fetch comments from top videos
    const allComments: CommentData[] = [];
    
    for (const videoId of videoIds.slice(0, 5)) {
      const comments = await fetchVideoComments(videoId, apiKey, 40);
      allComments.push(...comments);
      
      if (allComments.length >= 200) break;
    }

    return allComments;
  } catch (error) {
    console.error('Error fetching channel comments:', error);
    return [];
  }
}

async function classifyCommentsWithAI(
  comments: CommentData[]
): Promise<ClassifiedComment[]> {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      // Fallback to rule-based classification
      return fallbackClassification(comments);
    }

    // Process in batches to avoid token limits
    const batchSize = 50;
    const classifiedComments: ClassifiedComment[] = [];

    for (let i = 0; i < Math.min(comments.length, 200); i += batchSize) {
      const batch = comments.slice(i, i + batchSize);
      const batchText = batch.map((c, idx) => `${idx + 1}. ${c.text}`).join('\n');

      const prompt = `Analyze these YouTube comments and classify each by skill level.

SKILL LEVEL INDICATORS:
- BEGINNER: "what is", "how do I start", "I'm new to", "basics", "tutorial for beginners", "explain like I'm 5", "don't understand"
- INTERMEDIATE: "how do I optimize", "best practices", "improve", "better way", "which tool", "how to implement", "struggling with"
- ADVANCED: "how to scale", "automate", "performance optimization", "architecture", "production", "enterprise", "advanced techniques"

COMMENTS:
${batchText}

Respond in JSON format only:
[
  {"index": 1, "level": "beginner", "confidence": 0.9},
  {"index": 2, "level": "intermediate", "confidence": 0.8}
]

Classify ALL comments. Use your best judgment if unclear. Confidence 0-1.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2000,
            }
          })
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const classifications = JSON.parse(jsonMatch[0]);
        
        for (const classification of classifications) {
          const commentIndex = classification.index - 1;
          if (commentIndex >= 0 && commentIndex < batch.length) {
            classifiedComments.push({
              text: batch[commentIndex].text,
              level: classification.level as 'beginner' | 'intermediate' | 'advanced',
              confidence: classification.confidence || 0.5,
            });
          }
        }
      }
    }

    // If AI classification failed, use fallback
    if (classifiedComments.length === 0) {
      return fallbackClassification(comments);
    }

    return classifiedComments;
  } catch (error) {
    console.error('AI classification error:', error);
    return fallbackClassification(comments);
  }
}

function fallbackClassification(comments: CommentData[]): ClassifiedComment[] {
  const beginnerKeywords = ['what is', 'how do i start', 'new to', 'beginner', 'basics', 'tutorial', 'explain', 'dont understand', "don't understand", 'help me'];
  const intermediateKeywords = ['optimize', 'best practice', 'improve', 'better way', 'which tool', 'recommend', 'how to implement', 'struggling'];
  const advancedKeywords = ['scale', 'automate', 'performance', 'architecture', 'production', 'enterprise', 'advanced', 'professional'];

  return comments.map(comment => {
    const text = comment.text.toLowerCase();
    
    let beginnerScore = beginnerKeywords.filter(kw => text.includes(kw)).length;
    let intermediateScore = intermediateKeywords.filter(kw => text.includes(kw)).length;
    let advancedScore = advancedKeywords.filter(kw => text.includes(kw)).length;

    // Check for question patterns
    if (text.match(/^(what|how|why|when|where|can|could|should)/)) {
      if (text.includes('?')) {
        beginnerScore += 0.5;
      }
    }

    let level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    let confidence = 0.6;

    if (beginnerScore > intermediateScore && beginnerScore > advancedScore) {
      level = 'beginner';
      confidence = 0.7;
    } else if (advancedScore > beginnerScore && advancedScore > intermediateScore) {
      level = 'advanced';
      confidence = 0.7;
    }

    return {
      text: comment.text,
      level,
      confidence,
    };
  });
}

function generateAnalyzerResult(classifiedComments: ClassifiedComment[]): AnalyzerResult {
  // Calculate breakdown
  const total = classifiedComments.length;
  const beginnerCount = classifiedComments.filter(c => c.level === 'beginner').length;
  const intermediateCount = classifiedComments.filter(c => c.level === 'intermediate').length;
  const advancedCount = classifiedComments.filter(c => c.level === 'advanced').length;

  const breakdown: AudienceLevelBreakdown = {
    beginner: Math.round((beginnerCount / total) * 100),
    intermediate: Math.round((intermediateCount / total) * 100),
    advanced: Math.round((advancedCount / total) * 100),
  };

  // Determine dominant level
  let dominantLevel = 'beginner';
  let maxPercentage = breakdown.beginner;
  
  if (breakdown.intermediate > maxPercentage) {
    dominantLevel = 'intermediate';
    maxPercentage = breakdown.intermediate;
  }
  if (breakdown.advanced > maxPercentage) {
    dominantLevel = 'advanced';
  }

  // Generate recommendations
  let recommendation = '';
  let courseSuggestion = '';
  let pricingStrategy = '';

  if (breakdown.beginner >= 50) {
    recommendation = "Start with a beginner-focused course. Your audience needs foundational knowledge and step-by-step guidance.";
    courseSuggestion = "Create a complete beginner course covering basics to intermediate. Upsell an advanced course later once they've learned the fundamentals.";
    pricingStrategy = "Price beginner courses at ₹999-₹2,499. High volume potential due to larger beginner market.";
  } else if (breakdown.intermediate >= 40) {
    recommendation = "Create a beginner → intermediate course. Your audience has mixed skill levels, so bridge the gap.";
    courseSuggestion = "Start with quick recap of basics (20%), focus heavily on intermediate techniques (60%), and hint at advanced topics (20%). This serves both beginners and intermediates.";
    pricingStrategy = "Price at ₹2,499-₹4,999. Your audience values skill progression.";
  } else if (breakdown.advanced >= 35) {
    recommendation = "Your audience is split between skill levels. Consider creating two separate courses: one for beginners/intermediate and one advanced.";
    courseSuggestion = "Launch with an intermediate course first (easier to sell), then create both a beginner course (for top-of-funnel) and an advanced course (premium offering).";
    pricingStrategy = "Beginner: ₹1,999-₹2,999 | Advanced: ₹4,999-₹9,999. Advanced courses can charge premium.";
  } else {
    recommendation = "Your audience is primarily intermediate. Focus on practical, implementation-focused content.";
    courseSuggestion = "Skip basic theory. Focus on hands-on projects, real-world applications, and optimization techniques.";
    pricingStrategy = "Price at ₹3,499-₹5,999. Intermediate learners invest more in quality content.";
  }

  // Sample comments for each level
  const sampleComments = {
    beginner: classifiedComments
      .filter(c => c.level === 'beginner')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(c => ({ text: c.text, level: 'beginner' })),
    intermediate: classifiedComments
      .filter(c => c.level === 'intermediate')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(c => ({ text: c.text, level: 'intermediate' })),
    advanced: classifiedComments
      .filter(c => c.level === 'advanced')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(c => ({ text: c.text, level: 'advanced' })),
  };

  return {
    breakdown,
    totalComments: total,
    recommendation,
    courseSuggestion,
    pricingStrategy,
    sampleComments,
    dominantLevel,
  };
}
