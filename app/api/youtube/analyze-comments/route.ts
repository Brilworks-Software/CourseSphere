import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { comments, videoTitle } = await request.json();

    if (!comments || comments.length === 0) {
      return NextResponse.json(
        { error: 'Comments are required' },
        { status: 400 }
      );
    }

    console.log('=== Analyzing Comments ===');
    console.log('Total comments:', comments.length);
    console.log('Video:', videoTitle);

    // Build prompt for AI analysis
    const prompt = buildAnalysisPrompt(comments, videoTitle);

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    console.log('AI Response received, length:', aiResponse?.length || 0);

    // Parse AI response
    const insights = parseInsights(aiResponse);

    return NextResponse.json({
      success: true,
      insights,
      rawAnalysis: aiResponse,
    });

  } catch (error: any) {
    console.error('Comment Analysis Error:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
    });

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: error?.message || 'Failed to analyze comments. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
      },
      { status: 500 }
    );
  }
}

function buildAnalysisPrompt(comments: any[], videoTitle: string): string {
  let prompt = `You are an expert course curriculum designer. Analyze these YouTube video comments and organize them into course modules.\n\n`;
  
  prompt += `Video Title: "${videoTitle}"\n\n`;
  prompt += `COMMENTS (${comments.length} total):\n`;
  
  comments.slice(0, 200).forEach((comment, index) => {
    const cleanText = comment.textOriginal.replace(/<[^>]*>/g, '');
    prompt += `${index + 1}. "${cleanText}" (${comment.likeCount} likes)\n`;
  });
  
  prompt += `\n\nANALYZE these comments and group them into course modules based on:\n`;
  prompt += `1. BEGINNER CONFUSION - Questions showing fundamental gaps\n`;
  prompt += `2. INTERMEDIATE REQUESTS - People asking for deeper explanations\n`;
  prompt += `3. ADVANCED REQUESTS - Requests for complex topics or edge cases\n`;
  prompt += `4. MONETIZATION SIGNALS - People expressing willingness to pay or asking for paid resources\n`;
  prompt += `5. PAIN POINTS - Specific problems people are struggling with\n\n`;
  
  prompt += `For each category, provide:\n`;
  prompt += `- Module name (catchy, specific)\n`;
  prompt += `- Description (what this module would teach)\n`;
  prompt += `- Key topics (3-5 bullet points)\n`;
  prompt += `- Comment examples (the actual comment IDs/numbers that fit this module)\n`;
  prompt += `- Priority (high/medium/low based on frequency and engagement)\n`;
  prompt += `- Estimated lessons (how many lessons this would need)\n\n`;
  
  prompt += `Return your response as a JSON object with this structure:\n`;
  prompt += `{\n`;
  prompt += `  "modules": [\n`;
  prompt += `    {\n`;
  prompt += `      "category": "beginner/intermediate/advanced/monetization/pain_point",\n`;
  prompt += `      "name": "Module name",\n`;
  prompt += `      "description": "What this teaches",\n`;
  prompt += `      "keyTopics": ["topic1", "topic2", "topic3"],\n`;
  prompt += `      "commentIds": [1, 5, 12, ...],\n`;
  prompt += `      "commentCount": 12,\n`;
  prompt += `      "priority": "high/medium/low",\n`;
  prompt += `      "estimatedLessons": 5\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "summary": {\n`;
  prompt += `    "topDemand": "What people want most",\n`;
  prompt += `    "monetizationSignals": "Evidence people would pay",\n`;
  prompt += `    "gapsInContent": "What's missing from the video"\n`;
  prompt += `  }\n`;
  prompt += `}\n\n`;
  
  prompt += `IMPORTANT: Return ONLY the JSON object, no additional text or markdown formatting.`;
  
  return prompt;
}

function parseInsights(response: string | null): any {
  if (!response) return null;

  try {
    // Remove markdown code blocks if present
    let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to extract JSON object
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed insights with', parsed.modules?.length || 0, 'modules');
      return parsed;
    }

    console.warn('No JSON object found in response');
    return null;
  } catch (error) {
    console.error('Error parsing insights:', error);
    console.error('Response was:', response?.substring(0, 500));
    return null;
  }
}
