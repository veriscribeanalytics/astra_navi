import { NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Health Forecast API Route (Proxy Mode)
 * 
 * Proxies requests to FastAPI backend for personalized health transits.
 */
export async function GET(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session) return unauthorizedResponse();
        const email = session.user?.email;
        const accessToken = (session.user as any).accessToken;

        const { searchParams } = new URL(req.url);
        const daysBack = searchParams.get('days_back') || '3';
        const daysForward = searchParams.get('days_forward') || '3';

        const url = `/api/forecast/health?days_back=${daysBack}&days_forward=${daysForward}`;
        
        const response = await backendFetch(url, {
            userEmail: email as string,
            accessToken: accessToken as string
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || data.detail || "Health forecast failed." }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Health forecast error:", error);
        return NextResponse.json({ error: "Failed to retrieve health patterns." }, { status: 500 });
    }
}
