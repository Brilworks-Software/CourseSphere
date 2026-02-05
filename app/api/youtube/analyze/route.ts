import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { channelUrl } = await request.json();

    if (!channelUrl) {
      return NextResponse.json(
        { error: 'Channel URL is required' },
        { status: 400 }
      );
    }

    // Extract channel handle or ID from URL
    const channelHandle = extractChannelHandle(channelUrl);
    
    if (!channelHandle) {
      return NextResponse.json(
        { error: 'Invalid YouTube channel URL' },
        { status: 400 }
      );
    }

    // Call the social analytics API
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

    if (!response.ok) {
      throw new Error('Failed to fetch channel data');
    }

    const data = await response.json();

    // Map the API response to our format
    const channelData = {
      subscribers: data.profile_followers?.integer || 0,
      avgViews: Math.round(data.average_views_per_post?.float_1f || 0),
      avgComments: Math.round(data.comments?.float_1f || 0),
      uploadsPerMonth: Math.round((data.average_post_per_day || 0) * 30),
      engagementRate: data.engagement_rate?.float_2f || 0,
      totalPosts: data.posts || 0,
      channelName: data.profile_name || '',
      channelImage: data.profile_image || ''
    };

    return NextResponse.json({ 
      success: true, 
      data: channelData 
    });

  } catch (error) {
    console.error('YouTube API Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze channel. Please try manual input.' },
      { status: 500 }
    );
  }
}

function extractChannelHandle(url: string): string | null {
  try {
    // Handle different YouTube URL formats
    // @username format
    const handleMatch = url.match(/@([a-zA-Z0-9_-]+)/);
    if (handleMatch) {
      return handleMatch[0]; // Return with @
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
