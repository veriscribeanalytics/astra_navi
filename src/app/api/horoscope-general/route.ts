import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/session';
import { DailyHoroscopeSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * General Horoscope API Route (Proxy Mode)
 * 
 * Proxies requests to FastAPI backend's rule-based horoscope.
 * Auto-detects moon sign from user profile if not provided in query and user is logged in.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        let sign = searchParams.get('sign');

        // 1. If no sign provided, try to get it from session
        if (!sign) {
            const session = await getAuthSession();
            if (session?.user?.email) {
                const profileRes = await backendFetch('/api/user/profile', {
                    userEmail: session.user.email
                });
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    sign = profileData.user?.moonSign;
                }
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

        // 2. Proxy to backend rule-based horoscope
        const response = await backendFetch(`/api/horoscope/${validatedSign}`);

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || "External service error" }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("General horoscope API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
