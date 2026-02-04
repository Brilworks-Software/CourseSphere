# 🚀 Audience Course-Ready Quiz - Setup Guide

## ✅ Completed Setup

The Audience Course-Ready quiz tool has been successfully created with the following components:

### Files Created:
1. **API Route**: `/app/api/audience-readiness/route.ts`
   - Handles quiz submissions
   - Integrates with Google Gemini AI
   - Returns personalized insights

2. **Quiz Page**: `/app/tools/audience-readiness/page.tsx`
   - 7-question interactive quiz
   - Progress tracking
   - AI-powered results display

3. **UI Component**: `/components/ui/radio-group.tsx`
   - Radio button group component for quiz options

4. **Documentation**: `/app/tools/audience-readiness/README.md`
   - Comprehensive tool documentation

## 📋 Next Steps

### 1. Get Your Gemini API Key

1. Visit: https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy the template
cp .env.local.template .env.local
```

Then add your Gemini API key to `.env.local`:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies (Already Done ✅)

The following package has been installed:
- `@google/generative-ai` - Google Gemini AI SDK

### 4. Start Development Server

```bash
npm run dev
```

### 5. Access the Tool

Open your browser and navigate to:
```
http://localhost:3000/tools/audience-readiness
```

## 🎯 How It Works

### Quiz Flow:
1. **7 Questions** covering:
   - Comment engagement patterns
   - Tutorial requests
   - 1:1 help experience
   - Niche identification
   - Audience engagement levels
   - Process sharing habits
   - Content creation frequency

2. **Scoring System**:
   - Each answer is weighted (1-5 points)
   - Maximum 30 points from 6 multiple-choice questions
   - Normalized to 100-point scale

3. **Readiness Levels**:
   - 🌱 **Building Stage** (0-49): Focus on audience growth
   - ⚡ **Almost Ready** (50-74): Refine and test concepts
   - 🎉 **Course-Ready** (75-100): Launch ready!

4. **AI Insights**:
   - Gemini analyzes all responses
   - Provides personalized assessment
   - Suggests specific next steps
   - Recommends course topics
   - Estimates timeline

## 🧪 Testing

### Test the Quiz:

1. **High Readiness Test**:
   - Select highest engagement options
   - Should score 75%+
   - Get "Course-Ready" status

2. **Low Readiness Test**:
   - Select lowest engagement options
   - Should score below 50%
   - Get "Building Stage" status

### Verify AI Integration:

1. Complete the quiz
2. Check that AI insights appear
3. Verify insights are relevant to your answers

## 🔧 Troubleshooting

### Issue: "Failed to get results"
**Solution**: Check that `GEMINI_API_KEY` is set in `.env.local`

### Issue: API key error
**Solution**: 
1. Verify API key is valid at https://aistudio.google.com
2. Check for any whitespace in the key
3. Restart the dev server after adding the key

### Issue: TypeScript errors
**Solution**: These will resolve after the next build:
```bash
npm run build
```

## 📊 Features

✅ No external API calls for quiz (except Gemini for insights)
✅ Pure decision-tree scoring logic
✅ Self-segmenting for early-stage creators
✅ Mobile responsive
✅ Dark mode support
✅ Smooth animations
✅ Progress tracking
✅ Retake functionality

## 🎨 Customization

### Modify Questions:
Edit `/app/tools/audience-readiness/page.tsx`:
- Find the `questions` array
- Add/modify questions
- Update scoring weights

### Adjust Thresholds:
Change readiness level cutoffs in `getReadinessLevel()`:
```typescript
if (score >= 75) return "course-ready";  // Adjust this
if (score >= 50) return "almost-ready";  // And this
```

### Customize AI Prompt:
Edit `/app/api/audience-readiness/route.ts`:
- Modify the prompt variable
- Add/remove insight requirements
- Change tone and style

## 📈 Analytics (Future Enhancement)

Consider adding:
- Quiz completion tracking
- Score distribution analysis
- Popular niches identification
- Conversion to course creation

## 🔐 Security

- ✅ API key stored in environment variables
- ✅ No user data persistence (privacy-first)
- ✅ Client-side validation
- ✅ Error handling for API failures

## 📱 Mobile Support

The quiz is fully responsive and works on:
- ✅ Desktop browsers
- ✅ Tablets
- ✅ Mobile phones

## 🎉 You're All Set!

The Audience Course-Ready Quiz is now ready to use. Just add your Gemini API key and start the dev server!

For questions or issues, refer to:
- Main README: `/app/tools/audience-readiness/README.md`
- Gemini AI Docs: https://ai.google.dev/docs
