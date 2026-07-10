import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://astranavi.com';

  const staticLastMod = '2025-07-01';
  const blogLastMod = '2025-06-15';

  return [
    { url: baseUrl, lastModified: staticLastMod, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/kundli`, lastModified: staticLastMod, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/plans`, lastModified: staticLastMod, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: staticLastMod, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/services`, lastModified: staticLastMod, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/lifeareas`, lastModified: staticLastMod, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/astrologers`, lastModified: staticLastMod, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/community`, lastModified: staticLastMod, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/consult`, lastModified: staticLastMod, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/rashis`, lastModified: staticLastMod, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/support`, lastModified: staticLastMod, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: staticLastMod, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/privacy`, lastModified: staticLastMod, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/blogs`, lastModified: blogLastMod, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/blogs/houses`, lastModified: blogLastMod, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/blogs/planets`, lastModified: blogLastMod, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/blogs/nakshatras`, lastModified: blogLastMod, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/blogs/yogas`, lastModified: blogLastMod, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/blogs/remedies`, lastModified: blogLastMod, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
