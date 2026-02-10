import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface LaunchPlanRequest {
  format: 'self-paced' | 'cohort' | 'workshop';
  launchDate: string;
  audienceSize: number;
  comfortLevel: 'nervous' | 'moderate' | 'confident';
}

interface DayPlan {
  day: number;
  title: string;
  focus: string;
  tasks: string[];
  postIdea: string;
  emailSubject?: string;
  emailBody?: string;
}

interface WebinarPitch {
  hook: string;
  bullets: string[];
  cta: string;
}

interface LaunchPlanResult {
  launchTitle: string;
  launchDate: string;
  strategy: string;
  dayPlans: DayPlan[];
  webinarPitch?: WebinarPitch;
  insights: {
    momentum: string;
    lowPressureTips: string;
    recommendation: string;
  };
}

// Check for holidays/events near launch date
function getSeasonalContext(launchDate: string): string {
  const date = new Date(launchDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Check for major holidays and events
  if (month === 1 && day === 1) return "New Year's Day - Perfect for fresh starts and transformation messaging";
  if (month === 1 && day >= 1 && day <= 15) return "New Year season - Capitalize on resolution energy and goal-setting momentum";
  if (month === 2 && day === 14) return "Valentine's Day - Focus on self-love, self-investment, and personal growth";
  if (month === 3 && day >= 15 && day <= 22) return "Spring season - New beginnings, growth, and transformation messaging";
  if (month === 4 && day >= 15 && day <= 20) return "Tax season - Talk about investments in yourself vs expenses";
  if (month === 5) return "Mid-year momentum - People reassessing goals, perfect for skill-building";
  if (month === 6 && day >= 15) return "Summer season - Flexible learning, self-paced courses appeal more";
  if (month === 7 && day === 4) return "Independence Day (US) - Freedom, independence, building your own path messaging";
  if (month === 9 && day >= 1 && day <= 15) return "Back-to-school season - Learning mindset is high, education investment feels natural";
  if (month === 10) return "Q4 momentum - People planning for year-end and next year goals";
  if (month === 11 && day >= 20) return "Thanksgiving week - Gratitude messaging, invest in yourself";
  if (month === 11 && day >= 25) return "Black Friday season - Consider limited-time offers and urgency";
  if (month === 12 && day >= 15 && day <= 25) return "Holiday season - People are busy but also reflective about next year";
  if (month === 12 && day >= 26) return "Year-end reflection period - Perfect for New Year transformation promises";
  
  return "Regular season - Focus on consistent value and problem-solving";
}

// Rule-based launch plan generator
function generateBaseLaunchPlan(req: LaunchPlanRequest): Partial<LaunchPlanResult> {
  const { format, launchDate, audienceSize, comfortLevel } = req;
  
  // Get seasonal context
  const seasonalContext = getSeasonalContext(launchDate);
  
  // Calculate countdown days
  const launch = new Date(launchDate);
  const dayPlans: DayPlan[] = [];

  // Audience size affects strategy
  const isSmallAudience = audienceSize < 1000;
  const isMediumAudience = audienceSize >= 1000 && audienceSize < 10000;
  const isLargeAudience = audienceSize >= 10000;

  // Format-specific strategy
  let strategy = '';
  let launchTitle = '';

  if (format === 'cohort') {
    launchTitle = 'Live Cohort Launch';
    if (isSmallAudience) {
      strategy = 'Intimate cohort with personal attention. Focus on transformation stories, direct outreach, and community building. Emphasize small group benefits.';
    } else if (isMediumAudience) {
      strategy = 'Build anticipation through daily value. Create urgency with limited spots, emphasize live interaction and peer learning.';
    } else {
      strategy = 'High-demand cohort launch. Focus on social proof, waitlist strategy, and FOMO. Multiple cohorts may be needed.';
    }
  } else if (format === 'self-paced') {
    launchTitle = 'Self-Paced Course Launch';
    if (isSmallAudience) {
      strategy = 'Focus on transformation depth and personal support. Offer launch bonuses like office hours or community access.';
    } else if (isMediumAudience) {
      strategy = 'Emphasize flexibility and lifetime access. Show curriculum depth, reduce friction with instant access.';
    } else {
      strategy = 'Scalable self-paced launch. Focus on proven results, testimonials, and automated onboarding. Can handle volume.';
    }
  } else {
    launchTitle = 'Workshop Launch';
    if (isSmallAudience) {
      strategy = 'Hands-on workshop with direct feedback. Emphasize personalized attention and immediate application.';
    } else if (isMediumAudience) {
      strategy = 'Quick win promise in focused timeframe. Emphasize hands-on learning and immediate results.';
    } else {
      strategy = 'High-energy workshop with proven framework. Multiple sessions may be needed. Focus on transformation speed.';
    }
  }

  // Day 7 (7 days before launch) - Adjusted for comfort level and audience size
  const day1Tasks = [];
  const day1Post = [];
  const day1Email = [];

  if (comfortLevel === 'nervous') {
    day1Tasks.push('Share valuable content without mentioning a product yet');
    day1Tasks.push('Test the waters with a story or teaching moment');
    if (isSmallAudience) {
      day1Tasks.push('Reply to comments personally - build 1-on-1 connections');
    } else {
      day1Tasks.push('Monitor comment sentiment to gauge interest');
    }
    day1Post.push(`Share a helpful tip related to your course topic. Keep it casual: "Something I've been thinking about lately..." No sales pitch yet - just value.`);
    day1Email.push(`Subject: Quick thought...`);
    day1Email.push(`Body: Hey,\n\nI've been working on something behind the scenes. Not ready to share yet, but wanted to say hi.\n\nMore soon,\n[Your Name]`);
  } else if (comfortLevel === 'moderate') {
    day1Tasks.push('Create a piece of content solving ONE problem your course addresses');
    day1Tasks.push('Drop subtle hints: "I\'ve been working on something exciting..."');
    if (isSmallAudience) {
      day1Tasks.push('DM a few engaged followers for their thoughts');
    } else {
      day1Tasks.push('Set up landing page with email capture');
    }
    day1Post.push(`Share a valuable tip or mini-lesson. End with: "I'm working on something related to this. Stay tuned..."`);
    day1Email.push(`Subject: Heads up...`);
    day1Email.push(`Body: Hey there,\n\nI've been building something I think you'll love. Can't share details yet, but if you've been wanting to [OUTCOME], keep an eye out.\n\nMore soon,\n[Your Name]`);
  } else {
    day1Tasks.push('Share high-value content that showcases your expertise');
    day1Tasks.push('Confidently tease: "Big announcement coming this week"');
    day1Tasks.push('Set up landing page, email sequence, and tracking');
    if (isLargeAudience) {
      day1Tasks.push('Consider pre-launch waitlist to gauge demand');
    }
    day1Post.push(`Drop a valuable insight that positions you as the expert. Confidently tease: "This is a preview of what I'm launching this week. Get ready."`);
    day1Email.push(`Subject: Something big is coming...`);
    day1Email.push(`Body: Hey,\n\nI'm launching something this week that I've been working on for months.\n\nIf you've been struggling with [PROBLEM], this is for you.\n\nAnnouncement coming in 3 days. Mark your calendar.\n\n[Your Name]`);
  }

  dayPlans.push({
    day: 1,
    title: comfortLevel === 'nervous' ? 'Soft Warm-Up (No Selling)' : 'Value Drop + Tease',
    focus: comfortLevel === 'nervous' ? 'Just show up and teach. No pressure.' : 'Plant seeds and build anticipation.',
    tasks: day1Tasks,
    postIdea: day1Post[0],
    emailSubject: day1Email[0].replace('Subject: ', ''),
    emailBody: day1Email[1].replace('Body: ', ''),
  });

  // Day 6 - Problem awareness (varies by audience size)
  const day2Tasks = [];
  const day2Post = [];

  if (isSmallAudience) {
    day2Tasks.push('Post about the PROBLEM and ask: "Anyone else dealing with this?"');
    day2Tasks.push('Respond to every single comment - make it a conversation');
    day2Tasks.push('DM people who resonate and ask what they\'re struggling with');
    day2Post.push(`Share your own struggle story with [TOPIC]. Ask your audience: "Has anyone else felt this way?" Make it relatable. Small audiences = personal connection.`);
  } else if (isMediumAudience) {
    day2Tasks.push('Post about the PROBLEM your audience faces');
    day2Tasks.push('Share a personal story of when you struggled with this');
    day2Tasks.push('Ask audience to comment with their #1 challenge');
    day2Post.push(`Call out the biggest mistake people make with [TOPIC]. Share why it keeps them stuck. Make it specific and relatable.`);
  } else {
    day2Tasks.push('Create content calling out the common struggle');
    day2Tasks.push('Use social proof: "I hear this from creators every day..."');
    day2Tasks.push('Pin a comment asking people to share their struggles');
    day2Post.push(`Post about the #1 problem keeping people stuck with [TOPIC]. Use data or audience stories: "I asked 100 creators and here's what they said..." Build authority.`);
  }

  dayPlans.push({
    day: 2,
    title: isSmallAudience ? 'Start Conversations' : 'Problem Awareness',
    focus: isSmallAudience ? 'Engage 1-on-1. Build trust personally.' : 'Show you understand the struggle.',
    tasks: day2Tasks,
    postIdea: day2Post[0],
    emailSubject: 'The thing nobody talks about...',
    emailBody: `The biggest struggle I see with [TOPIC] is [PROBLEM].\n\nNobody talks about this, but it's the real reason you're stuck.\n\nTomorrow, I'm sharing what finally worked for me${isLargeAudience ? ' and hundreds of others' : ''}.\n\nTalk soon,\n[Your Name]`,
  });

  // Day 5 - Solution tease (format-specific)
  const day3Tasks = [];
  const day3Post = [];

  if (format === 'cohort') {
    day3Tasks.push('Share your unique framework or approach');
    day3Tasks.push('Tease the community/group learning aspect');
    day3Tasks.push('Post a transformation story from someone who learned with you');
    day3Post.push(`Introduce your method with a visual/diagram. Emphasize: "This works even better when you do it WITH a group." Tease the cohort experience.`);
  } else if (format === 'self-paced') {
    day3Tasks.push('Share your step-by-step system');
    day3Tasks.push('Show the curriculum depth without overwhelming');
    day3Tasks.push('Emphasize flexibility: "Learn at your own pace"');
    day3Post.push(`Share your framework with clear steps. Highlight: "You can do this on YOUR schedule." Appeal to people who want control over their learning.`);
  } else {
    day3Tasks.push('Show your proven framework');
    day3Tasks.push('Emphasize quick results and hands-on learning');
    day3Tasks.push('Share a before/after from a previous workshop');
    day3Post.push(`Show your method with emphasis on SPEED: "This is what we'll accomplish in [X hours/days]." Workshop = fast transformation.`);
  }

  dayPlans.push({
    day: 3,
    title: format === 'cohort' ? 'Solution + Community Tease' : 'Solution Preview',
    focus: `Introduce YOUR method${format === 'cohort' ? ' and group learning' : ''}.`,
    tasks: day3Tasks,
    postIdea: day3Post[0],
  });

  // Day 4 - Official Announcement (MAJOR differences by audience + seasonal context)
  const day4Tasks = [];
  let day4Post = '';
  let day4EmailBody = '';
  
  const seasonalHook = seasonalContext.includes('New Year') ? '\n\nPerfect timing for your New Year goals. Let\'s make this year count.' :
                       seasonalContext.includes('Back-to-school') ? '\n\nBack-to-school energy is real. Time to learn something that matters.' :
                       seasonalContext.includes('Black Friday') ? '\n\nBlack Friday special - invest in yourself, not just stuff.' :
                       seasonalContext.includes('Q4') ? '\n\nFinish the year strong. Start building the skills you need.' : '';

  if (comfortLevel === 'nervous') {
    day4Tasks.push('Announce your course in a humble, helpful way');
    day4Tasks.push('Share what\'s included and who it\'s for (no hype)');
    day4Tasks.push('Post enrollment link in a low-pressure way');
    if (isSmallAudience) {
      day4Tasks.push('Offer to answer DM questions personally');
    }
    day4Post = `Announcement (keep it simple): "After weeks of work, [COURSE NAME] is ready. It's for [TARGET AUDIENCE]. You'll learn [OUTCOME]. Link in bio if interested." ${seasonalHook}`;
  } else if (comfortLevel === 'moderate') {
    day4Tasks.push('Announce with excitement but stay authentic');
    day4Tasks.push('Go live or record a video announcement');
    day4Tasks.push('Share clear details: What, who, when, how to join');
    day4Tasks.push('Post enrollment link everywhere');
    day4Post = `Video or post announcement with details: What it is, who it's for, what they'll achieve. Balance excitement with authenticity.${seasonalHook}`;
  } else {
    day4Tasks.push('Announce with confidence and energy');
    day4Tasks.push('Go live and pitch the transformation boldly');
    day4Tasks.push('Share enrollment link with clear CTA');
    if (isLargeAudience) {
      day4Tasks.push('Create urgency: Limited spots, waitlist, or early bird pricing');
    }
    day4Post = `Bold announcement: "After [X months], [COURSE NAME] is HERE. This is for creators ready to [TRANSFORMATION]. Not for everyone. Link in bio." ${seasonalHook}`;
  }

  if (format === 'cohort' && isLargeAudience) {
    day4EmailBody = `After weeks of building, I'm excited to announce [COURSE NAME].\n\nThis live cohort is for you if:\n- [TARGET POINT 1]\n- [TARGET POINT 2]\n- [TARGET POINT 3]\n\nBy the end, you'll [OUTCOME].\n\nWe start [DATE] and spots are limited${isLargeAudience ? ' (we can only take 50 people)' : ''}.\n\nJoin here: [LINK]${seasonalHook}\n\nLet's do this,\n[Your Name]`;
  } else if (isSmallAudience) {
    day4EmailBody = `I'm launching [COURSE NAME] and I immediately thought of you.\n\nThis is for [TARGET AUDIENCE] who want to [OUTCOME].\n\n${format === 'cohort' ? `It's a small, intimate cohort (only ${isSmallAudience ? '10-15' : '20-30'} people) starting [DATE].` : 'You can start immediately and go at your own pace.'}\n\nJoin here: [LINK]${seasonalHook}\n\nLet me know if you have questions,\n[Your Name]`;
  } else {
    day4EmailBody = `It's here: [COURSE NAME] is officially open.\n\nThis is for you if:\n- [TARGET POINT 1]\n- [TARGET POINT 2]\n- [TARGET POINT 3]\n\nBy the end, you'll be able to [OUTCOME].\n\n${format === 'cohort' ? `We start [DATE] and only have [X] spots.` : 'You can start immediately.'}\n\nJoin here: [LINK]${seasonalHook}\n\nSee you inside,\n[Your Name]`;
  }

  dayPlans.push({
    day: 4,
    title: 'Launch Day 🚀',
    focus: `Open enrollment${format === 'cohort' && isLargeAudience ? ' with urgency' : ''}.`,
    tasks: day4Tasks,
    postIdea: day4Post,
    emailSubject: `${comfortLevel === 'confident' ? '🚀 ' : ''}${isLargeAudience ? 'It\'s LIVE' : 'It\'s here'}: [COURSE NAME] is open`,
    emailBody: day4EmailBody,
  });

  // Day 3 - Social proof (audience size matters here)
  const day5Tasks = [];
  let day5Post = '';

  if (isSmallAudience) {
    day5Tasks.push('Share YOUR transformation story if you don\'t have testimonials yet');
    day5Tasks.push('Post about who has already joined (even if it\'s just 2 people)');
    day5Tasks.push('Create excitement: "We\'re building something special"');
    day5Post = `Don't have testimonials yet? Share YOUR story. "Here's what changed for me when I learned [SKILL]." Small audiences trust authenticity over social proof.`;
  } else if (isMediumAudience) {
    day5Tasks.push('Share testimonials or beta student wins');
    day5Tasks.push('Post about who has already joined');
    day5Tasks.push('Create mild urgency: "Spots are filling up"');
    day5Post = `Share a testimonial or success story. If you don't have any, share a student's progress or excitement. Build trust through real examples.`;
  } else {
    day5Tasks.push('Post multiple testimonials and transformations');
    day5Tasks.push('Use numbers: "50 people have joined in 24 hours"');
    day5Tasks.push('Strong urgency: "Half the spots are gone"');
    day5Post = `Share multiple testimonials or success stories. Use social proof numbers: "X people joined in the first day." Create FOMO for large audiences.`;
  }

  if (format === 'cohort') {
    day5Tasks.push(`Remind: cohorts fill fast${isLargeAudience ? ', we\'re almost full' : ', spots are limited'}`);
  }

  dayPlans.push({
    day: 5,
    title: isSmallAudience ? 'Build Trust' : 'Social Proof + Urgency',
    focus: isSmallAudience ? 'Show authenticity, not hype.' : 'Prove this works. Create FOMO.',
    tasks: day5Tasks,
    postIdea: day5Post,
  });

  // Day 2 - Objection handling (comfort level + format specific)
  const day6Tasks = [];
  let day6Post = '';
  let day6EmailBody = '';

  if (comfortLevel === 'nervous') {
    day6Tasks.push('Answer common questions in a helpful post');
    day6Tasks.push('Address doubts gently: "I know this feels like a big step..."');
    day6Tasks.push('Offer to answer questions via DM or email');
    day6Post = `FAQ post (keep it warm): "You might be wondering... [QUESTIONS]. Here are honest answers." Be vulnerable about your own doubts when you started.`;
  } else {
    day6Tasks.push('Create FAQ video or post addressing objections directly');
    day6Tasks.push('Handle price objection: "Investment vs expense"');
    day6Tasks.push('Show more behind-the-scenes or curriculum');
    day6Post = `Address objections head-on: Time? Money? "Is this for me?" Answer each one with confidence and examples.`;
  }

  if (format === 'self-paced') {
    day6EmailBody = `You might be thinking: "Can I really do this at my own pace?"\n\nYes. The course is designed for flexibility. Watch when you want, pause when you need.\n\n${isSmallAudience ? 'Plus, you can message me anytime with questions.' : 'You get lifetime access - no rush.'}\n\nQuestions? Hit reply.\n\nJoin: [LINK]\n\n[Your Name]`;
  } else if (format === 'cohort') {
    day6EmailBody = `Common question: "Do I have time for a cohort?"\n\nHere's the truth: We meet [X times/week] for [X hours]. If you can commit to that, you'll succeed.\n\n${isSmallAudience ? 'Plus, it\'s a small group - we support each other.' : 'The cohort keeps you accountable.'}\n\nQuestions? Reply to this email.\n\nJoin: [LINK]\n\n[Your Name]`;
  } else {
    day6EmailBody = `"Is a workshop enough time to learn this?"\n\nYes - if you show up and do the work. This is focused, hands-on, and designed for quick wins.\n\nYou'll leave with [SPECIFIC OUTCOME].\n\nQuestions? Hit reply.\n\nJoin: [LINK]\n\n[Your Name]`;
  }

  dayPlans.push({
    day: 6,
    title: 'Answer Doubts',
    focus: comfortLevel === 'nervous' ? 'Be helpful, not salesy.' : 'Handle objections confidently.',
    tasks: day6Tasks,
    postIdea: day6Post,
    emailSubject: comfortLevel === 'nervous' ? 'Quick question you might have...' : 'Let me answer that...',
    emailBody: day6EmailBody,
  });

  // Day 1 - Final call (varies dramatically by all factors)
  const day7Tasks = [];
  let day7Post = '';
  let day7EmailSubject = '';
  let day7EmailBody = '';

  if (comfortLevel === 'nervous') {
    day7Tasks.push('Simple reminder post: "Last chance to join"');
    day7Tasks.push('Share one benefit or transformation');
    day7Tasks.push('Keep it low-pressure: "No worries if not, but doors close tonight"');
    day7Post = `Simple last call: "Enrollment closes tonight. If you've been thinking about it, now's the time. No pressure, just wanted to remind you." Stay authentic.`;
    day7EmailSubject = 'Doors closing tonight (if you\'re interested)';
    day7EmailBody = `Quick reminder: [COURSE NAME] enrollment closes tonight at midnight.\n\nIf you've been on the fence, this is your last chance.\n\n${format === 'cohort' ? `We start [DATE]${isSmallAudience ? ' with a small group' : ''}.` : 'You can start learning immediately.'}\n\nNo pressure - but if it's a yes, now's the time.\n\nJoin: [LINK]\n\n[Your Name]`;
  } else if (comfortLevel === 'moderate') {
    day7Tasks.push('Post "Last call" reminder with urgency');
    day7Tasks.push('Share final transformation story');
    if (isMediumAudience || isLargeAudience) {
      day7Tasks.push('Go live or post a video if comfortable');
    }
    day7Tasks.push('Send "doors closing" email');
    day7Post = `Last call with clear urgency: "Enrollment closes tonight at [TIME]. This is your last chance${format === 'cohort' && isLargeAudience ? ' - only a few spots left' : ''}."`;
    day7EmailSubject = 'Final call (closes tonight)';
    day7EmailBody = `This is it.\n\nEnrollment for [COURSE NAME] closes tonight at midnight.\n\n${format === 'cohort' ? `The cohort starts [DATE]${isLargeAudience ? ' and we\'re almost full' : ''}.` : 'After tonight, you\'ll have to wait for the next launch.'}\n\nReady to ${format === 'workshop' ? 'get this done' : 'make this happen'}?\n\nJoin now: [LINK]\n\nSee you inside,\n[Your Name]`;
  } else {
    day7Tasks.push('Strong urgency post: "FINAL CALL - Doors close in X hours"');
    day7Tasks.push('Go live with final pitch and Q&A');
    day7Tasks.push('Share transformation promise boldly');
    if (isLargeAudience && format === 'cohort') {
      day7Tasks.push('Announce: "Only 5 spots left" or "We\'re at capacity"');
    }
    day7Post = `Bold final call: "This is it. ${format === 'cohort' && isLargeAudience ? 'Last 5 spots.' : 'Doors close in 6 hours.'} If you're serious about [OUTCOME], this is your moment. Link in bio."`;
    day7EmailSubject = `⏰ FINAL CALL: ${format === 'cohort' ? 'Last spots' : 'Doors close tonight'}`;
    day7EmailBody = `This is your final chance.\n\nEnrollment for [COURSE NAME] closes tonight at midnight.\n\n${format === 'cohort' && isLargeAudience ? 'We\'re down to the last few spots. Once they\'re gone, that\'s it.' : format === 'cohort' ? 'The cohort starts [DATE] and we can\'t take more people.' : 'After tonight, the course won\'t be available until the next launch.'}\n\n${isLargeAudience ? 'Over [X] people have already joined. ' : ''}Don't miss this.\n\nJoin NOW: [LINK]\n\nLet's go,\n[Your Name]`;
  }

  dayPlans.push({
    day: 7,
    title: comfortLevel === 'nervous' ? 'Gentle Final Reminder' : 'FINAL CALL',
    focus: comfortLevel === 'nervous' ? 'Remind, don\'t push.' : 'Maximum urgency. Make it easy to decide NOW.',
    tasks: day7Tasks,
    postIdea: day7Post,
    emailSubject: day7EmailSubject,
    emailBody: day7EmailBody,
  });

  return {
    launchTitle,
    launchDate,
    strategy: strategy + ` | Context: ${seasonalContext}`,
    dayPlans,
  };
}

// AI-enhanced content generation
async function enhanceLaunchPlan(
  basePlan: Partial<LaunchPlanResult>,
  req: LaunchPlanRequest
): Promise<LaunchPlanResult> {
  const { format, audienceSize, comfortLevel, launchDate } = req;
  
  const isSmallAudience = audienceSize < 1000;
  const isMediumAudience = audienceSize >= 1000 && audienceSize < 10000;
  const isLargeAudience = audienceSize >= 10000;
  
  const seasonalContext = getSeasonalContext(launchDate);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Generate AI insights and webinar pitch
    const prompt = `You are a low-pressure launch strategist for YouTube creators.

Context:
- Course Format: ${format}
- Audience Size: ${audienceSize} (${isSmallAudience ? 'small - focus on personal connection' : isMediumAudience ? 'medium - balance scale and personal touch' : 'large - leverage social proof and scale'})
- Comfort Level: ${comfortLevel} (${comfortLevel === 'nervous' ? 'first-time seller, needs reassurance' : comfortLevel === 'moderate' ? 'some experience, needs structure' : 'experienced, can be bold'})
- Launch Date Context: ${seasonalContext}
- Launch Strategy: ${basePlan.strategy}

Generate personalized insights based on these SPECIFIC factors:

1. Momentum tip: How should they build excitement given their audience size and comfort level?
2. Low-pressure tips: Specific advice for their comfort level (${comfortLevel}) - be ultra-specific
3. Recommendation: Based on their audience size (${audienceSize}), what should they focus on?
${format === 'cohort' || format === 'workshop' ? `4. Webinar pitch: Create a pitch outline considering their comfort level and seasonal context` : ''}

For small audiences (<1000): Focus on personal connection, DMs, 1-on-1 conversations
For medium audiences (1-10K): Balance personal touch with scalable tactics
For large audiences (10K+): Use social proof, numbers, FOMO, and bold messaging

For nervous sellers: Gentle, permission-based language. No aggressive tactics.
For moderate sellers: Balanced confidence with authenticity
For confident sellers: Bold, direct, transformation-focused

Seasonal context: ${seasonalContext} - incorporate this naturally

Output as JSON:
{
  "momentum": "string (2-3 sentences, SPECIFIC to their situation)",
  "lowPressureTips": "string (2-3 sentences, tailored to comfort level)",
  "recommendation": "string (2-3 sentences, based on audience size + seasonal timing)",
  ${format === 'cohort' || format === 'workshop' ? `"webinarPitch": {
    "hook": "string (30-second opening that matches their comfort level)",
    "bullets": ["bullet 1", "bullet 2", "bullet 3"],
    "cta": "string (call to action appropriate for their confidence level)"
  }` : ''}
}

Be specific, practical, and personalized. NO generic advice.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse AI response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    let aiEnhancements: any;

    if (jsonMatch) {
      aiEnhancements = JSON.parse(jsonMatch[0]);
    } else {
      // Fallback if AI doesn't return valid JSON
      aiEnhancements = {
        momentum: audienceSize < 1000 
          ? 'With your audience size, personal connection is everything. Reply to every comment, DM engaged followers, make people feel seen. Small audiences convert higher when they feel personally connected to you.'
          : audienceSize < 10000
          ? 'Build momentum by showing up consistently each day. Your audience is big enough for social proof to work - share who\'s joining, highlight excitement, create a sense of movement.'
          : 'You have serious reach. Focus on numbers and social proof: "50 joined in the first hour." Use waitlists, create FOMO. Your audience size gives you leverage - use it.',
        lowPressureTips: comfortLevel === 'nervous' 
          ? `First launch jitters are normal. You don't need to go live, you don't need to be perfect. ${audienceSize < 1000 ? 'With your small audience, even text posts and DMs work.' : 'Even simple posts and emails will work.'} Focus on helping, not selling. The right people will say yes.`
          : comfortLevel === 'moderate'
          ? `You've got experience - trust it. ${audienceSize >= 10000 ? 'Your audience size means you don\'t need to convince everyone. Even 1% conversion is significant.' : 'Show up consistently, handle objections calmly, and let your content do the selling.'} Stay authentic and the sales will follow.`
          : `You're ready for bold moves. ${audienceSize >= 10000 ? 'Use strong CTAs, create real urgency, and leverage your reach.' : 'Be direct about the transformation.'} ${format === 'cohort' ? 'Limited spots work in your favor.' : 'Confidence sells.'} Don't hold back.`,
        recommendation: audienceSize < 1000
          ? `Small audience strategy: Go deep, not wide. DM every interested person, offer to answer questions personally, create a tight-knit first cohort. ${seasonalContext.includes('New Year') || seasonalContext.includes('Back-to-school') ? 'The timing is perfect for transformation messaging.' : 'Focus on intimate connection over volume.'}`
          : audienceSize < 10000
          ? `Medium audience sweet spot: Balance personal touch with scalable tactics. ${format === 'cohort' ? 'Aim for 20-30 people max.' : 'Use email sequences and social proof.'} ${seasonalContext.includes('Black Friday') ? 'Consider a limited-time offer to create urgency.' : 'Your size is perfect for sustainable launches.'}`
          : `Large audience advantage: You can fill a ${format === 'cohort' ? 'cohort fast. Consider multiple cohorts or waitlist' : 'course quickly. Use testimonials and social proof heavily'}. ${seasonalContext.includes('Q4') || seasonalContext.includes('New Year') ? 'The seasonal timing gives you extra momentum.' : 'Even 1-2% conversion means serious revenue.'} Think bigger.`,
        webinarPitch: undefined as WebinarPitch | undefined,
      };

      if (format === 'cohort' || format === 'workshop') {
        const hook = comfortLevel === 'nervous'
          ? `Hey everyone, I'm ${format === 'cohort' ? 'bringing together a small group' : 'running a workshop'} to help with [PROBLEM]. I've been there, and I want to share what worked for me.`
          : comfortLevel === 'moderate'
          ? `Imagine ${format === 'cohort' ? 'learning this alongside people who get it' : 'solving this problem in one focused session'}. That's what we're doing${format === 'cohort' ? ' together' : ' today'}.`
          : `Here's the truth: most people struggle with [PROBLEM] because they try to do it alone. ${format === 'cohort' ? 'This cohort changes that.' : 'This workshop fixes that in [X hours].'}`;

        aiEnhancements.webinarPitch = {
          hook,
          bullets: comfortLevel === 'nervous' ? [
            'I will share what finally worked for me',
            'You will learn the step-by-step system',
            `We will ${format === 'cohort' ? 'support each other through the process' : 'get hands-on practice together'}`,
          ] : comfortLevel === 'moderate' ? [
            'Why most people stay stuck (and how to break free)',
            'The exact system I use to get results',
            `What you will learn inside the ${format}`,
          ] : [
            'The costly mistakes keeping you stuck',
            'My proven framework that works for [OUTCOME]',
            `Why ${format === 'cohort' ? 'learning with a group' : 'focused workshop time'} accelerates your success`,
          ],
          cta: comfortLevel === 'nervous'
            ? 'If this sounds helpful, I would love to have you. Link in the description.'
            : comfortLevel === 'moderate'
            ? 'If you are ready to stop spinning your wheels and start seeing results, join us. Link below.'
            : 'If you are serious about [OUTCOME] and ready to take action NOW, this is for you. Link in description - let us go.',
        };
      }
    }

    return {
      ...basePlan,
      insights: {
        momentum: aiEnhancements.momentum || '',
        lowPressureTips: aiEnhancements.lowPressureTips || '',
        recommendation: aiEnhancements.recommendation || '',
      },
      webinarPitch: aiEnhancements.webinarPitch,
    } as LaunchPlanResult;

  } catch (error) {
    console.error('AI enhancement failed, using fallback:', error);

    const isSmallAudience = audienceSize < 1000;
    const isLargeAudience = audienceSize >= 10000;
    const seasonalContext = getSeasonalContext(req.launchDate);

    // Return base plan with fallback insights
    return {
      ...basePlan,
      insights: {
        momentum: audienceSize < 1000 
          ? 'With your audience size, personal connection is everything. Reply to every comment, DM engaged followers, make people feel seen. Small audiences convert higher when they feel personally connected to you.'
          : audienceSize < 10000
          ? 'Build momentum by showing up consistently each day. Your audience is big enough for social proof to work - share who\'s joining, highlight excitement, create a sense of movement.'
          : 'You have serious reach. Focus on numbers and social proof: "50 joined in the first hour." Use waitlists, create FOMO. Your audience size gives you leverage - use it.',
        lowPressureTips: comfortLevel === 'nervous' 
          ? `First launch jitters are normal. You don't need to go live, you don't need to be perfect. ${audienceSize < 1000 ? 'With your small audience, even text posts and DMs work.' : 'Even simple posts and emails will work.'} Focus on helping, not selling.`
          : comfortLevel === 'moderate'
          ? `You've got experience - trust it. ${audienceSize >= 10000 ? 'Your audience size means you don\'t need to convince everyone. Even 1% conversion is significant.' : 'Show up consistently, handle objections calmly.'} Stay authentic.`
          : `You're ready for bold moves. ${audienceSize >= 10000 ? 'Use strong CTAs, create real urgency, and leverage your reach.' : 'Be direct about the transformation.'} Don't hold back.`,
        recommendation: audienceSize < 1000
          ? `Small audience strategy: Go deep, not wide. DM every interested person, create a tight-knit first cohort. ${seasonalContext.includes('New Year') || seasonalContext.includes('Back-to-school') ? 'The timing is perfect for transformation messaging.' : 'Focus on intimate connection.'}`
          : audienceSize < 10000
          ? `Medium audience sweet spot: Balance personal touch with scalable tactics. ${seasonalContext.includes('Black Friday') ? 'Consider a limited-time offer to create urgency.' : 'Your size is perfect for sustainable launches.'}`
          : `Large audience advantage: You can fill fast. ${seasonalContext.includes('Q4') || seasonalContext.includes('New Year') ? 'The seasonal timing gives you extra momentum.' : 'Even 1-2% conversion means serious revenue.'} Think bigger.`,
      },
      webinarPitch: (format === 'cohort' || format === 'workshop') ? {
        hook: comfortLevel === 'nervous'
          ? `Hey everyone, I'm ${format === 'cohort' ? 'bringing together a small group' : 'running a workshop'} to help with [PROBLEM]. I want to share what worked for me.`
          : `Here's the truth: most people struggle with [PROBLEM] because they try to do it alone. ${format === 'cohort' ? 'This cohort changes that.' : 'This workshop fixes that.'}`,
        bullets: [
          "The mistakes keeping you stuck",
          "My proven framework for getting results",
          "Exactly what you'll get inside",
        ],
        cta: comfortLevel === 'nervous' 
          ? "If this sounds helpful, I'd love to have you. Link below."
          : "If you're ready to take action, join us. Link in description.",
      } : undefined,
    } as LaunchPlanResult;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LaunchPlanRequest = await request.json();

    // Validate input
    if (!body.format || !body.launchDate || !body.audienceSize || !body.comfortLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (body.audienceSize < 1) {
      return NextResponse.json(
        { error: 'Audience size must be greater than 0' },
        { status: 400 }
      );
    }

    // Generate base launch plan (rule-based)
    const basePlan = generateBaseLaunchPlan(body);

    // Enhance with AI
    const fullPlan = await enhanceLaunchPlan(basePlan, body);

    return NextResponse.json({ result: fullPlan });

  } catch (error) {
    console.error('Launch planner error:', error);
    return NextResponse.json(
      { error: 'Failed to generate launch plan' },
      { status: 500 }
    );
  }
}
