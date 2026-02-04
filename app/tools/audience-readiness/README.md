# 🎯 Audience Course-Ready Quiz

A comprehensive quiz tool that helps content creators determine if their audience is ready for a course offering. This tool uses AI-powered insights from Google Gemini to provide personalized recommendations.

## 📋 Features

- **7 Targeted Questions**: Covers key aspects of audience readiness
  - Comment engagement patterns
  - Tutorial requests
  - 1:1 help experience
  - Niche identification
  - Audience engagement levels
  - Process sharing habits
  - Content frequency

- **Intelligent Scoring System**: Decision tree logic that evaluates:
  - Engagement quality
  - Teaching readiness
  - Audience demand signals
  - Content consistency

- **Three Readiness Levels**:
  - 🌱 **Building Stage** (0-49%): Early-stage audience
  - ⚡ **Almost Ready** (50-74%): Growing momentum
  - 🎉 **Course-Ready** (75-100%): Prime for course launch

- **AI-Powered Insights**: Personalized recommendations using Google Gemini that include:
  - Warm assessment of current readiness
  - 3-4 actionable next steps
  - Potential course topic ideas
  - Timeline estimation

## 🚀 How It Works

### 1. User Journey
```
Start Quiz → Answer 7 Questions → Calculate Score → Get AI Insights → View Results
```

### 2. Scoring Logic
Each question has weighted scoring based on course-readiness indicators:
- Implementation questions (5 points) > Generic comments (1 point)
- Regular 1:1 help (5 points) > No experience (1 point)
- High engagement (5 points) > Low engagement (1 point)
- Detailed process sharing (5 points) > Inspiration only (1 point)

Total possible: 30 points from 6 questions (normalized to 100)

### 3. AI Processing
The system sends quiz responses and calculated score to Google Gemini, which:
- Analyzes the creator's profile
- Generates personalized insights
- Provides specific, actionable recommendations
- Suggests course topics based on niche

## 🛠️ Technical Implementation

### API Endpoint
**Location**: `/app/api/audience-readiness/route.ts`

**Method**: POST

**Request Body**:
```json
{
  "answers": {
    "commentType": "implementation",
    "tutorialRequests": "often",
    "oneOnOneHelp": "several",
    "niche": "web development",
    "engagementLevel": "high",
    "sharesProcesses": "detailed",
    "contentFrequency": "several"
  },
  "score": 85,
  "readinessLevel": "course-ready"
}
```

**Response**:
```json
{
  "success": true,
  "insights": "AI-generated personalized insights...",
  "score": 85,
  "readinessLevel": "course-ready"
}
```

### Frontend Components
**Location**: `/app/tools/audience-readiness/page.tsx`

**Key Features**:
- Multi-step form with progress tracking
- Smooth animations using Framer Motion
- Radio button groups for multiple choice
- Text area for niche input
- Real-time validation
- Loading states during AI processing

## 📦 Dependencies

```json
{
  "@google/generative-ai": "^latest",
  "framer-motion": "^latest",
  "@radix-ui/react-radio-group": "^latest"
}
```

## ⚙️ Setup Instructions

### 1. Install Dependencies
```bash
npm install @google/generative-ai
```

### 2. Configure Environment Variables
Add to your `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from: https://aistudio.google.com/apikey

### 3. Test the Tool
```bash
npm run dev
```

Navigate to: `http://localhost:3000/tools/audience-readiness`

## 🎨 UI Components Used

- `Card`, `CardHeader`, `CardTitle`, `CardContent` - Structure
- `Button` - Navigation and actions
- `Badge` - Labels and status indicators
- `Progress` - Quiz progress bar
- `RadioGroup`, `RadioGroupItem` - Multiple choice questions
- `Textarea` - Open-ended responses
- `Label` - Form labels
- Lucide icons - Visual elements

## 🧪 Testing Scenarios

### Test Case 1: High Readiness
- Comments: Implementation questions
- Tutorial requests: Often
- 1:1 Help: Several times
- Engagement: Very high
- Shares processes: Detailed
- Frequency: Several times per week

**Expected**: 75%+ score, "Course-Ready" status

### Test Case 2: Early Stage
- Comments: Generic praise
- Tutorial requests: Never
- 1:1 Help: No
- Engagement: Low
- Shares processes: Inspiration only
- Frequency: Occasional

**Expected**: <50% score, "Building Stage" status

## 📊 Decision Tree Logic

```
IF (implementation questions + tutorial requests + 1:1 help) > 12
  AND (engagement + processes + frequency) > 10
  THEN Course-Ready (75%+)

ELSE IF (total score) > 15
  THEN Almost Ready (50-74%)

ELSE
  Building Stage (<50%)
```

## 🔒 Security Notes

- API key stored in environment variables
- No user data persistence
- Client-side validation
- Error handling for API failures

## 📈 Future Enhancements

- [ ] Add email capture for follow-up
- [ ] Save results to user profile
- [ ] Export results as PDF
- [ ] Compare scores over time
- [ ] Integration with course creation flow
- [ ] A/B testing different question sets
- [ ] Multi-language support

## 🤝 Contributing

To add new questions:
1. Add question to `questions` array
2. Update `QuizAnswers` interface
3. Adjust scoring logic in `calculateScore()`
4. Update AI prompt in API route

## 📄 License

Part of the CourseSphere platform.
