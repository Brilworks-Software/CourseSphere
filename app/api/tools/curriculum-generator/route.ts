import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function generateCurriculum(
  audienceLevel: string,
  desiredOutcome: string,
  duration: number,
  durationType: string,
  format: string
) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const totalWeeks = durationType === 'months' ? duration * 4 : duration;
    const pacing = format === 'cohort' ? 'live cohort with group activities' : 'self-paced with individual progress';

    const prompt = `You are an expert instructional designer specializing in outcome-based curriculum design. Design a transformation-first curriculum using the backward design method.

TARGET AUDIENCE: ${audienceLevel} level students
DESIRED OUTCOME: ${desiredOutcome}
DURATION: ${duration} ${durationType} (${totalWeeks} weeks)
FORMAT: ${format} (${pacing})

Use the OUTCOME-FIRST FRAMEWORK:
1. Start with the final transformation (what they can DO)
2. Reverse-engineer the required skills
3. Map skills to progressive lessons
4. Add assessments that prove outcome achievement

Provide your response in this EXACT format:

COURSE_TITLE: [Create a transformation-focused title]

FINAL_OUTCOME: [Rewrite the outcome as a clear, measurable transformation statement]

TARGET_AUDIENCE: [Describe who this is for and their starting point]

TOTAL_DURATION: ${duration} ${durationType}

Then create ${Math.min(totalWeeks, 12)} week-by-week modules. For each module:

MODULE_WEEK: [1, 2, 3, etc.]
MODULE_TITLE: [Action-oriented title]
MODULE_DESCRIPTION: [What transformation happens this week]
MODULE_MILESTONE: [Specific outcome students achieve by end of week]

LESSONS: [Create 3-4 lessons per module]
LESSON_TITLE: [Specific lesson name]
LESSON_DURATION: [Duration like "45 min"]
LEARNING_OBJECTIVE: [What students will be able to DO after this lesson - start with action verb]
ACTIVITIES: [List 2-3 activities: "Practice exercise", "Build project", "Peer review", etc.]

ASSESSMENT: [One assessment that proves the milestone was achieved]

After all modules, provide transformation milestones:

MILESTONES:
[For each major checkpoint (25%, 50%, 75%, 100% of course)]
MILESTONE_WEEK: [Week number]
MILESTONE_TITLE: [Short title]
MILESTONE_OUTCOME: [What students can now do]
MILESTONE_SKILLS: [3-5 skills they've mastered, separated by |]

Finally provide:

TRANSFORMATION_PATH: [2-3 sentences explaining how the curriculum progressively builds to the final outcome]

OUTCOME_VALIDATION: [2-3 sentences on how to validate students achieved the outcome]

RECOMMENDATIONS: [2-3 sentences on best practices for delivering this curriculum]`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log('AI Response received, parsing...');
    const parsed = parseCurriculumResponse(response, duration, durationType, desiredOutcome);
    console.log('Parsing complete');
    return parsed;
  } catch (error) {
    console.error('AI generation error:', error);
    // Return fallback curriculum
    return createFallbackCurriculum(audienceLevel, desiredOutcome, duration, durationType);
  }
}

function parseCurriculumResponse(response: string, duration: number, durationType: string, desiredOutcome: string) {
  try {
    console.log('Starting curriculum parsing...');
    
    // Extract basic info
    const courseTitleMatch = response.match(/COURSE_TITLE:\s*([^\n]+)/);
    const finalOutcomeMatch = response.match(/FINAL_OUTCOME:\s*([^\n]+)/);
    const targetAudienceMatch = response.match(/TARGET_AUDIENCE:\s*([^\n]+)/);
    const totalDurationMatch = response.match(/TOTAL_DURATION:\s*([^\n]+)/);

    const courseTitle = courseTitleMatch?.[1].trim() || 'Transformation-Based Course';
    const finalOutcome = finalOutcomeMatch?.[1].trim() || desiredOutcome;
    const targetAudience = targetAudienceMatch?.[1].trim() || 'Students ready to transform';
    const totalDuration = totalDurationMatch?.[1].trim() || `${duration} ${durationType}`;

    console.log('Basic info extracted');

    // Parse modules - simplified approach
    const modules: any[] = [];
    const moduleMatches = response.matchAll(/MODULE_WEEK:\s*(\d+)/g);
    
    for (const match of moduleMatches) {
      const weekNum = parseInt(match[1]);
      const moduleStartIndex = match.index || 0;
      
      // Find the section for this module
      const nextModuleMatch = response.substring(moduleStartIndex + 1).match(/MODULE_WEEK:\s*\d+/);
      const moduleEndIndex = nextModuleMatch && nextModuleMatch.index !== undefined ? moduleStartIndex + 1 + nextModuleMatch.index : response.length;
      const moduleSection = response.substring(moduleStartIndex, moduleEndIndex);

      const titleMatch = moduleSection.match(/MODULE_TITLE:\s*([^\n]+)/);
      const descMatch = moduleSection.match(/MODULE_DESCRIPTION:\s*([^\n]+)/);
      const milestoneMatch = moduleSection.match(/MODULE_MILESTONE:\s*([^\n]+)/);
      const assessmentMatch = moduleSection.match(/ASSESSMENT:\s*([^\n]+)/);

      // Parse lessons for this module
      const lessons: any[] = [];
      const lessonMatches = moduleSection.matchAll(/LESSON_TITLE:\s*([^\n]+)/g);
      
      for (const lessonMatch of lessonMatches) {
        const lessonStart = lessonMatch.index || 0;
        const lessonSection = moduleSection.substring(lessonStart, lessonStart + 500);
        
        const durationMatch = lessonSection.match(/LESSON_DURATION:\s*([^\n]+)/);
        const objectiveMatch = lessonSection.match(/LEARNING_OBJECTIVE:\s*([^\n]+)/);
        const activitiesMatch = lessonSection.match(/ACTIVITIES:\s*([^\n]+)/);

        const activities = activitiesMatch?.[1]
          .split(/,|\|/)
          .map(a => a.trim())
          .filter(a => a.length > 0)
          .slice(0, 3) || ['Practice', 'Apply'];

        lessons.push({
          title: lessonMatch[1].trim(),
          duration: durationMatch?.[1].trim() || '30 min',
          learningObjective: objectiveMatch?.[1].trim() || 'Apply concepts',
          activities,
        });
      }

      modules.push({
        week: weekNum,
        title: titleMatch?.[1].trim() || `Week ${weekNum}`,
        description: descMatch?.[1].trim() || 'Build skills progressively',
        milestone: milestoneMatch?.[1].trim() || 'Achieve key outcome',
        lessons: lessons.length > 0 ? lessons.slice(0, 4) : [
          { title: 'Core Lesson', duration: '30 min', learningObjective: 'Learn key concepts', activities: ['Watch', 'Practice'] }
        ],
        assessment: assessmentMatch?.[1].trim() || 'Complete practical project',
      });
    }

    console.log(`Parsed ${modules.length} modules`);

    // Parse milestones
    const milestones: any[] = [];
    const milestoneMatches = response.matchAll(/MILESTONE_WEEK:\s*(\d+)/g);
    
    for (const match of milestoneMatches) {
      const weekNum = parseInt(match[1]);
      const milestoneStart = match.index || 0;
      const milestoneSection = response.substring(milestoneStart, milestoneStart + 300);
      
      const titleMatch = milestoneSection.match(/MILESTONE_TITLE:\s*([^\n]+)/);
      const outcomeMatch = milestoneSection.match(/MILESTONE_OUTCOME:\s*([^\n]+)/);
      const skillsMatch = milestoneSection.match(/MILESTONE_SKILLS:\s*([^\n]+)/);

      const skills = skillsMatch?.[1]
        .split(/,|\|/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 5) || ['Skill 1', 'Skill 2'];

      milestones.push({
        week: weekNum,
        title: titleMatch?.[1].trim() || `Milestone ${weekNum}`,
        outcome: outcomeMatch?.[1].trim() || 'Key competency achieved',
        skills,
      });
    }

    console.log(`Parsed ${milestones.length} milestones`);

    // Parse insights
    const transformationPathMatch = response.match(/TRANSFORMATION_PATH:\s*([^\n]+(?:\n(?!OUTCOME_VALIDATION:)[^\n]+)*)/);
    const outcomeValidationMatch = response.match(/OUTCOME_VALIDATION:\s*([^\n]+(?:\n(?!RECOMMENDATIONS:)[^\n]+)*)/);
    const recommendationsMatch = response.match(/RECOMMENDATIONS:\s*([^\n]+(?:\n(?!$)[^\n]+)*)/);

    const insights = {
      transformationPath: transformationPathMatch?.[1].trim() || 'This curriculum builds skills progressively toward the final outcome.',
      outcomeValidation: outcomeValidationMatch?.[1].trim() || 'Validate outcomes through practical assessments and real-world projects.',
      recommendations: recommendationsMatch?.[1].trim() || 'Focus on hands-on practice and regular feedback to ensure transformation.',
    };

    // Use fallback if no modules parsed
    if (modules.length === 0) {
      console.log('No modules parsed, using fallback');
      return createFallbackCurriculum(courseTitle, desiredOutcome, duration, durationType);
    }

    // Use fallback milestones if none parsed
    if (milestones.length === 0) {
      const totalWeeks = modules.length;
      milestones.push(
        { week: Math.ceil(totalWeeks * 0.25), title: 'Foundation', outcome: 'Core concepts mastered', skills: ['Basic skills'] },
        { week: Math.ceil(totalWeeks * 0.5), title: 'Intermediate', outcome: 'Can apply independently', skills: ['Applied skills'] },
        { week: Math.ceil(totalWeeks * 0.75), title: 'Advanced', outcome: 'Complex problems solved', skills: ['Advanced skills'] },
        { week: totalWeeks, title: 'Mastery', outcome: finalOutcome, skills: ['Complete transformation'] }
      );
    }

    return {
      courseTitle,
      finalOutcome,
      targetAudience,
      totalDuration,
      modules,
      milestones,
      insights,
    };
  } catch (error) {
    console.error('Error parsing curriculum:', error);
    return createFallbackCurriculum('Course', desiredOutcome, duration, durationType);
  }
}

function createFallbackCurriculum(audienceLevel: string, desiredOutcome: string, duration: number, durationType: string) {
  const totalWeeks = durationType === 'months' ? duration * 4 : duration;
  const weeksToCreate = Math.min(totalWeeks, 8);
  
  const modules = [];
  for (let i = 1; i <= weeksToCreate; i++) {
    modules.push({
      week: i,
      title: `Week ${i}: Progressive Development`,
      description: `Build foundational skills and progress toward mastery`,
      milestone: `Students can demonstrate key competency ${i}`,
      lessons: [
        { title: 'Introduction to Concepts', duration: '30 min', learningObjective: 'Understand core principles', activities: ['Video lecture', 'Reading'] },
        { title: 'Hands-on Practice', duration: '45 min', learningObjective: 'Apply concepts practically', activities: ['Practice exercise', 'Build project'] },
        { title: 'Application', duration: '30 min', learningObjective: 'Demonstrate mastery', activities: ['Complete challenge', 'Peer review'] },
      ],
      assessment: 'Complete practical project demonstrating the week\'s outcome',
    });
  }

  return {
    courseTitle: 'Transformation-Based Course',
    finalOutcome: desiredOutcome,
    targetAudience: `${audienceLevel} level students ready to achieve transformation`,
    totalDuration: `${duration} ${durationType}`,
    modules,
    milestones: [
      { week: Math.ceil(weeksToCreate * 0.25), title: 'Foundation Built', outcome: 'Core skills established', skills: ['Fundamental concepts', 'Basic application'] },
      { week: Math.ceil(weeksToCreate * 0.5), title: 'Competency Achieved', outcome: 'Independent application', skills: ['Intermediate skills', 'Problem solving'] },
      { week: Math.ceil(weeksToCreate * 0.75), title: 'Advanced Proficiency', outcome: 'Complex challenges solved', skills: ['Advanced techniques', 'Creative solutions'] },
      { week: weeksToCreate, title: 'Final Transformation', outcome: desiredOutcome, skills: ['Complete mastery', 'Real-world application'] },
    ],
    insights: {
      transformationPath: 'This curriculum progressively builds from foundational concepts to advanced application, ensuring students achieve the desired transformation.',
      outcomeValidation: 'Validate student outcomes through practical projects, peer reviews, and real-world application of skills.',
      recommendations: 'Provide frequent feedback, encourage hands-on practice, and create opportunities for students to demonstrate mastery at each milestone.',
    },
  };
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
    const { audienceLevel, desiredOutcome, duration, durationType, format } = body;

    // Validate inputs
    if (!audienceLevel || !['beginner', 'intermediate', 'advanced'].includes(audienceLevel)) {
      return NextResponse.json(
        { error: 'Invalid audience level' },
        { status: 400 }
      );
    }

    if (!desiredOutcome || desiredOutcome.length < 10) {
      return NextResponse.json(
        { error: 'Desired outcome must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (!duration || duration < 1 || duration > 52) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 52' },
        { status: 400 }
      );
    }

    if (!durationType || !['weeks', 'months'].includes(durationType)) {
      return NextResponse.json(
        { error: 'Invalid duration type' },
        { status: 400 }
      );
    }

    if (!format || !['self-paced', 'cohort'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format' },
        { status: 400 }
      );
    }

    // Generate curriculum
    const result = await generateCurriculum(
      audienceLevel,
      desiredOutcome,
      duration,
      durationType,
      format
    );

    if (!result || !result.modules || result.modules.length === 0) {
      console.error('Invalid result from generateCurriculum');
      return NextResponse.json(
        { error: 'Failed to generate curriculum. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Curriculum generator error:', error);
    
    // Return a fallback curriculum instead of error
    const fallback = createFallbackCurriculum(
      body.audienceLevel || 'beginner',
      body.desiredOutcome || 'achieve transformation',
      body.duration || 4,
      body.durationType || 'weeks'
    );
    
    return NextResponse.json({ result: fallback });
  }
}
