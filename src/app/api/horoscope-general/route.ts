import { NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
import { DailyHoroscopeSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * General Horoscope API Route (Proxy Mode)
 * 
 * Proxies requests to FastAPI backend's rule-based horoscope.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const signParam = searchParams.get('sign');

        const validation = DailyHoroscopeSchema.safeParse({ sign: signParam || undefined });
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const sign = validation.data.sign;
        if (!sign) {
            return NextResponse.json({ error: "Sign is required" }, { status: 400 });
        }

        // Proxy to backend rule-based horoscope
        const response = await backendFetch(`/api/horoscope/${sign}`);

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
