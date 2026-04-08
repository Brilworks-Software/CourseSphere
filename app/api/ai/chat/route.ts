import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { message, transcript, courseTitle, lessonTitle } =
      await request.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build context with transcript if available
    let context = `You are a helpful course assistant. You are helping a student understand the course content.`;

    if (courseTitle) {
      context += ` Course: ${courseTitle}.`;
    }

    if (lessonTitle) {
      context += ` Lesson: ${lessonTitle}.`;
    }

    if (transcript) {
      context += `\n\nLesson Transcript:\n${transcript}\n\nPlease help the student by answering their questions based on the lesson transcript and course content.`;
    } else {
      context += ` Please help the student by answering their questions about the course content.`;
    }

    const result = await model.generateContent([
      {
        text: context,
      },
      {
        text: `Student question: ${message}`,
      },
    ]);

    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      reply: text,
      success: true,
    });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate response" },
      { status: 500 },
    );
  }
}
