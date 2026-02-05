import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube video URL' },
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

    // Fetch video details
    console.log('Fetching video details for:', videoId);
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?key=${youtubeApiKey}&id=${videoId}&part=snippet,statistics`
    );

    if (!videoResponse.ok) {
      throw new Error('Failed to fetch video details');
    }

    const videoData = await videoResponse.json();
    if (!videoData.items || videoData.items.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const video = videoData.items[0];
    const videoInfo = {
      title: video.snippet?.title || '',
      thumbnail: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url || '',
      channelName: video.snippet?.channelTitle || '',
      views: parseInt(video.statistics?.viewCount || '0'),
      likes: parseInt(video.statistics?.likeCount || '0'),
      commentCount: parseInt(video.statistics?.commentCount || '0'),
      publishedAt: video.snippet?.publishedAt || '',
    };

    // Fetch comments
    console.log('Fetching comments...');
    const comments = await fetchAllComments(videoId, youtubeApiKey);
    console.log(`Fetched ${comments.length} comments`);

    // Process comments: deduplicate and remove spam
    const processedComments = processComments(comments);
    console.log(`Processed to ${processedComments.length} unique comments`);

    return NextResponse.json({
      success: true,
      videoInfo,
      comments: processedComments,
      totalComments: comments.length,
      processedComments: processedComments.length,
    });

  } catch (error: any) {
    console.error('Comment Insights API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch video comments' },
      { status: 500 }
    );
  }
}

async function fetchAllComments(videoId: string, apiKey: string): Promise<any[]> {
  const comments: any[] = [];
  let pageToken: string | undefined = undefined;
  const maxResults = 100; // Fetch up to 100 per page
  const maxPages = 5; // Max 5 pages (500 comments total)
  let pageCount = 0;

  try {
    do {
      const url: string = `https://www.googleapis.com/youtube/v3/commentThreads?key=${apiKey}&videoId=${videoId}&part=snippet&maxResults=${maxResults}&order=relevance${pageToken ? `&pageToken=${pageToken}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error('YouTube API error:', response.status);
        break;
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const pageComments = data.items.map((item: any) => ({
          id: item.id,
          text: item.snippet.topLevelComment.snippet.textDisplay,
          textOriginal: item.snippet.topLevelComment.snippet.textOriginal,
          author: item.snippet.topLevelComment.snippet.authorDisplayName,
          authorImage: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
          likeCount: item.snippet.topLevelComment.snippet.likeCount,
          publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
          replyCount: item.snippet.totalReplyCount || 0,
        }));
        
        comments.push(...pageComments);
      }

      pageToken = data.nextPageToken;
      pageCount++;

    } while (pageToken && pageCount < maxPages);

  } catch (error) {
    console.error('Error fetching comments:', error);
  }

  return comments;
}

function processComments(comments: any[]): any[] {
  // Remove duplicates based on similar text
  const uniqueComments = new Map<string, any>();
  
  for (const comment of comments) {
    // Normalize text for comparison
    const normalizedText = comment.textOriginal
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim();
    
    // Skip very short comments (likely spam or reactions)
    if (normalizedText.length < 10) continue;
    
    // Skip common spam patterns
    if (isSpam(normalizedText)) continue;
    
    // Check if we already have a similar comment
    let isDuplicate = false;
    for (const [key, existingComment] of uniqueComments.entries()) {
      if (areSimilar(normalizedText, key)) {
        // Keep the one with more likes
        if (comment.likeCount > existingComment.likeCount) {
          uniqueComments.delete(key);
          uniqueComments.set(normalizedText, comment);
        }
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      uniqueComments.set(normalizedText, comment);
    }
  }
  
  // Convert back to array and sort by likes
  return Array.from(uniqueComments.values())
    .sort((a, b) => b.likeCount - a.likeCount);
}

function isSpam(text: string): boolean {
  const spamPatterns = [
    /^(nice|great|good|awesome|cool|wow|lol|haha|😂|🔥|❤️)$/i,
    /check out my (channel|video)/i,
    /subscribe to my channel/i,
    /click here/i,
    /free download/i,
    /^first$/i,
    /^second$/i,
    /^third$/i,
  ];
  
  return spamPatterns.some(pattern => pattern.test(text));
}

function areSimilar(text1: string, text2: string): boolean {
  // Simple similarity check: if 80% of characters match
  if (text1.length < 20 && text2.length < 20) {
    return text1 === text2;
  }
  
  const shorter = text1.length < text2.length ? text1 : text2;
  const longer = text1.length >= text2.length ? text1 : text2;
  
  return longer.includes(shorter) || 
         calculateSimilarity(text1, text2) > 0.8;
}

function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);
  
  if (maxLen === 0) return 1.0;
  
  let matches = 0;
  const minLen = Math.min(len1, len2);
  
  for (let i = 0; i < minLen; i++) {
    if (str1[i] === str2[i]) matches++;
  }
  
  return matches / maxLen;
}

function extractVideoId(url: string): string | null {
  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }

    return null;
  } catch (error) {
    return null;
  }
}
