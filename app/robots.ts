import type { MetadataRoute } from 'next';

const base = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/api/', '/r/'] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
