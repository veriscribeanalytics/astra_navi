import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { DailyHoroscopeSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';
import { languageCodeToName } from '@/locales';

/**
 * Daily Horoscope API Route (Proxy Mode)
 * 
 * Proxies requests to FastAPI backend.
 * Caching logic now lives in the backend (PostgreSQL + Redis).
 * Auto-detects moon sign and language from user profile if not provided in query.
 */
export async function GET(req: Request) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;
        const email = user?.email;

        const { searchParams } = new URL(req.url);
        let sign = searchParams.get('sign');
        // Client-provided language takes priority; fall back to profile language
        let lang: string | null = searchParams.get('lang') || null;
        
        // 1. Fetch user profile for moon sign and language (fallback)
        const profileRes = await backendFetch('/api/user/profile', {
            userEmail: email as string,
            accessToken: accessToken as string
        });
        if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (!sign) sign = profileData.user?.moonSign;
            // Only use profile language if client didn't provide one
            if (!lang) lang = profileData.user?.language || null;
        }

        const validation = DailyHoroscopeSchema.safeParse({ sign: sign || undefined });
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const validatedSign = validation.data.sign;
        
        // 2. Call backend with specific sign and user's language preference
        const fullLangName = languageCodeToName(lang);

        const params: string[] = [];
        params.push('lang=' + encodeURIComponent(fullLangName));
        if (validatedSign) params.push('sign=' + encodeURIComponent(validatedSign));
        const url = '/api/daily-horoscope?' + params.join('&');

        const response = await backendFetch(url, {
            userEmail: email as string,
            accessToken: accessToken as string
        });

        const data = await response.json();

        if (!response.ok) {
            // Pass through special error flags for profile-location requirement
            return NextResponse.json({ 
                error: data.error || data.detail || "Failed to retrieve daily horoscope.",
                ...(data.calculation_unavailable ? { calculation_unavailable: true } : {}),
                ...(data.profile_location_required ? { profile_location_required: true } : {}),
                ...(data.message ? { message: data.message } : {}),
            }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Daily horoscope error:", error);
        return NextResponse.json({ 
            error: "Failed to retrieve daily horoscope." 
        }, { status: 500 });
    }
}
