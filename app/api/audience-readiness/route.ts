import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, score, readinessLevel } = body;

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Gemini API key not configured",
          details: "Please add GEMINI_API_KEY to your .env.local file"
        },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
    });

    const prompt = `You are a course creation expert analyzing a content creator's audience readiness.

Based on the following quiz responses and calculated readiness score, provide personalized insights and recommendations:

Quiz Responses:
1. What do people comment most on your content?
   Answer: ${answers.commentType}

2. Do your followers ask for step-by-step tutorials?
   Answer: ${answers.tutorialRequests}

3. Have you ever helped someone 1:1 with your expertise?
   Answer: ${answers.oneOnOneHelp}

4. What's your main niche or topic area?
   Answer: ${answers.niche}

5. How engaged is your audience with your content?
   Answer: ${answers.engagementLevel}

6. Do you regularly share processes or methods?
   Answer: ${answers.sharesProcesses}

7. What's your content creation frequency?
   Answer: ${answers.contentFrequency}

Readiness Score: ${score}/100
Readiness Level: ${readinessLevel}

IMPORTANT: Format your response using proper Markdown with the following structure:

## 📊 Your Readiness Assessment

[2-3 sentences with warm, encouraging assessment]

## 🎯 Next Steps to Turn 'Almost-Ready' into 'Ready to Launch':

1. **[Step Title]:** [Detailed explanation]
2. **[Step Title]:** [Detailed explanation]
3. **[Step Title]:** [Detailed explanation]
4. **[Step Title]:** [Detailed explanation]

## 💡 Potential Course Topic Ideas (based on your ${answers.niche} niche):

- **[Course Title]:** [Brief description]
- **[Course Title]:** [Brief description]
- **[Course Title]:** [Brief description]
- **[Course Title]:** [Brief description]

## ⏰ Timeline Estimation for Getting Started:

[Realistic timeline with milestones]

Keep the tone conversational, encouraging, and actionable. Use proper markdown formatting with headers, bold text, and bullet points for clarity.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const insights = response.text();

    return NextResponse.json({ 
      success: true, 
      insights,
      score,
      readinessLevel
    });

  } catch (error: unknown) {
    console.error("Error generating AI insights:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to generate AI insights",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
