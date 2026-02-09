import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://course-sphere-xi.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/login',
          '/signup',
          '/course',
          '/tools',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/courses/',
          '/profile/',
          '/organization/',
          '/(private)/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
