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
    '/tools/comment-insights',
    '/tools/creator-niche-scan',
    '/tools/niche-authority',
    '/tools/niche-explorer',
    '/tools/pricing-calculator',
    '/tools/revenue-calculator',
    '/tools/revenue-projection',
    '/tools/sponsorship-vs-course',
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
