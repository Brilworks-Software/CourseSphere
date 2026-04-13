import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { searchRelevantChunks, SearchResult } from "@/lib/semantic-search";
import { ConversationMessage } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

/**
 * Count words in a string
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Truncate text to approximately maxWords words and add truncation indicator
 */
function truncateToWordLimit(
  text: string,
  maxWords: number = 100,
): {
  text: string;
  isTruncated: boolean;
} {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return { text, isTruncated: false };
  }
  return {
    text: words.slice(0, maxWords).join(" ") + " [truncated...]",
    isTruncated: true,
  };
}

/**
 * Get conversation history for a user and course (last 5 messages)
 */
async function getConversationHistory(
  userId: string,
  courseId: string,
  limit: number = 5,
): Promise<ConversationMessage[]> {
  try {
    const { data, error } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Failed to fetch conversation history:", error);
      return [];
    }

    return (data || []).reverse(); // Reverse to get chronological order
  } catch (err) {
    console.warn("Error fetching conversation history:", err);
    return [];
  }
}

/**
 * Save a message to conversation history
 */
async function saveConversationMessage(
  userId: string,
  courseId: string,
  role: "user" | "assistant",
  content: string,
): Promise<ConversationMessage | null> {
  try {
    const wordCount = countWords(content);
    const { data, error } = await supabase
      .from("conversation_messages")
      .insert({
        user_id: userId,
        course_id: courseId,
        role,
        content,
        word_count: wordCount,
      })
      .select()
      .single();

    if (error) {
      console.warn("Failed to save conversation message:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.warn("Error saving conversation message:", err);
    return null;
  }
}

/**
 * Build conversation context from history
 */
function buildConversationContext(messages: ConversationMessage[]): string {
  if (messages.length === 0) {
    return "";
  }

  let context = "\n\n[CONVERSATION HISTORY]\n";
  for (const msg of messages) {
    const role = msg.role === "user" ? "Student" : "Assistant";
    context += `${role}: ${msg.content}\n\n`;
  }

  return context;
}

/**
 * Extract filename base without extension
 * e.g., "videos/1775632118691-file.mp4" → "1775632118691-file"
 */
function extractFileBase(path: string): string {
  const filename = path.split("/").pop() || path;
  return filename.substring(0, filename.lastIndexOf("."));
}

/**
 * Fetch all transcripts for a course using the proper flow:
 * courseId → lessons → aws_assets → video_transcripts (LEGACY - for fallback)
 */
async function getCourseTranscriptsByFlow(courseId: string): Promise<string[]> {
  try {
    // STEP 1: Get all lessons for this course
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, aws_assets_data_id")
      .eq("course_id", courseId);

    if (lessonsError) {
      console.warn("Failed to fetch lessons:", lessonsError);
      return [];
    }

    if (!lessons || lessons.length === 0) {
      console.warn("No lessons found for course:", courseId);
      return [];
    }

    // STEP 2: Get aws_assets for all lessons
    const awsAssetIds = lessons
      .map((l: any) => l.aws_assets_data_id)
      .filter(Boolean);

    if (awsAssetIds.length === 0) {
      console.warn("No AWS assets found for lessons");
      return [];
    }

    const { data: awsAssets, error: assetsError } = await supabase
      .from("aws_assets")
      .select("id, asset_key, bucket_name")
      .in("id", awsAssetIds);

    if (assetsError) {
      console.warn("Failed to fetch AWS assets:", assetsError);
      return [];
    }

    if (!awsAssets || awsAssets.length === 0) {
      console.warn("No AWS assets data found");
      return [];
    }

    // STEP 3: Match asset_keys with video_transcripts
    // Extract asset file bases and search for matching transcripts
    const transcripts: string[] = [];

    for (const asset of awsAssets) {
      const assetBase = extractFileBase(asset.asset_key);

      // Search for transcripts with matching filename base in video_transcripts
      const { data: matchedTranscripts, error: transcriptError } =
        await supabase
          .from("video_transcripts")
          .select("transcript, s3_key")
          .eq("s3_bucket", asset.bucket_name)
          .eq("status", "completed")
          .not("transcript", "is", null);

      if (transcriptError) {
        console.warn("Failed to fetch transcripts:", transcriptError);
        continue;
      }

      // Match by filename base
      if (matchedTranscripts) {
        for (const t of matchedTranscripts) {
          console.log(
            `Checking transcript s3_key: ${t.s3_key} against asset key: ${asset.asset_key}`,
          );
          const transcriptBase = extractFileBase(t.s3_key);
          if (transcriptBase.includes(assetBase)) {
            transcripts.push(t.transcript);
          }
        }
      }
    }

    return transcripts;
  } catch (err) {
    console.warn("Error in getCourseTranscriptsByFlow:", err);
    return [];
  }
}

/**
 * Group search results by lesson for better context reconstruction
 */
function groupResultsByLesson(
  results: SearchResult[],
): Map<string, SearchResult[]> {
  const grouped = new Map<string, SearchResult[]>();

  for (const result of results) {
    const lessonId = result.lessonId || "unknown";
    if (!grouped.has(lessonId)) {
      grouped.set(lessonId, []);
    }
    grouped.get(lessonId)!.push(result);
  }

  return grouped;
}

/**
 * Build context from semantic search results
 */
function buildContextFromResults(
  results: SearchResult[],
  courseTitleOpt?: string,
): string {
  if (results.length === 0) {
    return "";
  }

  const grouped = groupResultsByLesson(results);
  let context = `Relevant Course Content:\n`;

  if (courseTitleOpt) {
    context = `Course: ${courseTitleOpt}\n\n${context}`;
  }

  for (const [lessonId, chunks] of grouped) {
    context += `\n[Lesson: ${lessonId}]\n`;
    for (const chunk of chunks) {
      context += `${chunk.chunkText}\n\n`;
    }
  }

  return context;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body.message;
    const transcript = body.transcript;
    const courseId = body.courseId;
    const courseTitle = body.courseTitle;
    const lessonTitle = body.lessonTitle;
    const userId = body.userId; // Add user ID for conversation history
    // Optional client flag to force using full transcripts instead of semantic search
    const clientUseTranscripts =
      body.useTranscripts ?? body.useTranscript ?? false;
    // Also support an env var to force transcript mode application-wide
    const forceTranscripts =
      Boolean(clientUseTranscripts) || process.env.FORCE_TRANSCRIPTS === "true";

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

    // Base system prompt
    let systemPrompt = `You are a helpful course assistant. You are helping a student understand the course content. Keep your responses concise - aim for around 100 words maximum. Be direct and helpful.`;

    if (courseTitle) {
      systemPrompt += ` Course: ${courseTitle}.`;
    }

    if (lessonTitle) {
      systemPrompt += ` Lesson: ${lessonTitle}.`;
    }

    let searchResults: SearchResult[] = [];
    let usedSemanticSearch = false;
    let contextContent = "";

    // Get conversation history for better context (if userId provided)
    let conversationHistory: ConversationMessage[] = [];
    if (userId && courseId) {
      conversationHistory = await getConversationHistory(userId, courseId);
      if (conversationHistory.length > 0) {
        const historyContext = buildConversationContext(conversationHistory);
        systemPrompt += historyContext;
      }
    }

    // PHASE 3: Semantic Search RAG or Transcript-First Mode
    // If courseId provided and no direct transcript, either run semantic search
    // or, when forced, fetch and pass the full transcripts to the model.
    if (courseId && !transcript) {
      if (forceTranscripts) {
        console.log(
          `[chat] Transcript-first mode enabled (courseId=${courseId})`,
        );
        try {
          const courseTranscripts = await getCourseTranscriptsByFlow(courseId);
          usedSemanticSearch = false;
          if (courseTranscripts.length > 0) {
            const combinedTranscript = courseTranscripts.join("\n\n---\n\n");
            systemPrompt += `\n\nCourse Content & Transcripts:\n${combinedTranscript}\n\nPlease help the student by answering their questions based on the course content and available transcripts.`;
          } else {
            systemPrompt += ` Please help the student by answering their questions about the course content. Note: No detailed material is currently available for this course.`;
          }
        } catch (err) {
          console.error(
            `[chat] Transcript fetch failed in transcript mode:`,
            err,
          );
          systemPrompt += ` Please help the student by answering their questions about the course content.`;
        }
      } else {
        console.log(
          `[chat] Searching for relevant chunks for query: "${message.substring(0, 50)}..." (courseId=${courseId})`,
        );

        try {
          const searchStart = Date.now();
          const searchMetadata = await searchRelevantChunks(
            message,
            courseId,
            5, // Top 5 results
            0.5, // Similarity threshold
          );

          const searchTimeMs = Date.now() - searchStart;
          searchResults = searchMetadata.results;
          usedSemanticSearch = searchMetadata.queryEmbedded;

          console.log(
            `[chat] Semantic search completed: ${searchResults.length} results in ${searchTimeMs}ms (embedded=${usedSemanticSearch})`,
          );

          if (searchResults.length > 0) {
            // Build context from semantic results
            contextContent = buildContextFromResults(
              searchResults,
              courseTitle,
            );
            systemPrompt += `\n\nYou have access to the following relevant course material:\n${contextContent}`;
            systemPrompt += `\n\nIMPORTANT: Base your answer primarily on the provided course material. If the answer is not found in the material, say so honestly. Do not make up information.`;
          } else {
            // Fallback: use legacy transcript fetch if no semantic matches found
            console.log(
              `[chat] No semantic matches found, falling back to legacy transcript fetch`,
            );
            const courseTranscripts =
              await getCourseTranscriptsByFlow(courseId);
            if (courseTranscripts.length > 0) {
              const combinedTranscript = courseTranscripts.join("\n\n---\n\n");
              systemPrompt += `\n\nCourse Content & Transcripts:\n${combinedTranscript}\n\nPlease help the student by answering their questions based on the course content and available transcripts.`;
            } else {
              systemPrompt += ` Please help the student by answering their questions about the course content. Note: No detailed material is currently available for this course.`;
            }
          }
        } catch (searchError) {
          console.error(
            "[chat] Semantic search failed, falling back to legacy:",
            searchError,
          );

          // Fallback: use legacy transcript fetch
          const courseTranscripts = await getCourseTranscriptsByFlow(courseId);
          if (courseTranscripts.length > 0) {
            const combinedTranscript = courseTranscripts.join("\n\n---\n\n");
            systemPrompt += `\n\nCourse Content & Transcripts:\n${combinedTranscript}\n\nPlease help the student by answering their questions based on the course content and available transcripts.`;
          } else {
            systemPrompt += ` Please help the student by answering their questions about the course content.`;
          }
        }
      }
    } else if (transcript) {
      // Direct transcript provided
      systemPrompt += `\n\nCourse Content:\n${transcript}\n\nPlease help the student by answering their questions based on the provided content.`;
    } else {
      // No context available
      systemPrompt += ` Please help the student by answering their questions.`;
    }

    // Save user message to conversation history (if userId and courseId provided)
    if (userId && courseId) {
      await saveConversationMessage(userId, courseId, "user", message);
    }

    // Generate response using Gemini
    const result = await model.generateContent([
      {
        text: systemPrompt,
      },
      {
        text: `Student question: ${message}`,
      },
    ]);

    const response = result.response;
    let responseText = response.text();

    // Truncate response to ~100 words
    const { text: truncatedResponse, isTruncated } = truncateToWordLimit(
      responseText,
      100,
    );
    responseText = truncatedResponse;
    const wordCount = countWords(responseText);

    // Save assistant message to conversation history (if userId and courseId provided)
    if (userId && courseId) {
      await saveConversationMessage(
        userId,
        courseId,
        "assistant",
        responseText,
      );
    }

    // Build response with sources
    const responseData: any = {
      reply: responseText,
      wordCount,
      isTruncated,
      success: true,
      searched: usedSemanticSearch,
      chunksUsed: searchResults.length,
    };

    // Include source citations if semantic search was used
    if (searchResults.length > 0) {
      responseData.sources = searchResults.map((sr) => ({
        lessonId: sr.lessonId,
        similarity: parseFloat(sr.similarityScore.toFixed(3)),
        excerpt: sr.chunkText.substring(0, 150) + "...",
      }));
    }

    console.log(
      `[chat] Response generated: searched=${usedSemanticSearch}, sources=${searchResults.length}, truncated=${isTruncated}`,
    );

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate response" },
      { status: 500 },
    );
  }
}
