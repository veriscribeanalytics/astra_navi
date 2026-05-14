import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';
import { languageCodeToName } from '@/locales';

/**
 * Tomorrow Horoscope API Route (Proxy Mode)
 *
 * GET /api/tomorrow-horoscope
 * Proxies requests to FastAPI backend's /api/tomorrow-horoscope.
 * Auto-detects moon sign and language from user profile.
 * May return 402 with paywall data for free users.
 */
export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    const { searchParams } = new URL(req.url);
    let sign = searchParams.get('sign');
    let lang: string | null = searchParams.get('lang') || null;

    // Fetch user profile for moon sign and language fallback
    const profileRes = await backendFetch('/api/user/profile', {
      userEmail: email as string,
      accessToken: accessToken as string,
    });
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      if (!sign) sign = profileData.user?.moonSign;
      if (!lang) lang = profileData.user?.language || null;
    }

    const fullLangName = languageCodeToName(lang);

    const params: string[] = [];
    params.push('lang=' + encodeURIComponent(fullLangName));
    if (sign) params.push('sign=' + encodeURIComponent(sign));
    const url = '/api/tomorrow-horoscope?' + params.join('&');

    const response = await backendFetch(url, {
      userEmail: email as string,
      accessToken: accessToken as string,
    });

    const data = await response.json();

    if (!response.ok) {
      // Pass through 402 paywall responses as-is
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Tomorrow horoscope proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve tomorrow horoscope.' },
      { status: 500 }
    );
  }
}