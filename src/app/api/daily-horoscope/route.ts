import { NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
import { DailyHoroscopeSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * Daily Horoscope API Route (Proxy Mode)
 * 
 * Proxies requests to FastAPI backend.
 * Caching logic now lives in the backend (PostgreSQL + Redis).
 * Auto-detects moon sign from user profile if not provided in query.
 */
export async function GET(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session) return unauthorizedResponse();
        const email = session.user?.email;
        const accessToken = (session.user as any).accessToken;

        const { searchParams } = new URL(req.url);
        let sign = searchParams.get('sign');
        
        // 1. If no sign provided, fetch it from user profile
        if (!sign) {
            const profileRes = await backendFetch('/api/user/profile', {
                userEmail: email as string,
                accessToken: accessToken as string
            });
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                sign = profileData.user?.moonSign;
            }
        }

        const validation = DailyHoroscopeSchema.safeParse({ sign: sign || undefined });
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const validatedSign = validation.data.sign;
        
        // 2. Call backend with specific sign
        let url = `/api/daily-horoscope?lang=English`;
        if (validatedSign) {
            url += `&sign=${encodeURIComponent(validatedSign)}`;
        }

        const response = await backendFetch(url, {
            userEmail: email as string,
            accessToken: accessToken as string
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || data.detail || "Failed to retrieve daily horoscope." }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Daily horoscope error:", error);
        return NextResponse.json({ 
            error: "Failed to retrieve daily horoscope." 
        }, { status: 500 });
    }
}
