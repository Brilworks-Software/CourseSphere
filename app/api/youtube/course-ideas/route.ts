import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { channelUrl, videoUrl, transcript, inputType } = await request.json();

    if (!channelUrl && !videoUrl && !transcript) {
      return NextResponse.json(
        { error: 'Channel URL, Video URL, or Transcript is required' },
        { status: 400 }
      );
    }

    let channelHandle = null;
    let videoId = null;

    // Extract channel handle or video ID based on input type
    if (inputType === 'channel' && channelUrl) {
      channelHandle = extractChannelHandle(channelUrl);
      if (!channelHandle) {
        return NextResponse.json(
          { error: 'Invalid YouTube channel URL' },
          { status: 400 }
        );
      }
    } else if (inputType === 'video' && videoUrl) {
      videoId = extractVideoId(videoUrl);
      if (!videoId) {
        return NextResponse.json(
          { error: 'Invalid YouTube video URL' },
          { status: 400 }
        );
      }
    }

    let analysisData: any = {
      channelName: '',
      channelImage: '',
      subscribers: 0,
      avgViews: 0,
      avgComments: 0,
      totalPosts: 0,
      engagementRate: 0,
    };

    // Fetch channel data if channel URL provided
    if (channelHandle) {
      console.log('Fetching channel data for:', channelHandle);
      const response = await fetch('https://free-tools.socialinsider.io/api', {
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

      if (response.ok) {
        const data = await response.json();
        console.log('Social Insider Response:', {
          name: data.profile_name,
          hasImage: !!data.profile_image,
          imageUrl: data.profile_image,
          subscribers: data.profile_followers?.integer
        });
        analysisData = {
          channelName: data.profile_name || '',
          channelImage: data.profile_image || '',
          subscribers: data.profile_followers?.integer || 0,
          avgViews: Math.round(data.average_views_per_post?.float_1f || 0),
          avgComments: Math.round(data.comments?.float_1f || 0),
          totalPosts: data.posts || 0,
          engagementRate: data.engagement_rate?.float_2f || 0,
        };
        console.log('✅ Social Insider data fetched successfully');
      } else {
        const errorText = await response.text();
        console.error('❌ Social Insider API error:', response.status, errorText);
        console.log('⚠️ Will attempt to fetch data from YouTube API as fallback');
      }
    }

    // Fetch YouTube API data for top videos
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    let topVideos: any[] = [];
    let channelId: string | null = null;
    
    if (youtubeApiKey && channelHandle) {
      // Get channel ID first if we have a handle
      channelId = await getChannelIdFromHandle(channelHandle, youtubeApiKey);
      
      if (channelId) {
        // If Social Insider didn't provide data, fetch from YouTube API
        if (!analysisData.subscribers || analysisData.subscribers === 0) {
          try {
            const channelResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/channels?key=${youtubeApiKey}&id=${channelId}&part=snippet,statistics`
            );
            
            if (channelResponse.ok) {
              const channelData = await channelResponse.json();
              if (channelData.items && channelData.items.length > 0) {
                const channel = channelData.items[0];
                analysisData.channelName = channel.snippet.title || analysisData.channelName;
                analysisData.channelImage = channel.snippet.thumbnails?.default?.url || analysisData.channelImage;
                analysisData.subscribers = parseInt(channel.statistics.subscriberCount) || 0;
                analysisData.totalPosts = parseInt(channel.statistics.videoCount) || 0;
                console.log('✅ Fetched channel data from YouTube API:', {
                  name: analysisData.channelName,
                  subscribers: analysisData.subscribers,
                  videos: analysisData.totalPosts
                });
              }
            }
          } catch (error) {
            console.error('Error fetching YouTube channel data:', error);
          }
        }
        
        // Fetch top videos from the channel
        const videosResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&channelId=${channelId}&part=snippet&order=viewCount&type=video&maxResults=20`
        );
        
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          topVideos = videosData.items || [];
        }
      }
    } else if (youtubeApiKey && videoId) {
      // Fetch single video data with detailed statistics
      const videoResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?key=${youtubeApiKey}&id=${videoId}&part=snippet,statistics,contentDetails`
      );
      
      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        topVideos = videoData.items || [];
        
        // Extract video details for display
        if (videoData.items && videoData.items.length > 0) {
          const video = videoData.items[0];
          analysisData = {
            videoTitle: video.snippet?.title || '',
            videoThumbnail: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url || '',
            videoViews: parseInt(video.statistics?.viewCount || '0'),
            videoLikes: parseInt(video.statistics?.likeCount || '0'),
            videoComments: parseInt(video.statistics?.commentCount || '0'),
            channelName: video.snippet?.channelTitle || '',
            publishedAt: video.snippet?.publishedAt || '',
          };
        }
      }
    }

    // Fetch comments for videos (limited to prevent rate limiting)
    const videosWithComments = await Promise.all(
      topVideos.slice(0, 5).map(async (video) => {
        const vId = video.id?.videoId || video.id;
        if (!vId || !youtubeApiKey) return { ...video, comments: [] };

        try {
          const commentsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/commentThreads?key=${youtubeApiKey}&videoId=${vId}&part=snippet&maxResults=50&order=relevance`
          );

          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            const comments = (commentsData.items || []).map((item: any) => ({
              text: item.snippet.topLevelComment.snippet.textDisplay,
              likeCount: item.snippet.topLevelComment.snippet.likeCount,
              author: item.snippet.topLevelComment.snippet.authorDisplayName,
              authorImage: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
              publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
            }));
            return { ...video, comments };
          }
        } catch (error) {
          console.error('Error fetching comments:', error);
        }
        return { ...video, comments: [] };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        ...analysisData,
        topVideos: videosWithComments,
        videoId,
        transcript: transcript || null,
        inputType,
      }
    });

  } catch (error) {
    console.error('YouTube Course Ideas API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube data. Please try again.' },
      { status: 500 }
    );
  }
}

async function getChannelIdFromHandle(handle: string, apiKey: string): Promise<string | null> {
  try {
    // Remove @ if present
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${cleanHandle}&type=channel&part=snippet&maxResults=1`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].snippet.channelId;
      }
    }
  } catch (error) {
    console.error('Error getting channel ID:', error);
  }
  return null;
}

function extractChannelHandle(url: string): string | null {
  try {
    // @username format
    const handleMatch = url.match(/@([a-zA-Z0-9_-]+)/);
    if (handleMatch) {
      return handleMatch[0];
    }

    // /c/ChannelName or /channel/ChannelID format
    const channelMatch = url.match(/\/(c|channel)\/([a-zA-Z0-9_-]+)/);
    if (channelMatch) {
      return channelMatch[2];
    }

    // If it's just the handle/ID without full URL
    if (url.startsWith('@') || /^[a-zA-Z0-9_-]+$/.test(url)) {
      return url.startsWith('@') ? url : `@${url}`;
    }

    return null;
  } catch (error) {
    return null;
  }
}

function extractVideoId(url: string): string | null {
  try {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    // If it's just the video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }

    return null;
  } catch (error) {
    return null;
  }
}
