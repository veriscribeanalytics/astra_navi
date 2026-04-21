import { NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
import { DailyHoroscopeSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * Daily Horoscope API Route (Proxy Mode)
 * 
 * Proxies requests to FastAPI backend.
 * Caching logic now lives in the backend (PostgreSQL + Redis).
 */
export async function GET(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session) return unauthorizedResponse();
        const email = session.user?.email;

        const { searchParams } = new URL(req.url);
        const signParam = searchParams.get('sign');
        
        const validation = DailyHoroscopeSchema.safeParse({ sign: signParam || undefined });
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const sign = validation.data.sign;
        
        // Backend handles sign extraction from profile if not provided
        let url = `/api/daily-horoscope?lang=English`;
        if (sign) {
            url += `&sign=${encodeURIComponent(sign)}`;
        }

        const response = await backendFetch(url, {
            userEmail: email as string
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || "Failed to retrieve daily horoscope." }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Daily horoscope error:", error);
        return NextResponse.json({ 
            error: "Failed to retrieve daily horoscope." 
        }, { status: 500 });
    }
}
