import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://course-sphere-xi.vercel.app'

  // Static routes
  const routes = [
    '',
    '/login',
    '/signup',
    '/course',
    '/tools',
    '/tools/audience-analyzer',
    '/tools/audience-readiness',
    '/tools/audience-trust',
    '/tools/bio-link-audit',
    '/tools/cohort-checklist',
    '/tools/cohort-recommendation',
    '/tools/cohort-size-planner',
    '/tools/comment-insights',
    '/tools/creator-niche-scan',
    '/tools/curriculum-generator',
    '/tools/description-optimizer',
    '/tools/income-stability',
    '/tools/launch-planner',
    '/tools/migration-estimator',
    '/tools/niche-authority',
    '/tools/niche-explorer',
    '/tools/platform-fit-finder',
    '/tools/pricing-calculator',
    '/tools/pricing-optimizer',
    '/tools/revenue-calculator',
    '/tools/revenue-projection',
    '/tools/sponsorship-vs-course',
    '/tools/tool-stack-analyzer',
    '/tools/video-to-course',
    '/tools/workshop-roi',
    '/tools/youtube-course-idea',
    '/tools/youtube-monetization',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes
}
