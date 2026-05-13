import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/session';
import { DailyHoroscopeSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';
import { languageCodeToName } from '@/locales';

/**
 * General Horoscope API Route (Proxy Mode)
 * 
 * Proxies requests to FastAPI backend's rule-based horoscope.
 * Auto-detects moon sign and language from user profile if not provided in query and user is logged in.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        let sign = searchParams.get('sign');
        // Client-provided language takes priority; fall back to profile language
        let lang: string | null = searchParams.get('lang') || null;

        // 1. If no sign provided, try to get it from session
        const authContext = await getAuthContext(req);
        if (authContext) {
            const { user, accessToken } = authContext;
            const email = user.email;
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
        }

        const validation = DailyHoroscopeSchema.safeParse({ sign: sign || undefined });
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const validatedSign = validation.data.sign;
        if (!validatedSign) {
            return NextResponse.json({ error: "Please provide a zodiac sign or update your profile." }, { status: 400 });
        }

        // 2. Proxy to backend rule-based horoscope with user's language
        const fullLangName = languageCodeToName(lang);

        let url = '/api/horoscope/' + encodeURIComponent(validatedSign);
        url += '?lang=' + encodeURIComponent(fullLangName);

        console.log('[horoscope-general] Proxying to backend:', `${process.env.AI_BACKEND_URL}${url}`);
        console.log('[horoscope-general] Auth context present:', !!authContext);

        const response = await backendFetch(url, authContext ? {
            userEmail: authContext.user.email as string,
            accessToken: authContext.accessToken as string
        } : undefined);

        console.log('[horoscope-general] Backend response status:', response.status, 'ok:', response.ok);

        const data = await response.json();

        if (!response.ok) {
            // CRITICAL: never pass a 401 through to the client — clientFetch interprets
            // 401 as "session expired" which triggers signOut + redirect.  We also
            // never pass a 403 because it can lead to misleading logout flows.
            // Remap auth errors to 502 with a clear message.
            const status = response.status;
            if (status === 401 || status === 403) {
                console.error(`[horoscope-general] Backend returned ${status} for horoscope.  Returning 502 to avoid triggering client-side signOut.`);
                return NextResponse.json(
                    { error: "Horoscope service is temporarily unavailable." },
                    { status: 502 }
                );
            }
            return NextResponse.json({ error: data.error || data.detail || "External service error" }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("General horoscope API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
