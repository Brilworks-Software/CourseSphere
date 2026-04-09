# Embedding Generation Button - Integration Guide

## What was added

A new **"Generate Embeddings"** button that allows manual regeneration of vector embeddings for semantic search in the AI chat feature.

### Components Added/Updated

1. **New Component:** `components/EmbeddingGenerator.tsx`
   - Reusable button component with dialog UI
   - Shows generation progress and stats
   - Handles error cases gracefully

2. **Updated Component:** `components/manage-course-form/CurriculumStep.tsx`
   - Button appears after video upload success for per-lesson regeneration
   - Course-level button added alongside "Add Section"

3. **Updated API:** `app/api/admin/regenerate-embeddings/route.ts`
   - Now properly handles both course-level and lesson-level regeneration
   - Fetches transcripts via AWS asset relationships

---

## How to Use

### Setup (One-time)

1. **Set Admin API Key** in your `.env.local`:
   ```bash
   ADMIN_API_KEY=your-super-secret-admin-key-here
   ```

2. (Optional) **Expose to browser** if you want client-side generation:
   ```bash
   NEXT_PUBLIC_ADMIN_API_KEY=your-super-secret-admin-key-here
   ```

### Usage in UI

#### After Video Upload
When a video is successfully uploaded to a lesson:
1. You'll see success message: "Video uploaded and lesson updated!"
2. A **"Generate Embeddings"** button appears below the message
3. Click to generate embeddings for just that lesson's transcript

#### Course-Level (Bulk)
At the bottom of the Curriculum section:
1. Click the **"Generate Embeddings"** button next to "Add Section"
2. This generates embeddings for ALL lessons in the course
3. Much faster than doing lesson-by-lesson

---

## What Happens When You Click

### Dialog Opens
Shows a confirmation message explaining what will happen.

### Processing
- Button shows "Generating..." with loading spinner
- May take 1-5 minutes depending on course size
- Each transcript is:
  1. Split into semantic chunks (500-1500 words each)
  2. Embedded using Gemini API (768-dimension vectors)
  3. Stored in Supabase `transcript_chunks` table

### Results
After completion, shows stats:
- **Processed:** How many transcripts were regenerated
- **Succeeded:** How many succeeded
- **Total Chunks:** How many semantic chunks were created
- **Vectors Created:** How many embedding vectors generated
- **Time:** How long it took

Dialog auto-closes after 3 seconds on success.

---

## API Details

### Endpoint
```
POST /api/admin/regenerate-embeddings
```

### Headers
```javascript
{
  "Authorization": "Bearer your-admin-api-key",
  "Content-Type": "application/json"
}
```

### Request Body

**For entire course:**
```json
{
  "courseId": "12345678-1234-1234-1234-123456789012"
}
```

**For single lesson:**
```json
{
  "lessonId": "87654321-4321-4321-4321-210987654321",
  "courseId": "optional-course-id"
}
```

### Response

```json
{
  "success": true,
  "stats": {
    "processed": 5,
    "succeeded": 5,
    "failed": 0,
    "totalChunks": 42,
    "totalVectors": 42,
    "executionTimeMs": 156000
  }
}
```

---

## When to Use

- **After uploading videos** - To enable AI chat for that lesson
- **After transcript updates** - If transcripts change, regenerate to update embeddings
- **API key rotation** - If your Gemini API key changes, regenerate all embeddings
- **Bulk operations** - When adding many lessons at once, regenerate for entire course

---

## Rate Limiting

The system is designed to respect Gemini API rate limits:
- Free tier: ~60 requests/minute
- Our implementation: ~40 requests/minute (safe margin)
- Per batch: 5 texts processed, then 1.5 second wait

For a course with 100 lessons (300+ chunks):
- Expected time: 5-10 minutes
- No API errors or throttling

---

## Troubleshooting

### "Unauthorized: Admin access required"
- Check that `ADMIN_API_KEY` is set in `.env.local`
- Make sure you're using the correct key
- Browser prompt will ask for key if not set in env

### "No transcripts found for regeneration"
- Video hasn't finished transcribing yet
- Check `video_transcription_jobs` table status
- Wait for transcription cron to complete

### Long processing time
- Large courses take longer (normal)
- Each chunk needs embedding from Gemini API (~300ms per chunk)
- Parallel processing not used to avoid rate limits

### Embeddings not showing in search
- Wait a few minutes after generation completes
- Regenerate if needed
- Check that pgvector extension is enabled in Supabase

---

## Examples

### Generate for entire course (Curriculum tab)
1. Navigate to course management
2. Go to "Curriculum" step
3. At bottom, click "Generate Embeddings"
4. Wait 2-10 minutes (depending on course size)

### Generate for single lesson (After upload)
1. Upload video to lesson
2. After success message appears
3. Click "Generate Embeddings" button
4. Wait 1-2 minutes

---

## Performance

| Action | Time | Notes |
|--------|------|-------|
| Single chunk embed | 300ms | Via Gemini API |
| Batch (5 chunks) | 1.5s + processing | Includes rate limit delay |
| 50 chunks | 15 seconds | Plus database insert time |
| 300+ chunks (large course) | 5-10 minutes | Multi-batch processing |

---

## Notes

- For production, consider implementing proper role-based access control
- Current auth uses simple API key; upgrade to JWT tokens for multi-user scenarios
- Embeddings are immutable once created; regeneration replaces them
- Uses Google Gemini embedding-001 (768-dimensional vectors)
- Similarity search threshold: 0.5 (configurable in code)
