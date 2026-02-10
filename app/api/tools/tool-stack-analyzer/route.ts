import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ToolCost {
  name: string;
  monthlyCost: number;
  category: string;
}

interface ConsolidationOption {
  name: string;
  replacesTools: string[];
  monthlyCost: number;
  savings: number;
  timeSaved: string;
}

// Static pricing database
const TOOL_PRICING: Record<string, { name: string; cost: number; category: string }> = {
  teachable: { name: 'Teachable', cost: 59, category: 'Course Hosting' },
  kajabi: { name: 'Kajabi', cost: 149, category: 'Course Hosting' },
  thinkific: { name: 'Thinkific', cost: 49, category: 'Course Hosting' },
  podia: { name: 'Podia', cost: 39, category: 'Course Hosting' },
  mailchimp: { name: 'Mailchimp', cost: 35, category: 'Email Marketing' },
  convertkit: { name: 'ConvertKit', cost: 29, category: 'Email Marketing' },
  activecampaign: { name: 'ActiveCampaign', cost: 49, category: 'Email Marketing' },
  zoom: { name: 'Zoom Pro', cost: 15, category: 'Video/Live' },
  streamyard: { name: 'StreamYard', cost: 25, category: 'Video/Live' },
  riverside: { name: 'Riverside.fm', cost: 24, category: 'Video/Live' },
  circle: { name: 'Circle', cost: 49, category: 'Community' },
  discord: { name: 'Discord Premium', cost: 10, category: 'Community' },
  slack: { name: 'Slack Pro', cost: 8, category: 'Community' },
  canva: { name: 'Canva Pro', cost: 13, category: 'Design' },
  adobe: { name: 'Adobe Creative Cloud', cost: 55, category: 'Design' },
  calendly: { name: 'Calendly', cost: 12, category: 'Scheduling' },
  acuity: { name: 'Acuity Scheduling', cost: 16, category: 'Scheduling' },
  stripe: { name: 'Stripe', cost: 0, category: 'Payment Processing' },
  gumroad: { name: 'Gumroad', cost: 0, category: 'Payment Processing' },
  notion: { name: 'Notion', cost: 10, category: 'Productivity' },
  airtable: { name: 'Airtable', cost: 20, category: 'Productivity' },
  zapier: { name: 'Zapier', cost: 30, category: 'Automation' },
  buffer: { name: 'Buffer', cost: 15, category: 'Social Media' },
  hootsuite: { name: 'Hootsuite', cost: 49, category: 'Social Media' },
};

// Calculate monthly spend
function calculateMonthlySpend(tools: string[]): number {
  return tools.reduce((total, tool) => {
    return total + (TOOL_PRICING[tool]?.cost || 0);
  }, 0);
}

// Calculate time cost (assuming $50/hour as average creator rate)
function calculateTimeCost(hoursPerWeek: number): number {
  const hourlyRate = 50;
  const monthlyHours = hoursPerWeek * 4.33; // Average weeks per month
  return Math.round(monthlyHours * hourlyRate);
}

// Calculate complexity score (0-100)
function calculateComplexityScore(tools: string[], hoursPerWeek: number): number {
  let score = 0;
  
  // More tools = higher complexity (up to 50 points)
  const toolCount = tools.length;
  score += Math.min(50, toolCount * 5);
  
  // More time switching = higher complexity (up to 30 points)
  score += Math.min(30, hoursPerWeek * 3);
  
  // Multiple tools in same category = higher complexity (up to 20 points)
  const categories = tools.map(t => TOOL_PRICING[t]?.category).filter(Boolean);
  const duplicateCategories = categories.length - new Set(categories).size;
  score += Math.min(20, duplicateCategories * 5);
  
  return Math.min(100, Math.round(score));
}

// Get tools by category
function groupToolsByCategory(tools: string[]): Record<string, ToolCost[]> {
  const grouped: Record<string, ToolCost[]> = {};
  
  tools.forEach(tool => {
    const toolData = TOOL_PRICING[tool];
    if (toolData) {
      if (!grouped[toolData.category]) {
        grouped[toolData.category] = [];
      }
      grouped[toolData.category].push({
        name: toolData.name,
        monthlyCost: toolData.cost,
        category: toolData.category,
      });
    }
  });
  
  return grouped;
}

// Generate consolidation recommendations
function generateConsolidationOptions(tools: string[], currentSpend: number): ConsolidationOption[] {
  const options: ConsolidationOption[] = [];
  const toolNames = tools.map(t => TOOL_PRICING[t]?.name).filter(Boolean);
  
  // Check if they have course hosting + email + community tools
  const hasCourseHosting = tools.some(t => TOOL_PRICING[t]?.category === 'Course Hosting');
  const hasEmail = tools.some(t => TOOL_PRICING[t]?.category === 'Email Marketing');
  const hasCommunity = tools.some(t => TOOL_PRICING[t]?.category === 'Community');
  const hasVideo = tools.some(t => TOOL_PRICING[t]?.category === 'Video/Live');
  const hasScheduling = tools.some(t => TOOL_PRICING[t]?.category === 'Scheduling');
  
  // CourseSphere can replace course hosting, email, community, video, scheduling
  const courseSphereReplaces = toolNames.filter(name => {
    const tool = tools.find(t => TOOL_PRICING[t]?.name === name);
    if (!tool) return false;
    const category = TOOL_PRICING[tool]?.category;
    return ['Course Hosting', 'Email Marketing', 'Community', 'Video/Live', 'Scheduling'].includes(category);
  });
  
  if (courseSphereReplaces.length >= 2) {
    const replacedCost = courseSphereReplaces.reduce((sum, name) => {
      const tool = Object.keys(TOOL_PRICING).find(k => TOOL_PRICING[k].name === name);
      return sum + (tool ? TOOL_PRICING[tool].cost : 0);
    }, 0);
    
    const courseSphereEstimatedCost = 49; // Estimated monthly cost
    const savings = replacedCost - courseSphereEstimatedCost;
    
    if (savings > 0) {
      options.push({
        name: 'CourseSphere',
        replacesTools: courseSphereReplaces,
        monthlyCost: courseSphereEstimatedCost,
        savings,
        timeSaved: '10-15h/month',
      });
    }
  }
  
  // Kajabi can replace course hosting + email + automation
  const kajabiReplaces = toolNames.filter(name => {
    const tool = tools.find(t => TOOL_PRICING[t]?.name === name);
    if (!tool) return false;
    const category = TOOL_PRICING[tool]?.category;
    return ['Course Hosting', 'Email Marketing', 'Automation'].includes(category);
  });
  
  if (kajabiReplaces.length >= 2 && !tools.includes('kajabi')) {
    const replacedCost = kajabiReplaces.reduce((sum, name) => {
      const tool = Object.keys(TOOL_PRICING).find(k => TOOL_PRICING[k].name === name);
      return sum + (tool ? TOOL_PRICING[tool].cost : 0);
    }, 0);
    
    const kajabiCost = 149;
    const savings = replacedCost - kajabiCost;
    
    if (savings > 0) {
      options.push({
        name: 'Kajabi',
        replacesTools: kajabiReplaces,
        monthlyCost: kajabiCost,
        savings,
        timeSaved: '8-12h/month',
      });
    }
  }
  
  // Sort by savings (highest first)
  return options.sort((a, b) => b.savings - a.savings);
}

// Generate AI narrative
async function generateNarrative(
  currentSpend: number,
  timeCostPerMonth: number,
  totalCost: number,
  toolCount: number,
  complexityScore: number,
  hoursPerWeek: number
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a business efficiency advisor. Write a narrative explaining the hidden costs of tool sprawl.

Context:
- Using ${toolCount} different tools
- Spending $${currentSpend}/month on subscriptions
- Spending ${hoursPerWeek} hours/week switching tools (worth $${timeCostPerMonth}/month)
- Total cost: $${totalCost}/month
- Complexity score: ${complexityScore}/100

Write a 3-4 sentence narrative that:
1. Highlights they are paying TWICE: in money and mental load
2. Explains the hidden cost of context switching
3. Emphasizes the opportunity cost (what they could do with that time)
4. Creates urgency to consolidate

Tone: Direct, empathetic, eye-opening
Do NOT mention specific platforms or solutions.

Return ONLY the narrative, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('AI narrative generation failed:', error);
    
    // Fallback narrative
    return `You are paying twice for your ${toolCount}-tool stack: $${currentSpend}/month in subscriptions, plus $${timeCostPerMonth}/month in lost productivity. Every time you switch tools, you lose focus, momentum, and creative energy. That is ${hoursPerWeek} hours per week you could spend creating content, connecting with your audience, or growing your business. The mental overhead of managing this many tools is invisible but expensive - and it compounds every single day.`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tools, hoursPerWeek } = await req.json();

    if (!tools || !Array.isArray(tools) || tools.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one tool' },
        { status: 400 }
      );
    }

    if (typeof hoursPerWeek !== 'number' || hoursPerWeek < 0) {
      return NextResponse.json(
        { error: 'Please provide valid hours per week' },
        { status: 400 }
      );
    }

    // Calculate costs
    const currentSpend = calculateMonthlySpend(tools);
    const timeCostPerMonth = calculateTimeCost(hoursPerWeek);
    const totalCost = currentSpend + timeCostPerMonth;
    const complexityScore = calculateComplexityScore(tools, hoursPerWeek);

    // Group tools by category
    const toolsByCategory = groupToolsByCategory(tools);

    // Generate consolidation options
    const consolidationOptions = generateConsolidationOptions(tools, currentSpend);

    // Calculate potential savings
    const potentialSavings = consolidationOptions.length > 0 
      ? consolidationOptions[0].savings 
      : 0;

    // Generate AI narrative
    const narrative = await generateNarrative(
      currentSpend,
      timeCostPerMonth,
      totalCost,
      tools.length,
      complexityScore,
      hoursPerWeek
    );

    return NextResponse.json({
      result: {
        currentSpend,
        timeSpentSwitching: hoursPerWeek,
        timeCostPerMonth,
        totalCost,
        complexityScore,
        toolsByCategory,
        narrative,
        consolidationOptions,
        potentialSavings,
      },
    });
  } catch (error: any) {
    console.error('Tool stack analyzer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze tool stack' },
      { status: 500 }
    );
  }
}
