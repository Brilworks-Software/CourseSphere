import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface MigrationStep {
  step: number;
  title: string;
  description: string;
  estimatedTime: string;
}

interface RiskFactor {
  factor: string;
  level: 'Low' | 'Medium' | 'High';
  mitigation: string;
}

// Static migration time estimates (in hours)
const PLATFORM_BASE_TIMES: Record<string, number> = {
  teachable: 3,
  thinkific: 3,
  kajabi: 4,
  podia: 2.5,
  gumroad: 1.5,
  udemy: 5, // More complex due to limited export options
  skillshare: 5, // Similar to Udemy
  wordpress: 4,
  custom: 6,
  none: 0.5, // Starting fresh
};

// Calculate total migration time
function calculateMigrationTime(
  platform: string,
  courseCount: number,
  studentCount: number
): { totalHours: number; complexity: 'Simple' | 'Moderate' | 'Complex' } {
  const baseTim = PLATFORM_BASE_TIMES[platform] || 3;
  
  // Add time per course (0.5 hours per additional course after first)
  const courseTime = Math.max(0, courseCount - 1) * 0.5;
  
  // Add time based on student count (data migration complexity)
  let studentTime = 0;
  if (studentCount > 1000) {
    studentTime = 2;
  } else if (studentCount > 500) {
    studentTime = 1;
  } else if (studentCount > 100) {
    studentTime = 0.5;
  }
  
  const totalHours = baseTim + courseTime + studentTime;
  
  // Determine complexity
  let complexity: 'Simple' | 'Moderate' | 'Complex';
  if (totalHours <= 3) {
    complexity = 'Simple';
  } else if (totalHours <= 6) {
    complexity = 'Moderate';
  } else {
    complexity = 'Complex';
  }
  
  return { totalHours, complexity };
}

// Format time display
function formatTimeDisplay(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  } else if (hours < 2) {
    return '1-2 hours';
  } else if (hours < 4) {
    return '2-4 hours';
  } else if (hours < 8) {
    return '4-8 hours';
  } else {
    return `${Math.ceil(hours)} hours`;
  }
}

// Determine risk level
function determineRiskLevel(
  platform: string,
  courseCount: number,
  studentCount: number
): 'Low' | 'Medium' | 'High' {
  // High risk platforms (limited export capabilities)
  if (['udemy', 'skillshare'].includes(platform)) {
    return 'High';
  }
  
  // Medium risk for large student bases
  if (studentCount > 1000 || courseCount > 10) {
    return 'Medium';
  }
  
  // Low risk otherwise
  return 'Low';
}

// Generate migration steps
function generateMigrationSteps(
  platform: string,
  courseCount: number,
  studentCount: number
): MigrationStep[] {
  const steps: MigrationStep[] = [];
  
  // Step 1: Export data
  if (platform === 'none') {
    steps.push({
      step: 1,
      title: 'Create Your CourseSphere Account',
      description: 'Sign up and set up your instructor profile. This takes just a few minutes.',
      estimatedTime: '5-10 min',
    });
  } else {
    steps.push({
      step: 1,
      title: 'Export Your Data',
      description: `Download your course content, student list, and enrollment data from ${PLATFORM_BASE_TIMES[platform] ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'your current platform'}. Most platforms provide a bulk export feature.`,
      estimatedTime: '15-30 min',
    });
  }
  
  // Step 2: Create account or import content
  if (platform === 'none') {
    steps.push({
      step: 2,
      title: 'Upload Your Course Materials',
      description: 'Upload videos, documents, and other course content directly to CourseSphere.',
      estimatedTime: `${Math.ceil(courseCount * 20)} min`,
    });
  } else {
    steps.push({
      step: 2,
      title: 'Create CourseSphere Account',
      description: 'Sign up for CourseSphere and connect your payment processor (Stripe).',
      estimatedTime: '10 min',
    });
    
    steps.push({
      step: 3,
      title: 'Import Course Content',
      description: `Upload your ${courseCount} course${courseCount > 1 ? 's' : ''} to CourseSphere. Our bulk upload tool makes this fast.`,
      estimatedTime: `${Math.ceil(courseCount * 30)} min`,
    });
  }
  
  // Step 3/4: Student migration
  if (studentCount > 0) {
    const stepNum = platform === 'none' ? 3 : 4;
    steps.push({
      step: stepNum,
      title: 'Migrate Student Data',
      description: `Import your ${studentCount} student records via CSV upload. Enrollment history is preserved.`,
      estimatedTime: studentCount > 500 ? '30-60 min' : '15-30 min',
    });
  }
  
  // Step 4/5: Testing
  const testStepNum = steps.length + 1;
  steps.push({
    step: testStepNum,
    title: 'Test Everything',
    description: 'Preview courses, test enrollment flow, and verify student access before going live.',
    estimatedTime: '30-45 min',
  });
  
  // Step 5/6: Go live
  steps.push({
    step: testStepNum + 1,
    title: 'Launch on CourseSphere',
    description: 'Update your links, notify students, and start accepting enrollments on your new platform.',
    estimatedTime: '15-30 min',
  });
  
  return steps;
}

// Generate risk factors
function generateRiskFactors(
  platform: string,
  courseCount: number,
  studentCount: number
): RiskFactor[] {
  const risks: RiskFactor[] = [];
  
  // Platform-specific risks
  if (['udemy', 'skillshare'].includes(platform)) {
    risks.push({
      factor: 'Limited Export Options',
      level: 'High',
      mitigation: 'We provide manual migration support for marketplace platforms. Our team helps extract your content.',
    });
  } else if (['custom', 'wordpress'].includes(platform)) {
    risks.push({
      factor: 'Custom Data Format',
      level: 'Medium',
      mitigation: 'Our import tool supports CSV and standard LMS formats. Custom mapping may be needed for unique setups.',
    });
  } else {
    risks.push({
      factor: 'Data Export Compatibility',
      level: 'Low',
      mitigation: 'Most modern platforms provide standard export formats that CourseSphere can import directly.',
    });
  }
  
  // Student data risk
  if (studentCount > 1000) {
    risks.push({
      factor: 'Large Student Database',
      level: 'Medium',
      mitigation: 'Bulk CSV import handles thousands of records efficiently. We validate data integrity automatically.',
    });
  } else if (studentCount > 100) {
    risks.push({
      factor: 'Student Data Migration',
      level: 'Low',
      mitigation: 'Standard CSV import process. Student emails and enrollment history are preserved.',
    });
  }
  
  // Course complexity risk
  if (courseCount > 10) {
    risks.push({
      factor: 'Multiple Courses',
      level: 'Medium',
      mitigation: 'Use our bulk course creator to import multiple courses simultaneously. Templates speed up the process.',
    });
  }
  
  // Always include downtime risk
  risks.push({
    factor: 'Student Access Downtime',
    level: 'Low',
    mitigation: 'Run both platforms in parallel during migration. Switch DNS/links only after everything is tested.',
  });
  
  return risks;
}

// Generate AI reassurance
async function generateReassurance(
  platform: string,
  courseCount: number,
  studentCount: number,
  totalHours: number,
  complexity: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const platformName = platform === 'none' ? 'scratch' : platform.charAt(0).toUpperCase() + platform.slice(1);
  
  const prompt = `You are a migration specialist helping creators move to a new platform.

Migration Details:
- From: ${platformName}
- Courses: ${courseCount}
- Students: ${studentCount}
- Estimated Time: ${totalHours} hours
- Complexity: ${complexity}

Write a 2-3 sentence reassurance message that:
1. Acknowledges their specific situation
2. States that most creators complete migration in under a day
3. Emphasizes that the process is easier than expected
4. Mentions specific pain points will be handled

Tone: Confident, reassuring, specific to their numbers
Do NOT use exclamation marks or overly salesy language.

Return ONLY the reassurance message, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('AI reassurance generation failed:', error);
    
    // Fallback reassurance
    if (totalHours <= 4) {
      return `Most creators with ${courseCount} course${courseCount > 1 ? 's' : ''} and ${studentCount} students complete their migration in a single afternoon. The process is more straightforward than expected - we handle the technical complexity so you can focus on preparing your students for the transition.`;
    } else {
      return `While migrating ${courseCount} course${courseCount > 1 ? 's' : ''} with ${studentCount} students takes some time, most creators complete it within a day. Our migration tools automate the heavy lifting, and our support team is available if you need hands-on help.`;
    }
  }
}

// Generate benefits
function generateBenefits(platform: string, studentCount: number): string[] {
  const benefits = [
    'No more platform fees eating into your revenue',
    'Full control over pricing and student experience',
    'Direct relationship with your students (no marketplace middleman)',
    'Built-in live cohort features for higher engagement',
    'Integrated email marketing to reduce tool sprawl',
  ];
  
  // Platform-specific benefits
  if (['udemy', 'skillshare'].includes(platform)) {
    benefits.unshift('Own your audience instead of renting it from a marketplace');
  }
  
  if (studentCount > 500) {
    benefits.push('Better analytics and insights into student behavior');
  }
  
  return benefits;
}

export async function POST(req: NextRequest) {
  try {
    const { currentPlatform, courseCount, studentCount } = await req.json();

    if (!currentPlatform) {
      return NextResponse.json(
        { error: 'Please select your current platform' },
        { status: 400 }
      );
    }

    if (typeof courseCount !== 'number' || courseCount < 1) {
      return NextResponse.json(
        { error: 'Please provide a valid course count' },
        { status: 400 }
      );
    }

    if (typeof studentCount !== 'number' || studentCount < 0) {
      return NextResponse.json(
        { error: 'Please provide a valid student count' },
        { status: 400 }
      );
    }

    // Calculate migration time
    const { totalHours, complexity } = calculateMigrationTime(
      currentPlatform,
      courseCount,
      studentCount
    );

    // Determine risk level
    const riskLevel = determineRiskLevel(currentPlatform, courseCount, studentCount);

    // Generate migration steps
    const migrationSteps = generateMigrationSteps(currentPlatform, courseCount, studentCount);

    // Generate risk factors
    const riskFactors = generateRiskFactors(currentPlatform, courseCount, studentCount);

    // Generate AI reassurance
    const reassurance = await generateReassurance(
      currentPlatform,
      courseCount,
      studentCount,
      totalHours,
      complexity
    );

    // Generate benefits
    const benefits = generateBenefits(currentPlatform, studentCount);

    // Format time display
    const totalTimeDisplay = formatTimeDisplay(totalHours);

    // Determine if ready to migrate (always true, but could add logic)
    const readyToMigrate = true;

    return NextResponse.json({
      result: {
        totalTimeHours: totalHours,
        totalTimeDisplay,
        complexity,
        riskLevel,
        migrationSteps,
        riskFactors,
        reassurance,
        benefits,
        readyToMigrate,
      },
    });
  } catch (error: any) {
    console.error('Migration estimator error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to estimate migration effort' },
      { status: 500 }
    );
  }
}
