import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface VideoData {
  title: string;
  description: string;
  viewCount?: number;
  comments: Array<{ text: string; likeCount: number }>;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      topVideos, 
      transcript, 
      channelName, 
      subscribers,
      engagementRate,
      inputType 
    } = await request.json();

    if (!topVideos && !transcript) {
      return NextResponse.json(
        { error: 'Video data or transcript is required' },
        { status: 400 }
      );
    }

    // Prepare data for AI analysis
    const videosData: VideoData[] = topVideos?.map((video: any) => ({
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      viewCount: video.statistics?.viewCount,
      comments: video.comments || [],
    })) || [];

    // Build AI prompt
    const prompt = buildAnalysisPrompt(videosData, transcript, channelName, subscribers, engagementRate, inputType);

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const systemInstruction = "You are an expert online course strategist and content analyst. You specialize in analyzing YouTube content and audience needs to create profitable course ideas.";
    const fullPrompt = `${systemInstruction}\n\n${prompt}`;
    
    console.log('=== Generating Course Ideas ===');
    console.log('Channel:', channelName);
    console.log('Videos count:', videosData.length);
    console.log('Using Gemini API...');
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiResponse = response.text();
    
    console.log('AI Response received, length:', aiResponse?.length || 0);

    // Parse AI response to extract structured course ideas
    const courseIdeas = parseAIResponse(aiResponse);

    return NextResponse.json({
      success: true,
      courseIdeas,
      rawAnalysis: aiResponse,
    });

  } catch (error: any) {
    console.error('AI Generation Error:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      response: error?.response
    });
    
    // If Gemini API key is missing, return helpful error
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: error?.message || 'Failed to generate course ideas. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
      },
      { status: 500 }
    );
  }
}

function buildAnalysisPrompt(
  videos: VideoData[], 
  transcript: string | null, 
  channelName: string,
  subscribers: number,
  engagementRate: number,
  inputType: string
): string {
  let prompt = `Analyze the following YouTube content and generate 5 highly specific, profitable online course ideas.\n\n`;

  if (channelName) {
    prompt += `Channel: ${channelName}\n`;
    prompt += `Subscribers: ${subscribers?.toLocaleString() || 'Unknown'}\n`;
    prompt += `Engagement Rate: ${engagementRate?.toFixed(2) || 'Unknown'}%\n\n`;
  }

  if (inputType === 'channel' && videos.length > 0) {
    prompt += `TOP PERFORMING VIDEOS:\n`;
    videos.slice(0, 10).forEach((video, index) => {
      prompt += `\n${index + 1}. "${video.title}"\n`;
      if (video.description) {
        prompt += `   Description: ${video.description.slice(0, 200)}...\n`;
      }
      if (video.viewCount) {
        prompt += `   Views: ${Number(video.viewCount).toLocaleString()}\n`;
      }
    });
    prompt += `\n`;
  }

  // Add comments analysis
  const allComments = videos.flatMap(v => v.comments).slice(0, 100);
  if (allComments.length > 0) {
    prompt += `TOP AUDIENCE COMMENTS (showing pain points and questions):\n`;
    allComments
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 30)
      .forEach((comment, index) => {
        const cleanText = comment.text.replace(/<[^>]*>/g, '').slice(0, 150);
        prompt += `${index + 1}. "${cleanText}..." (${comment.likeCount} likes)\n`;
      });
    prompt += `\n`;
  }

  if (transcript) {
    prompt += `VIDEO TRANSCRIPT:\n${transcript.slice(0, 3000)}...\n\n`;
  }

  prompt += `Based on this analysis, generate EXACTLY 5 course ideas that:\n`;
  prompt += `1. Solve specific problems mentioned in comments or implied by video topics\n`;
  prompt += `2. Are monetizable and have clear demand signals\n`;
  prompt += `3. Match the creator's expertise level\n`;
  prompt += `4. Can be realistically created and sold\n\n`;

  prompt += `For each course idea, provide:\n`;
  prompt += `- Course Title (catchy and specific)\n`;
  prompt += `- Target Audience (who is this for?)\n`;
  prompt += `- Problem It Solves (be specific)\n`;
  prompt += `- Format (course/cohort/workshop/bootcamp)\n`;
  prompt += `- Suggested Duration (hours/weeks)\n`;
  prompt += `- Price Range (in INR)\n`;
  prompt += `- Key Topics (3-5 bullet points)\n`;
  prompt += `- Demand Signal (why people will buy this)\n\n`;

  prompt += `Format your response as JSON array with this structure:\n`;
  prompt += `[\n`;
  prompt += `  {\n`;
  prompt += `    "title": "...",\n`;
  prompt += `    "targetAudience": "...",\n`;
  prompt += `    "problemSolved": "...",\n`;
  prompt += `    "format": "...",\n`;
  prompt += `    "duration": "...",\n`;
  prompt += `    "priceRange": { "min": 0, "max": 0 },\n`;
  prompt += `    "keyTopics": ["...", "...", "..."],\n`;
  prompt += `    "demandSignal": "...",\n`;
  prompt += `    "confidence": "high/medium/low"\n`;
  prompt += `  }\n`;
  prompt += `]\n\n`;

  prompt += `IMPORTANT: Return ONLY the JSON array, no additional text or explanation. Be realistic, specific, and actionable. Focus on courses that have evidence of demand.`;

  return prompt;
}

function parseAIResponse(response: string | null): any[] {
  if (!response) return [];

  try {
    // Try to extract JSON from the response
    // Remove markdown code blocks if present
    let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed', parsed.length, 'course ideas');
      return parsed;
    }

    console.warn('No JSON array found in response');
    // If no JSON found, return empty array
    return [];
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.error('Response was:', response?.substring(0, 500));
    return [];
  }
}
