import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface CreatorOffering {
  creator: string;
  offering: string;
  format: "ebook" | "course" | "cohort" | "membership" | "template" | "coaching";
  price: number;
  currency: string;
  promise: string;
  source: string;
}

interface Pattern {
  format: string;
  count: number;
  priceRange: string;
  commonPromises: string[];
}

// Mock creator offerings database
const CREATOR_OFFERINGS: Record<string, CreatorOffering[]> = {
  "digital marketing": [
    { creator: "Alex Hormozi", offering: "Acquisition.com", format: "membership", price: 99, currency: "$", promise: "Scale your business to $1M+", source: "Twitter" },
    { creator: "Justin Welsh", offering: "LinkedIn OS", format: "course", price: 150, currency: "$", promise: "Build your personal brand in 90 days", source: "Landing Page" },
    { creator: "Dan Koe", offering: "2 Hour Writer", format: "ebook", price: 27, currency: "$", promise: "Write better content in less time", source: "Gumroad" },
    { creator: "Dickie Bush", offering: "Ship 30 for 30", format: "cohort", price: 50, currency: "$", promise: "Write 30 posts in 30 days", source: "Landing Page" },
    { creator: "Sahil Bloom", offering: "5-Minute Friday", format: "membership", price: 7, currency: "$", promise: "Weekly insights delivered", source: "Substack" },
    { creator: "Codie Sanchez", offering: "Main Street Millionaire", format: "course", price: 1997, currency: "$", promise: "Buy boring businesses that print money", source: "Landing Page" },
    { creator: "Leila Hormozi", offering: "Business Acquisition Course", format: "course", price: 997, currency: "$", promise: "Acquire businesses without capital", source: "Twitter" },
    { creator: "Shaan Puri", offering: "Business Brainstorms", format: "cohort", price: 1500, currency: "$", promise: "10 validated business ideas", source: "Twitter" },
    { creator: "Nathan Barry", offering: "Authority", format: "ebook", price: 49, currency: "$", promise: "Build your audience from zero", source: "ConvertKit" },
    { creator: "Arvid Kahl", offering: "Zero to Sold", format: "ebook", price: 39, currency: "$", promise: "Bootstrap your SaaS to exit", source: "Gumroad" },
  ],
  "productivity": [
    { creator: "Ali Abdaal", offering: "Part-Time YouTuber Academy", format: "cohort", price: 1500, currency: "$", promise: "Build a YouTube channel while working full-time", source: "Landing Page" },
    { creator: "Thomas Frank", offering: "Notion Templates Bundle", format: "template", price: 29, currency: "$", promise: "Organize your entire life", source: "Gumroad" },
    { creator: "Tiago Forte", offering: "Building a Second Brain", format: "cohort", price: 1500, currency: "$", promise: "Never forget anything important again", source: "Landing Page" },
    { creator: "Cal Newport", offering: "Deep Work Book", format: "ebook", price: 15, currency: "$", promise: "Focus without distraction", source: "Amazon" },
    { creator: "August Bradley", offering: "Notion Life OS", format: "template", price: 47, currency: "$", promise: "Complete life management system", source: "Gumroad" },
    { creator: "Francesco D'Alessio", offering: "Tool Finder+", format: "membership", price: 9, currency: "$", promise: "Discover the best productivity tools", source: "Landing Page" },
    { creator: "Marie Poulin", offering: "Notion Mastery", format: "course", price: 399, currency: "$", promise: "Master Notion in 6 weeks", source: "Landing Page" },
    { creator: "David Allen", offering: "GTD Course", format: "course", price: 299, currency: "$", promise: "Get everything done stress-free", source: "Landing Page" },
  ],
  "fitness": [
    { creator: "Jeff Nippard", offering: "Fundamentals Hypertrophy Program", format: "course", price: 89, currency: "$", promise: "Build muscle with science", source: "Landing Page" },
    { creator: "Athlean-X", offering: "AX-1", format: "course", price: 97, currency: "$", promise: "90-day total body transformation", source: "Landing Page" },
    { creator: "Natacha Océane", offering: "Home Workout Program", format: "course", price: 67, currency: "$", promise: "Get fit at home with no equipment", source: "Landing Page" },
    { creator: "Renaissance Periodization", offering: "RP Diet App", format: "membership", price: 14.99, currency: "$", promise: "Science-based meal planning", source: "App Store" },
    { creator: "Greg Doucette", offering: "Cookbook", format: "ebook", price: 99, currency: "$", promise: "High-volume low-calorie recipes", source: "Landing Page" },
    { creator: "Chloe Ting", offering: "Workout Programs", format: "course", price: 0, currency: "$", promise: "Free challenges for abs and tone", source: "YouTube" },
    { creator: "Caroline Girvan", offering: "EPIC Program", format: "course", price: 0, currency: "$", promise: "Epic strength and conditioning", source: "YouTube" },
    { creator: "MindPump", offering: "MAPS Programs", format: "course", price: 97, currency: "$", promise: "Intelligent workout programming", source: "Landing Page" },
  ],
  "design": [
    { creator: "Flux Academy", offering: "Web Design Course", format: "course", price: 997, currency: "$", promise: "Become a web designer in 12 weeks", source: "Landing Page" },
    { creator: "Ellen Lupton", offering: "Type Matters", format: "ebook", price: 25, currency: "$", promise: "Master typography fundamentals", source: "Amazon" },
    { creator: "The Futur", offering: "Business Bootcamp", format: "cohort", price: 1997, currency: "$", promise: "Build a 6-figure design business", source: "Landing Page" },
    { creator: "Ran Segall", offering: "Flux Templates", format: "template", price: 79, currency: "$", promise: "Professional website templates", source: "Gumroad" },
    { creator: "Sarah Drasner", offering: "Design for Developers", format: "course", price: 349, currency: "$", promise: "Design like a pro developer", source: "Frontend Masters" },
    { creator: "Femke.design", offering: "Figma Masterclass", format: "course", price: 149, currency: "$", promise: "Master Figma in 30 days", source: "Gumroad" },
    { creator: "Aaron Draplin", offering: "Logo Design Course", format: "course", price: 299, currency: "$", promise: "Design memorable logos", source: "Skillshare" },
  ],
  "coding": [
    { creator: "Kent C. Dodds", offering: "Epic React", format: "course", price: 599, currency: "$", promise: "Master React from beginner to expert", source: "Landing Page" },
    { creator: "Wes Bos", offering: "JavaScript30", format: "course", price: 0, currency: "$", promise: "30 vanilla JS projects in 30 days", source: "Landing Page" },
    { creator: "Maximilian Schwarzmüller", offering: "React Complete Guide", format: "course", price: 12.99, currency: "$", promise: "Complete React with hooks & Redux", source: "Udemy" },
    { creator: "Florin Pop", offering: "100 Days of Code", format: "course", price: 19, currency: "$", promise: "Build 100 projects in 100 days", source: "Gumroad" },
    { creator: "Scrimba", offering: "Frontend Career Path", format: "membership", price: 20, currency: "$", promise: "Land your first frontend job", source: "Landing Page" },
    { creator: "Josh Comeau", offering: "CSS for JavaScript Developers", format: "course", price: 495, currency: "$", promise: "Master CSS the right way", source: "Landing Page" },
    { creator: "Kyle Simpson", offering: "Deep JavaScript Foundations", format: "course", price: 39, currency: "$", promise: "Understand JS at a deep level", source: "Frontend Masters" },
    { creator: "Andrei Neagoie", offering: "ZTM Academy", format: "membership", price: 39, currency: "$", promise: "Complete developer bootcamp", source: "Landing Page" },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { niche, creatorLevel = "all" } = body;

    if (!niche) {
      return NextResponse.json(
        { error: "Niche is required" },
        { status: 400 }
      );
    }

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    
    if (!youtubeApiKey) {
      // Fallback to mock data if no API key
      return handleMockData(niche, creatorLevel);
    }

    // Step 1: Find channels in this niche
    const channels = await findChannelsInNiche(niche, youtubeApiKey, creatorLevel);
    
    if (channels.length === 0) {
      // Fallback to mock data if no channels found
      return handleMockData(niche, creatorLevel);
    }

    // Step 2: Extract offerings from channel descriptions/links
    const offerings = await extractChannelOfferings(channels, niche);

    // Step 3: Analyze patterns
    const patterns = analyzePatterns(offerings);
    const formatCounts = countFormats(offerings);
    const mostCommon = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "course";
    const leastCommon = Object.entries(formatCounts)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([format]) => `${format.charAt(0).toUpperCase() + format.slice(1)}s`);

    // Step 4: Generate AI insights based on real data
    const aiInsights = await generateCreatorInsights(niche, offerings, patterns);

    const result = {
      niche,
      creatorLevel,
      totalOfferings: offerings.length,
      offerings,
      patterns,
      mostCommon: `${mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1)}s`,
      leastCommon,
      opportunities: aiInsights.opportunities,
      differentiationAngles: aiInsights.differentiationAngles,
      recommendedOffer: aiInsights.recommendedOffer,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in creator niche scan:", error);
    return NextResponse.json(
      { error: "Failed to scan niche" },
      { status: 500 }
    );
  }
}

async function handleMockData(niche: string, creatorLevel: string) {
  const normalizedNiche = niche.toLowerCase().trim();
  let offerings = CREATOR_OFFERINGS[normalizedNiche] || generateGenericOfferings(niche);

  if (creatorLevel !== "all") {
    offerings = offerings.slice(0, Math.floor(offerings.length * 0.7));
  }

  const patterns = analyzePatterns(offerings);
  const formatCounts = countFormats(offerings);
  const mostCommon = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0][0];
  const leastCommon = Object.entries(formatCounts)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([format]) => `${format.charAt(0).toUpperCase() + format.slice(1)}s`);

  const aiInsights = await generateCreatorInsights(niche, offerings, patterns);

  return NextResponse.json({
    niche,
    creatorLevel,
    totalOfferings: offerings.length,
    offerings,
    patterns,
    mostCommon: `${mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1)}s`,
    leastCommon,
    opportunities: aiInsights.opportunities,
    differentiationAngles: aiInsights.differentiationAngles,
    recommendedOffer: aiInsights.recommendedOffer,
  });
}

async function findChannelsInNiche(niche: string, apiKey: string, creatorLevel: string) {
  try {
    // Determine subscriber count filter based on creator level
    let orderBy = "relevance";
    let maxResults = 4;

    // Search for channels in this niche
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&type=channel&q=${encodeURIComponent(niche + " course creator")}&maxResults=10&order=${orderBy}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }

    // Get detailed channel info including subscriber counts
    const channelIds = searchData.items.map((item: any) => item.snippet.channelId).join(',');
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&part=snippet,statistics,brandingSettings&id=${channelIds}`;
    
    const channelResponse = await fetch(channelUrl);
    const channelData = await channelResponse.json();

    if (!channelData.items) {
      return [];
    }

    // Filter by creator level if specified
    let filteredChannels = channelData.items;
    if (creatorLevel === "beginner") {
      filteredChannels = channelData.items.filter((ch: any) => parseInt(ch.statistics.subscriberCount) < 10000);
    } else if (creatorLevel === "intermediate") {
      filteredChannels = channelData.items.filter((ch: any) => {
        const subs = parseInt(ch.statistics.subscriberCount);
        return subs >= 10000 && subs < 100000;
      });
    } else if (creatorLevel === "advanced") {
      filteredChannels = channelData.items.filter((ch: any) => parseInt(ch.statistics.subscriberCount) >= 100000);
    }

    // Take top 4 channels
    return filteredChannels.slice(0, 4).map((channel: any) => ({
      channelId: channel.id,
      channelName: channel.snippet.title,
      description: channel.snippet.description,
      subscriberCount: parseInt(channel.statistics.subscriberCount),
      customUrl: channel.snippet.customUrl || "",
      links: channel.brandingSettings?.channel?.unsubscribedTrailer || "",
    }));
  } catch (error) {
    console.error("Error finding channels:", error);
    return [];
  }
}

async function extractChannelOfferings(channels: any[], niche: string): Promise<CreatorOffering[]> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    // Generate basic offerings from channel info
    return channels.flatMap((channel, index) => 
      generateOfferingsFromChannel(channel, niche, index)
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const channelInfo = channels.map(ch => 
      `Channel: ${ch.channelName} (${ch.subscriberCount} subscribers)\nDescription: ${ch.description}\n`
    ).join("\n---\n");

    const prompt = `Analyze these YouTube channels in the "${niche}" niche and identify what products/offerings they likely sell:

${channelInfo}

For each channel, infer what they might be selling based on:
- Channel description mentions (courses, ebooks, coaching, membership)
- Links mentioned
- Call-to-actions
- Common patterns in this niche

For each channel, provide 1-2 offerings in this JSON format:
{
  "offerings": [
    {
      "creator": "Channel Name",
      "offering": "Product Name",
      "format": "course|ebook|cohort|membership|template|coaching",
      "price": estimated_price_in_dollars,
      "currency": "$",
      "promise": "Main benefit/promise",
      "source": "YouTube Channel"
    }
  ]
}

Be realistic about formats and prices based on creator size and niche.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.offerings || [];
    }

    return channels.flatMap((channel, index) => 
      generateOfferingsFromChannel(channel, niche, index)
    );
  } catch (error) {
    console.error("Error extracting offerings:", error);
    return channels.flatMap((channel, index) => 
      generateOfferingsFromChannel(channel, niche, index)
    );
  }
}

function generateOfferingsFromChannel(channel: any, niche: string, index: number): CreatorOffering[] {
  const description = channel.description.toLowerCase();
  const subs = channel.subscriberCount;
  
  // Detect format from description
  let format: CreatorOffering["format"] = "course";
  let price = 97;
  
  if (description.includes("membership") || description.includes("patreon") || description.includes("join")) {
    format = "membership";
    price = subs > 100000 ? 19 : 9;
  } else if (description.includes("cohort") || description.includes("bootcamp") || description.includes("live training")) {
    format = "cohort";
    price = subs > 100000 ? 1500 : 500;
  } else if (description.includes("ebook") || description.includes("book") || description.includes("guide")) {
    format = "ebook";
    price = 29;
  } else if (description.includes("template") || description.includes("notion") || description.includes("spreadsheet")) {
    format = "template";
    price = 39;
  } else if (description.includes("coaching") || description.includes("1-on-1") || description.includes("consulting")) {
    format = "coaching";
    price = subs > 100000 ? 1000 : 300;
  } else if (description.includes("course") || description.includes("learn") || description.includes("training")) {
    format = "course";
    price = subs > 100000 ? 297 : 97;
  }

  const offerings: CreatorOffering[] = [
    {
      creator: channel.channelName,
      offering: `${niche} ${format === "membership" ? "Community" : format === "cohort" ? "Bootcamp" : "Course"}`,
      format,
      price,
      currency: "$",
      promise: `Learn ${niche} from ${channel.channelName}`,
      source: "YouTube Channel",
    }
  ];

  // Add a second offering if channel is big enough
  if (subs > 50000) {
    const secondFormat = format === "course" ? "membership" : "course";
    offerings.push({
      creator: channel.channelName,
      offering: `${niche} ${secondFormat === "membership" ? "Community" : "Masterclass"}`,
      format: secondFormat,
      price: secondFormat === "membership" ? 15 : 197,
      currency: "$",
      promise: `Advanced ${niche} training`,
      source: "YouTube Channel",
    });
  }

  return offerings;
}

function generateGenericOfferings(niche: string): CreatorOffering[] {
  const formats: Array<"ebook" | "course" | "cohort" | "membership" | "template" | "coaching"> = 
    ["ebook", "course", "cohort", "membership", "template", "coaching"];
  
  return [
    { creator: "Creator A", offering: `${niche} Fundamentals`, format: "course", price: 99, currency: "$", promise: `Learn ${niche} from scratch`, source: "Landing Page" },
    { creator: "Creator B", offering: `${niche} Mastery`, format: "ebook", price: 29, currency: "$", promise: `Complete ${niche} guide`, source: "Gumroad" },
    { creator: "Creator C", offering: `${niche} Bootcamp`, format: "cohort", price: 1500, currency: "$", promise: `Master ${niche} in 12 weeks`, source: "Landing Page" },
    { creator: "Creator D", offering: `${niche} Templates`, format: "template", price: 49, currency: "$", promise: `Ready-to-use ${niche} templates`, source: "Gumroad" },
    { creator: "Creator E", offering: `${niche} Community`, format: "membership", price: 19, currency: "$", promise: `Learn ${niche} with peers`, source: "Circle" },
    { creator: "Creator F", offering: `${niche} Coaching`, format: "coaching", price: 500, currency: "$", promise: `1-on-1 ${niche} mentorship`, source: "Website" },
  ];
}

function analyzePatterns(offerings: CreatorOffering[]): Pattern[] {
  const formatGroups = offerings.reduce((acc, offer) => {
    if (!acc[offer.format]) {
      acc[offer.format] = [];
    }
    acc[offer.format].push(offer);
    return acc;
  }, {} as Record<string, CreatorOffering[]>);

  return Object.entries(formatGroups).map(([format, offers]) => {
    const prices = offers.map(o => o.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    const promises = offers.map(o => o.promise);
    const commonPromises = promises.slice(0, 3);

    return {
      format,
      count: offers.length,
      priceRange: `$${minPrice}-$${maxPrice}`,
      commonPromises,
    };
  }).sort((a, b) => b.count - a.count);
}

function countFormats(offerings: CreatorOffering[]): Record<string, number> {
  return offerings.reduce((acc, offer) => {
    acc[offer.format] = (acc[offer.format] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

async function generateCreatorInsights(
  niche: string,
  offerings: CreatorOffering[],
  patterns: Pattern[]
) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return generateFallbackCreatorInsights(niche, offerings, patterns);
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const offeringSummary = patterns.map(p => 
      `${p.format}: ${p.count} offerings at ${p.priceRange}`
    ).join("\n");

    const prompt = `Analyze the creator economy in "${niche}":

${offeringSummary}

Provide:
1. 3-4 underexplored opportunities (market gaps, underserved formats, missing offerings)
2. 3-4 differentiation angles (unique positioning strategies)
3. 1 recommended offer type for new creators (be specific and actionable)

Format as JSON:
{
  "opportunities": ["opportunity1", "opportunity2", "opportunity3"],
  "differentiationAngles": ["angle1", "angle2", "angle3"],
  "recommendedOffer": "specific recommendation with reasoning"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        opportunities: parsed.opportunities || [],
        differentiationAngles: parsed.differentiationAngles || [],
        recommendedOffer: parsed.recommendedOffer || `Start with a cohort-based offering in ${niche}`,
      };
    }

    return generateFallbackCreatorInsights(niche, offerings, patterns);
  } catch (error) {
    console.error("Error generating creator insights:", error);
    return generateFallbackCreatorInsights(niche, offerings, patterns);
  }
}

function generateFallbackCreatorInsights(
  niche: string,
  offerings: CreatorOffering[],
  patterns: Pattern[]
) {
  const formatCounts = countFormats(offerings);
  const cohortCount = formatCounts["cohort"] || 0;
  const membershipCount = formatCounts["membership"] || 0;
  const templateCount = formatCounts["template"] || 0;
  const coachingCount = formatCounts["coaching"] || 0;

  const opportunities = [
    cohortCount < 3 ? `Live cohort offerings are rare in ${niche} - premium opportunity` : `Niche-down within ${niche} for specialized cohorts`,
    membershipCount < 3 ? `Monthly memberships are underutilized - recurring revenue opportunity` : `Create a hybrid membership + course offering`,
    templateCount < 2 ? `Ready-to-use templates are missing - quick value add` : `Bundle templates with implementation guides`,
    coachingCount < 2 ? `1-on-1 coaching is underserved - high-ticket opportunity` : `Offer group coaching at lower price point`,
  ];

  const differentiationAngles = [
    `Focus on a specific sub-niche within ${niche} (e.g., for beginners, for freelancers, for agencies)`,
    `Combine multiple formats (course + community, templates + coaching, ebook + implementation calls)`,
    `Add unique delivery method (async video + live Q&A, cohort-based with accountability partners)`,
    `Target underserved audience segment (time-constrained professionals, budget-conscious students)`,
  ];

  const mostCommonFormat = patterns[0]?.format || "course";
  const leastCommonFormat = patterns[patterns.length - 1]?.format || "cohort";

  const recommendedOffer = cohortCount < 3
    ? `Your audience is ideal for a cohort-based offering. Most creators sell ${mostCommonFormat}s, but live cohorts command 3-5x premium pricing and build stronger community.`
    : `Consider a ${leastCommonFormat} format - it's underserved in ${niche}. Combine it with the popular ${mostCommonFormat} format for a hybrid offering.`;

  return {
    opportunities,
    differentiationAngles,
    recommendedOffer,
  };
}
