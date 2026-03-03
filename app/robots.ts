import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://creaclip.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/videos/', '/clips/', '/upload/', '/settings/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
