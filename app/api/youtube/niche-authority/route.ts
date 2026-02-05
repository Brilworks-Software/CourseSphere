import { NextRequest, NextResponse } from 'next/server';

interface VideoData {
  title: string;
  description: string;
  publishedAt: string;
  duration?: string;
  viewCount?: number;
  commentCount?: number;
}

interface ScoreBreakdown {
  consistency: number;
  depth: number;
  progression: number;
  longevity: number;
  audienceValidation: number;
}

interface AuthorityResult {
  totalScore: number;
  breakdown: ScoreBreakdown;
  authorityLevel: string;
  explanation: string[];
  reassurance: string;
  nicheClassification?: {
    primaryNiche: string;
    consistency: number;
    topicDiversity: string[];
  };
  complexityAnalysis?: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { channelUrl } = await request.json();

    if (!channelUrl) {
      return NextResponse.json(
        { error: 'Channel URL is required' },
        { status: 400 }
      );
    }

    const channelHandle = extractChannelHandle(channelUrl);
    if (!channelHandle) {
      return NextResponse.json(
        { error: 'Invalid YouTube channel URL' },
        { status: 400 }
      );
    }

    // Fetch channel data from Social Insider
    console.log('Fetching channel data for:', channelHandle);
    const socialInsiderResponse = await fetch('https://free-tools.socialinsider.io/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 1,
        method: 'yt_tools.free_tools',
        params: {
          handle: channelHandle,
          timezone: 'Asia/Calcutta',
          tool: 'free_social_media_analytics'
        },
        auth: { dashboardVersion: 1 }
      })
    });

    let channelData: any = {};
    if (socialInsiderResponse.ok) {
      channelData = await socialInsiderResponse.json();
      console.log('Channel data fetched:', {
        name: channelData.profile_name,
        subscribers: channelData.profile_followers?.integer
      });
    }

    // Fetch video data from YouTube API
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      return NextResponse.json(
        { error: 'YouTube API key not configured' },
        { status: 500 }
      );
    }

    const channelId = await getChannelIdFromHandle(channelHandle, youtubeApiKey);
    if (!channelId) {
      return NextResponse.json(
        { error: 'Could not find YouTube channel' },
        { status: 404 }
      );
    }

    // Fetch channel details for thumbnail if not available from Social Insider
    if (!channelData.profile_image) {
      const channelDetails = await getChannelDetails(channelId, youtubeApiKey);
      if (channelDetails) {
        channelData.profile_image = channelDetails.thumbnail;
        channelData.profile_name = channelData.profile_name || channelDetails.title;
      }
    }

    // Fetch all videos from the channel (up to 200 for analysis)
    const videos = await fetchChannelVideos(channelId, youtubeApiKey);
    
    if (videos.length === 0) {
      return NextResponse.json(
        { error: 'No videos found on this channel' },
        { status: 404 }
      );
    }

    // Use AI to classify topics and complexity
    const aiAnalysis = await analyzeVideosWithAI(videos);

    // Calculate authority score
    const result = calculateAuthorityScore(
      videos,
      channelData,
      aiAnalysis
    );

    return NextResponse.json({
      result,
      channelName: channelData.profile_name || '',
      channelImage: channelData.profile_image || '',
    });

  } catch (error) {
    console.error('Niche authority analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze channel authority' },
      { status: 500 }
    );
  }
}

function extractChannelHandle(url: string): string | null {
  try {
    // Handle various YouTube URL formats
    const patterns = [
      /@([^/?]+)/,                    // @username
      /channel\/([^/?]+)/,            // /channel/ID
      /c\/([^/?]+)/,                  // /c/customname
      /user\/([^/?]+)/,               // /user/username
      /youtube\.com\/([^/@?]+)$/      // youtube.com/username
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1].startsWith('@') ? match[1] : '@' + match[1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function getChannelIdFromHandle(
  handle: string,
  apiKey: string
): Promise<string | null> {
  try {
    // Remove @ if present
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
): Promise<{ title: string; thumbnail: string } | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=snippet`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      return {
        title: channel.snippet.title,
        thumbnail: channel.snippet.thumbnails?.high?.url || 
                   channel.snippet.thumbnails?.medium?.url || 
                   channel.snippet.thumbnails?.default?.url || ''
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting channel details:', error);
    return null;
  }
}

async function fetchChannelVideos(
  channelId: string,
  apiKey: string,
  maxVideos: number = 200
): Promise<VideoData[]> {
  const videos: VideoData[] = [];
  let nextPageToken: string | undefined;
  const videosPerPage = 50;

  try {
    while (videos.length < maxVideos) {
      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.searchParams.set('key', apiKey);
      searchUrl.searchParams.set('channelId', channelId);
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('order', 'date');
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('maxResults', videosPerPage.toString());
      if (nextPageToken) {
        searchUrl.searchParams.set('pageToken', nextPageToken);
      }

      const response = await fetch(searchUrl.toString());
      if (!response.ok) break;

      const data = await response.json();
      
      // Get video IDs to fetch detailed stats
      const videoIds = data.items.map((item: any) => item.id.videoId);
      
      if (videoIds.length > 0) {
        const detailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds.join(',')}&part=snippet,contentDetails,statistics`
        );
        
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          
          for (const video of detailsData.items) {
            videos.push({
              title: video.snippet.title,
              description: video.snippet.description || '',
              publishedAt: video.snippet.publishedAt,
              duration: video.contentDetails?.duration,
              viewCount: parseInt(video.statistics?.viewCount || '0'),
              commentCount: parseInt(video.statistics?.commentCount || '0'),
            });
          }
        }
      }

      nextPageToken = data.nextPageToken;
      if (!nextPageToken) break;
    }

    return videos;
  } catch (error) {
    console.error('Error fetching videos:', error);
    return videos;
  }
}

function parseDuration(duration: string): number {
  // Parse ISO 8601 duration (PT15M30S) to minutes
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 60 + minutes + seconds / 60;
}

async function analyzeVideosWithAI(videos: VideoData[]): Promise<{
  nicheClassification: {
    primaryNiche: string;
    consistency: number;
    topicDiversity: string[];
  };
  complexityAnalysis: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
}> {
  try {
    // Prepare video data for AI analysis (limit to 100 most recent for token efficiency)
    const recentVideos = videos.slice(0, 100);
    const videoTitles = recentVideos.map(v => v.title).join('\n');

    const prompt = `Analyze these YouTube video titles and classify them:

VIDEO TITLES:
${videoTitles}

Please provide:
1. The PRIMARY NICHE (choose the MOST ACCURATE category):
   - Technology & Programming (coding, software, web dev, apps)
   - Business & Finance (entrepreneurship, investing, money management)
   - Marketing & Sales (advertising, branding, growth strategies)
   - Design & Creative (graphic design, UI/UX, visual arts)
   - Personal Development (self-improvement, productivity, mindset)
   - Health & Fitness (workouts, nutrition, wellness)
   - Food & Cooking (recipes, culinary techniques, restaurant, chef)
   - Education & Teaching (academic subjects, tutorials, how-to)
   - Gaming & Entertainment (video games, esports, streaming)
   - Lifestyle & Vlog (daily life, experiences, personal stories)
   - Data Science & AI (machine learning, analytics, AI)
   - Content Creation (YouTube tips, video production, creator economy)
   - Photography & Videography (camera work, editing, cinematography)
   - Music Production (music making, audio engineering, DJing)
   - Travel & Adventure (destinations, travel tips, exploration)
   - Sports & Athletics (sports training, athletics, competitions)
   - Other (if none of the above fit)

2. Topic consistency percentage (0-100): How focused are these videos on one niche?
3. Top 5 recurring topics/themes
4. Complexity distribution:
   - Basic (beginner-friendly): X%
   - Intermediate: Y%
   - Advanced (expert-level): Z%

Respond ONLY in this JSON format:
{
  "primaryNiche": "Category Name",
  "consistency": 85,
  "topTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "complexity": {
    "basic": 30,
    "intermediate": 50,
    "advanced": 20
  }
}`;

    // Use Gemini API for classification
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      // Fallback to basic analysis without AI
      return fallbackAnalysis(videos);
    }

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
            maxOutputTokens: 1000,
          }
        })
      }
    );

    if (!response.ok) {
      return fallbackAnalysis(videos);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        nicheClassification: {
          primaryNiche: parsed.primaryNiche || 'Other',
          consistency: parsed.consistency || 50,
          topicDiversity: parsed.topTopics || [],
        },
        complexityAnalysis: {
          basic: parsed.complexity?.basic || 33,
          intermediate: parsed.complexity?.intermediate || 34,
          advanced: parsed.complexity?.advanced || 33,
        }
      };
    }

    return fallbackAnalysis(videos);
  } catch (error) {
    console.error('AI analysis error:', error);
    return fallbackAnalysis(videos);
  }
}

function fallbackAnalysis(videos: VideoData[]): {
  nicheClassification: {
    primaryNiche: string;
    consistency: number;
    topicDiversity: string[];
  };
  complexityAnalysis: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
} {
  // Basic keyword-based classification
  const keywords = {
    'Technology & Programming': ['code', 'programming', 'javascript', 'python', 'react', 'web', 'developer', 'software', 'coding', 'app', 'tech'],
    'Business & Finance': ['business', 'finance', 'money', 'investment', 'startup', 'entrepreneur', 'investing', 'stocks'],
    'Marketing & Sales': ['marketing', 'seo', 'social media', 'ads', 'sales', 'brand', 'advertising', 'growth'],
    'Design & Creative': ['design', 'ui', 'ux', 'photoshop', 'illustrator', 'creative', 'graphic', 'visual'],
    'Personal Development': ['productivity', 'habits', 'mindset', 'growth', 'motivation', 'self-improvement', 'success'],
    'Food & Cooking': ['cook', 'recipe', 'food', 'chef', 'kitchen', 'meal', 'dish', 'restaurant', 'culinary', 'baking', 'grilling'],
    'Health & Fitness': ['fitness', 'workout', 'health', 'exercise', 'gym', 'nutrition', 'diet', 'training', 'wellness'],
    'Gaming & Entertainment': ['game', 'gaming', 'play', 'gameplay', 'streamer', 'esports', 'entertainment'],
    'Travel & Adventure': ['travel', 'trip', 'adventure', 'destination', 'explore', 'journey', 'vacation', 'tour'],
    'Content Creation': ['youtube', 'creator', 'content', 'video', 'subscriber', 'channel', 'vlog'],
    'Music Production': ['music', 'beat', 'producer', 'audio', 'mixing', 'sound', 'dj'],
    'Sports & Athletics': ['sport', 'athlete', 'training', 'competition', 'football', 'basketball', 'soccer'],
  };

  const nicheCounts: Record<string, number> = {};
  const videoNicheMatches: Record<string, number> = {}; // Track videos per niche
  
  for (const video of videos) {
    const text = (video.title + ' ' + video.description).toLowerCase();
    let videoMatchedNiche = false;
    
    for (const [niche, terms] of Object.entries(keywords)) {
      const matches = terms.filter(term => text.includes(term)).length;
      if (matches > 0) {
        nicheCounts[niche] = (nicheCounts[niche] || 0) + matches;
        videoNicheMatches[niche] = (videoNicheMatches[niche] || 0) + 1;
        videoMatchedNiche = true;
      }
    }
  }

  const sortedNiches = Object.entries(nicheCounts).sort(([, a], [, b]) => b - a);
  const primaryNiche = sortedNiches[0]?.[0] || 'Other';
  
  // Calculate consistency: percentage of videos that match the primary niche
  const primaryNicheVideoCount = videoNicheMatches[primaryNiche] || 0;
  const consistency = videos.length > 0 
    ? Math.round((primaryNicheVideoCount / videos.length) * 100)
    : 50;

  // Extract top topics based on keyword matches
  const topTopics = sortedNiches.slice(0, 5).map(([niche]) => niche);

  return {
    nicheClassification: {
      primaryNiche,
      consistency: Math.max(consistency, 30), // Minimum 30% to avoid too low scores
      topicDiversity: topTopics.length > 0 ? topTopics : ['General Topics'],
    },
    complexityAnalysis: {
      basic: 40,
      intermediate: 40,
      advanced: 20,
    }
  };
}

function calculateAuthorityScore(
  videos: VideoData[],
  channelData: any,
  aiAnalysis: {
    nicheClassification: {
      primaryNiche: string;
      consistency: number;
      topicDiversity: string[];
    };
    complexityAnalysis: {
      basic: number;
      intermediate: number;
      advanced: number;
    };
  }
): AuthorityResult {
  // Signal 1: Topic Consistency (0-25 points)
  const consistencyScore = Math.min((aiAnalysis.nicheClassification.consistency / 100) * 25, 25);

  // Signal 2: Content Depth (0-20 points)
  const avgDuration = videos.reduce((sum, v) => {
    const duration = v.duration ? parseDuration(v.duration) : 0;
    return sum + duration;
  }, 0) / videos.length;

  let depthScore = 0;
  if (avgDuration >= 20) depthScore = 20;
  else if (avgDuration >= 15) depthScore = 17;
  else if (avgDuration >= 10) depthScore = 14;
  else if (avgDuration >= 5) depthScore = 10;
  else depthScore = avgDuration * 2;

  // Signal 3: Progression (0-20 points)
  // Higher score if they have good mix of basic, intermediate, and advanced
  const { basic, intermediate, advanced } = aiAnalysis.complexityAnalysis;
  const hasProgression = basic > 0 && intermediate > 0 && advanced > 0;
  const progressionBalance = Math.min(basic, intermediate, advanced);
  let progressionScore = hasProgression ? 15 : 10;
  if (progressionBalance >= 20) progressionScore = 20;
  else if (progressionBalance >= 15) progressionScore = 17;

  // Signal 4: Longevity (0-20 points)
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );
  const firstVideoDate = new Date(sortedVideos[0]?.publishedAt);
  const monthsActive = (Date.now() - firstVideoDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  let longevityScore = 0;
  if (monthsActive >= 60) longevityScore = 20; // 5+ years
  else if (monthsActive >= 36) longevityScore = 17; // 3+ years
  else if (monthsActive >= 24) longevityScore = 14; // 2+ years
  else if (monthsActive >= 12) longevityScore = 10; // 1+ year
  else longevityScore = Math.min(monthsActive * 0.8, 10);

  // Signal 5: Audience Validation (0-15 points)
  const totalComments = videos.reduce((sum, v) => sum + (v.commentCount || 0), 0);
  const avgComments = totalComments / videos.length;
  
  let audienceScore = 0;
  if (avgComments >= 100) audienceScore = 15;
  else if (avgComments >= 50) audienceScore = 13;
  else if (avgComments >= 25) audienceScore = 11;
  else if (avgComments >= 10) audienceScore = 8;
  else audienceScore = Math.min(avgComments * 0.8, 15);

  const totalScore = Math.min(
    Math.round(consistencyScore + depthScore + progressionScore + longevityScore + audienceScore),
    100
  );

  // Generate explanation and level
  let authorityLevel = "";
  let explanation: string[] = [];
  let reassurance = "";

  if (totalScore >= 80) {
    authorityLevel = "🏆 Master Authority";
    explanation = [
      `You demonstrate exceptional expertise in ${aiAnalysis.nicheClassification.primaryNiche}`,
      `${Math.round(aiAnalysis.nicheClassification.consistency)}% topic consistency shows deep niche focus`,
      `Your ${Math.round(avgDuration)}-minute average videos provide substantial depth`,
      `${Math.round(monthsActive)} months of consistent content creation builds massive trust`,
      `Strong audience engagement (${Math.round(avgComments)} avg comments) validates your authority`
    ];
    reassurance = "Creators with your level of authority successfully sell courses ranging from ₹5,000 to ₹25,000+. Your expertise commands premium pricing.";
  } else if (totalScore >= 65) {
    authorityLevel = "⭐ Recognized Practitioner";
    explanation = [
      `You consistently teach ${aiAnalysis.nicheClassification.primaryNiche} topics`,
      `You cover ${advanced > 0 ? 'intermediate + advanced' : 'beginner to intermediate'} level content`,
      `${videos.length} videos with ${Math.round(avgDuration)}-min average shows commitment`,
      `${Math.round(monthsActive)} months active demonstrates consistency`
    ];
    reassurance = "Creators at your level successfully sell courses from ₹2,000 to ₹10,000. Your authority is sufficient for most course topics.";
  } else if (totalScore >= 50) {
    authorityLevel = "✅ Emerging Expert";
    explanation = [
      `You're building solid expertise in ${aiAnalysis.nicheClassification.primaryNiche}`,
      `${Math.round(aiAnalysis.nicheClassification.consistency)}% niche consistency is good`,
      `Continue focusing on depth (current avg: ${Math.round(avgDuration)} min)`,
      `${videos.length} videos shows you're committed to teaching`
    ];
    reassurance = "Many successful course creators start at your level. You can confidently sell courses from ₹999 to ₹5,000 while continuing to build authority.";
  } else {
    authorityLevel = "🌱 Developing Authority";
    explanation = [
      `You're on the journey in ${aiAnalysis.nicheClassification.primaryNiche}`,
      "Focus on creating consistent, in-depth content in one niche",
      "Document your learning journey - beginners can teach beginners",
      "Authority grows with consistent output and audience engagement"
    ];
    reassurance = "Don't let imposter syndrome stop you! Even creators with lower authority scores successfully sell ₹499 to ₹2,000 courses. Your unique perspective has value.";
  }

  return {
    totalScore,
    breakdown: {
      consistency: Math.round(consistencyScore),
      depth: Math.round(depthScore),
      progression: Math.round(progressionScore),
      longevity: Math.round(longevityScore),
      audienceValidation: Math.round(audienceScore),
    },
    authorityLevel,
    explanation,
    reassurance,
    nicheClassification: aiAnalysis.nicheClassification,
    complexityAnalysis: aiAnalysis.complexityAnalysis,
  };
}
