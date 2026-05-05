import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://astranavi.com';
  const lastModified = new Date();

  return [
    { url: baseUrl, lastModified, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/login`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/kundli`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/plans`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/support`, lastModified, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/rashis`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/blogs`, lastModified, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/consult`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
