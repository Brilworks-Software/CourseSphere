# AI Chatbot Setup Guide

This guide explains how to set up and configure the AI-powered lesson chatbot feature that uses Google's Gemini API.

## Overview

The lesson chatbot allows students to ask questions about course content during video playback. The chatbot uses the video transcript as context to provide accurate, lesson-specific responses using Google's Gemini API.

## Features

- 🤖 AI-powered Q&A specific to lesson content
- 📝 Uses lesson transcripts for context
- 💬 Real-time chat interface in the video player
- 🎯 Conditional rendering (only shows when transcript exists)
- 🔒 Server-side API integration (API key never exposed to client)

## Prerequisites

- Google Cloud account
- Existing CourseSphere setup with Supabase and lessons

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click on "Get API Key" button
3. Select "Create API key in new project" or an existing project
4. Copy the generated API key

## Step 2: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Google Gemini AI Configuration
# Get your API key from https://aistudio.google.com/apikey
GEMINI_API_KEY=your_api_key_here
```

Also update `.env.example` to include:

```env
# Google Gemini AI Configuration
# Get your API key from https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key
```

## Step 3: Database Requirements

Ensure your Supabase database has the `lesson_transcripts` table with the following schema:

```sql
CREATE TABLE public.lesson_transcripts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  lesson_id uuid NOT NULL,
  transcript_text text,
  created_at timestamp without time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
);
```

This table should already exist in your schema, but verify it has the `transcript_text` column to store video transcripts.

## Step 4: Adding Transcripts to Lessons

Transcripts should be uploaded through your course management interface. The transcript is linked to a lesson via `lesson_id`.

### For Administrators

If you need to manually add transcripts:

```sql
INSERT INTO lesson_transcripts (lesson_id, transcript_text)
VALUES ('lesson-uuid-here', 'Your transcript text here...');
```

## API Routes

### Fetch Transcript

**Endpoint:** `GET /api/student/transcripts`

**Parameters:**
- `lessonId` (required): The lesson ID

**Response:**
```json
{
  "transcript": {
    "id": "uuid",
    "lesson_id": "uuid",
    "transcript_text": "...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Chat with AI

**Endpoint:** `POST /api/ai/chat`

**Request Body:**
```json
{
  "message": "What does the video say about...?",
  "transcript": "The lesson transcript text...",
  "courseTitle": "Course Name",
  "lessonTitle": "Lesson Name"
}
```

**Response:**
```json
{
  "reply": "Based on the lesson, ...",
  "success": true
}
```

## Components

### VideoLessonChatbot.tsx

Located in `components/course/VideoLessonChatbot.tsx`

**Props:**
- `lessonTranscript` (string | null): The transcript text for context
- `courseTitle` (string): Course name for context
- `lessonTitle` (string): Lesson name for context
- `isVisible` (boolean): Whether to display the chatbot
- `onClose` (function): Callback when chatbot is closed

**Features:**
- Message history
- Real-time typing indicator
- Smooth auto-scroll
- Responsive design
- Dark mode support

### EnrolledView.tsx

Updated to include:
- Conditional chatbot rendering based on transcript availability
- Toggle button to show/hide chatbot
- Responsive layout adjustments

### StudentSingleCourse.tsx

Updated to:
- Fetch transcript on lesson change
- Pass transcript to EnrolledView
- Manage chatbot visibility state

## How It Works

1. **User selects a lesson** → StudentSingleCourse fetches the lesson data and transcript
2. **Transcript is available** → "Show AI Assistant" button appears in the video panel
3. **User clicks the button** → VideoLessonChatbot component appears in a side panel
4. **User sends a message** → Request sent to `/api/ai/chat` with transcript context
5. **Gemini API processes** → Returns response based on lesson content
6. **Response displayed** → Message appears in chat interface

## Limitations & Considerations

- Gemini API has rate limits (100 requests/minute for free tier)
- Long transcripts may be truncated by API character limits
- Requires active internet connection for API calls
- API costs apply after free tier usage

## Troubleshooting

### Chatbot not appearing
- Check if lesson has a transcript in `lesson_transcripts` table
- Verify `GEMINI_API_KEY` is set in environment
- Check browser console for errors

### "API key not configured" error
- Ensure `GEMINI_API_KEY` is in `.env.local`
- Restart Next.js development server
- Verify API key is correct

### Empty or incorrect responses
- Check transcript quality and length
- Verify Gemini API key has proper permissions
- Check API rate limits haven't been exceeded

### Transcript not loading
- Verify lesson has associated transcript record
- Check Supabase connection
- Confirm `lesson_id` matches in database

## Testing

To test the chatbot:

1. Ensure you have a lesson with an uploaded transcript
2. Enroll as a student in the course
3. Open a lesson video
4. Look for "Show AI Assistant" button
5. Click to open chatbot
6. Ask a question about the video content

## Security

- API key is server-side only (never exposed to client)
- Transcripts are only sent to Gemini API for context
- All API calls are authenticated through Next.js routes
- No user data is stored by Gemini

## Future Enhancements

- [ ] Support for video transcript auto-generation
- [ ] Conversation history persistence
- [ ] Multi-language support
- [ ] Custom system prompts per course
- [ ] Response rating/feedback system
- [ ] Integration with course Q&A forums

## Support

For issues or questions about the chatbot implementation:
1. Check this documentation
2. Review error messages in browser console
3. Check Next.js server logs
4. Verify Supabase database connection
