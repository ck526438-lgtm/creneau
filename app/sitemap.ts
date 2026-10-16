import type { MetadataRoute } from 'next';

const base = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/b/demo-cabinet`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${base}/legal/mentions`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/confidentialite`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/cgv`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
