import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
const { YoutubeTranscript } = require('youtube-transcript');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function extractVideoId(url: string): string | null {
  try {
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
  } catch {
    return null;
  }
}

async function fetchVideoTranscript(videoId: string): Promise<string | null> {
  try {
    // Use youtube-transcript to fetch captions
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      return null;
    }

    // Combine all transcript text
    const text = transcript
      .map((item: any) => item.text)
      .join(' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return text;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return null;
  }
}

async function getVideoMetadata(videoId: string) {
  try {
    // For now, return null as we're not using YouTube Data API
    // The tool will work without metadata
    return null;
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return null;
  }
}

function cleanTranscript(text: string): string {
  // Remove common video fluff
  const fluffPatterns = [
    /hey (guys|everyone|folks),?/gi,
    /what'?s up/gi,
    /before we (start|begin)/gi,
    /don'?t forget to (like|subscribe|hit the bell)/gi,
    /if you (liked|enjoyed) this video/gi,
    /thanks for watching/gi,
    /see you (next time|in the next video)/gi,
  ];

  let cleaned = text;
  for (const pattern of fluffPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

async function generateCourseOutline(content: string, metadata?: any) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert instructional designer. Convert this content into a structured online course outline.

${metadata ? `
Video Title: ${metadata.title}
Video Description: ${metadata.description}
` : ''}

Content:
${content.substring(0, 15000)} ${content.length > 15000 ? '...(truncated)' : ''}

Create a comprehensive course outline with the following structure:

1. COURSE_TITLE: A compelling, clear course title
2. COURSE_DESCRIPTION: 2-3 sentence overview of what students will learn
3. TARGET_AUDIENCE: Who this course is for (be specific)
4. PREREQUISITES: List 2-4 prerequisites (or "None" if beginner-friendly)
5. ESTIMATED_DURATION: Total course duration (e.g., "8 hours" or "4 weeks")

Then create 4-6 modules, each with:
- MODULE_NUMBER: 1, 2, 3, etc.
- MODULE_TITLE: Clear, action-oriented title
- MODULE_DESCRIPTION: What this module covers (1 sentence)
- LESSONS: 3-5 lessons, each with:
  * LESSON_TITLE: Specific lesson name
  * LESSON_DURATION: Estimated duration (e.g., "15 min")
  * LEARNING_OUTCOME: What students will achieve (start with action verb)
- SUGGESTED_EXERCISE: One practical exercise for the module

Finally, provide:
- CONTENT_QUALITY: 2-3 sentences assessing the teaching quality and completeness
- STRUCTURE_RECOMMENDATIONS: 2-3 sentences on how to improve the structure
- NEXT_STEPS: 2-3 sentences on what to do next to launch the course

Format your response EXACTLY as shown with clear labels and structure. Use the labels as provided.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return parseCourseOutline(response);
  } catch (error) {
    console.error('AI generation error:', error);
    return null;
  }
}

function parseCourseOutline(response: string) {
  try {
    // Extract course info
    const courseTitleMatch = response.match(/COURSE_TITLE:\s*([\s\S]+?)(?=\n|COURSE_DESCRIPTION:)/);
    const courseDescMatch = response.match(/COURSE_DESCRIPTION:\s*([\s\S]+?)(?=\n|TARGET_AUDIENCE:)/);
    const targetAudienceMatch = response.match(/TARGET_AUDIENCE:\s*([\s\S]+?)(?=\n|PREREQUISITES:)/);
    const prerequisitesMatch = response.match(/PREREQUISITES:\s*([\s\S]+?)(?=\n|ESTIMATED_DURATION:)/);
    const durationMatch = response.match(/ESTIMATED_DURATION:\s*([\s\S]+?)(?=\n|MODULE)/);

    const courseTitle = courseTitleMatch?.[1].trim() || 'Untitled Course';
    const courseDescription = courseDescMatch?.[1].trim() || 'Course description not available';
    const targetAudience = targetAudienceMatch?.[1].trim() || 'General audience';
    
    // Parse prerequisites
    const prerequisitesText = prerequisitesMatch?.[1].trim() || 'None';
    const prerequisites = prerequisitesText === 'None' || prerequisitesText.toLowerCase() === 'none'
      ? []
      : prerequisitesText
          .split(/\n|,|\d+\./)
          .map(p => p.trim())
          .filter(p => p && p.length > 3);

    const estimatedDuration = durationMatch?.[1].trim() || '6-8 hours';

    // Extract modules
    const modules: any[] = [];
    const modulePattern = /MODULE_NUMBER:\s*(\d+)\s*MODULE_TITLE:\s*([\s\S]+?)\s*MODULE_DESCRIPTION:\s*([\s\S]+?)\s*LESSONS:([\s\S]*?)SUGGESTED_EXERCISE:\s*([\s\S]+?)(?=MODULE_NUMBER:|CONTENT_QUALITY:|$)/g;
    
    let moduleMatch;
    while ((moduleMatch = modulePattern.exec(response)) !== null) {
      const moduleNumber = parseInt(moduleMatch[1]);
      const moduleTitle = moduleMatch[2].trim();
      const moduleDescription = moduleMatch[3].trim();
      const lessonsText = moduleMatch[4];
      const suggestedExercise = moduleMatch[5].trim();

      // Parse lessons
      const lessons: any[] = [];
      const lessonPattern = /LESSON_TITLE:\s*([\s\S]+?)\s*LESSON_DURATION:\s*([\s\S]+?)\s*LEARNING_OUTCOME:\s*([\s\S]+?)(?=LESSON_TITLE:|SUGGESTED_EXERCISE:|$)/g;
      
      let lessonMatch;
      while ((lessonMatch = lessonPattern.exec(lessonsText)) !== null) {
        lessons.push({
          title: lessonMatch[1].trim(),
          duration: lessonMatch[2].trim(),
          learningOutcome: lessonMatch[3].trim(),
        });
      }

      // If parsing failed, create generic lessons
      if (lessons.length === 0) {
        lessons.push(
          { title: 'Introduction', duration: '10 min', learningOutcome: 'Understand the module objectives' },
          { title: 'Core Concepts', duration: '20 min', learningOutcome: 'Learn key concepts' },
          { title: 'Practice', duration: '15 min', learningOutcome: 'Apply what you learned' }
        );
      }

      modules.push({
        moduleNumber,
        title: moduleTitle,
        description: moduleDescription,
        lessons,
        suggestedExercise,
      });
    }

    // If no modules parsed, create fallback modules
    if (modules.length === 0) {
      modules.push(
        {
          moduleNumber: 1,
          title: 'Introduction & Foundations',
          description: 'Get started with the fundamentals',
          lessons: [
            { title: 'Welcome & Overview', duration: '10 min', learningOutcome: 'Understand course objectives' },
            { title: 'Core Concepts', duration: '20 min', learningOutcome: 'Learn foundational concepts' },
          ],
          suggestedExercise: 'Complete a self-assessment quiz',
        },
        {
          moduleNumber: 2,
          title: 'Core Content',
          description: 'Deep dive into the main topics',
          lessons: [
            { title: 'Key Topics', duration: '25 min', learningOutcome: 'Master core skills' },
            { title: 'Practical Application', duration: '20 min', learningOutcome: 'Apply concepts to real scenarios' },
          ],
          suggestedExercise: 'Complete hands-on project',
        }
      );
    }

    // Extract insights
    const contentQualityMatch = response.match(/CONTENT_QUALITY:\s*([\s\S]+?)(?=\n|STRUCTURE_RECOMMENDATIONS:)/);
    const structureRecommendationsMatch = response.match(/STRUCTURE_RECOMMENDATIONS:\s*([\s\S]+?)(?=\n|NEXT_STEPS:)/);
    const nextStepsMatch = response.match(/NEXT_STEPS:\s*([\s\S]+?)$/);

    const insights = {
      contentQuality: contentQualityMatch?.[1].trim() || 'Your content has strong teaching potential and covers valuable material.',
      structureRecommendations: structureRecommendationsMatch?.[1].trim() || 'Consider breaking down complex topics into smaller lessons and adding more practical exercises.',
      nextSteps: nextStepsMatch?.[1].trim() || 'Start by recording or outlining the first module, then test it with a small group before building the rest.',
    };

    return {
      courseTitle,
      courseDescription,
      targetAudience,
      prerequisites,
      modules,
      estimatedDuration,
      insights,
    };
  } catch (error) {
    console.error('Error parsing course outline:', error);
    
    // Return fallback structure
    return {
      courseTitle: 'Course From Your Content',
      courseDescription: 'A structured course built from your existing content',
      targetAudience: 'Learners interested in this topic',
      prerequisites: [],
      modules: [
        {
          moduleNumber: 1,
          title: 'Getting Started',
          description: 'Introduction to the course material',
          lessons: [
            { title: 'Welcome', duration: '10 min', learningOutcome: 'Understand what you will learn' },
            { title: 'Foundations', duration: '20 min', learningOutcome: 'Learn core concepts' },
          ],
          suggestedExercise: 'Complete introductory exercise',
        },
      ],
      estimatedDuration: '4-6 hours',
      insights: {
        contentQuality: 'Your content shows teaching potential.',
        structureRecommendations: 'Add more structure and clear learning outcomes.',
        nextSteps: 'Start with the first module and test with your audience.',
      },
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inputType, videoUrl, transcript, outline } = body;

    // Validate input type
    if (!inputType || !['url', 'transcript', 'outline'].includes(inputType)) {
      return NextResponse.json(
        { error: 'Invalid input type' },
        { status: 400 }
      );
    }

    let content = '';
    let metadata = null;

    // Handle different input types
    if (inputType === 'url') {
      if (!videoUrl) {
        return NextResponse.json(
          { error: 'Video URL is required' },
          { status: 400 }
        );
      }

      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        return NextResponse.json(
          { error: 'Invalid YouTube URL' },
          { status: 400 }
        );
      }

      // Fetch video metadata
      metadata = await getVideoMetadata(videoId);

      // Fetch transcript
      const fetchedTranscript = await fetchVideoTranscript(videoId);
      if (!fetchedTranscript) {
        return NextResponse.json(
          { error: 'Could not fetch video transcript. Make sure the video has captions/subtitles enabled.' },
          { status: 404 }
        );
      }

      content = cleanTranscript(fetchedTranscript);
    } else if (inputType === 'transcript') {
      if (!transcript || transcript.length < 100) {
        return NextResponse.json(
          { error: 'Transcript must be at least 100 characters' },
          { status: 400 }
        );
      }
      content = cleanTranscript(transcript);
    } else if (inputType === 'outline') {
      if (!outline || outline.length < 50) {
        return NextResponse.json(
          { error: 'Content outline must be at least 50 characters' },
          { status: 400 }
        );
      }
      content = outline;
    }

    if (!content) {
      return NextResponse.json(
        { error: 'No content to process' },
        { status: 400 }
      );
    }

    // Generate course outline with AI
    const result = await generateCourseOutline(content, metadata);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate course outline' },
        { status: 500 }
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Video to course error:', error);
    return NextResponse.json(
      { error: 'Failed to generate course outline' },
      { status: 500 }
    );
  }
}
