import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Generic Forecast API Route (Proxy Mode)
 * 
 * Proxies requests to FastAPI backend for personalized area-based forecasts.
 * Supports: health, career, love, finance, overall
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ area: string }> }
) {
    try {
        const session = await getAuthSession();
        if (!session) return unauthorizedResponse();
        const email = session.user?.email;

        const { area } = await params;
        const validAreas = ['health', 'career', 'love', 'finance', 'overall', 'general'];
        if (!validAreas.includes(area)) {
            return NextResponse.json({ error: `Invalid forecast area: ${area}` }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const daysBack = searchParams.get('days_back') || '3';
        const daysForward = searchParams.get('days_forward') || '3';

        const url = `/api/forecast/${area}?days_back=${daysBack}&days_forward=${daysForward}`;

        const response = await backendFetch(url, {
            userEmail: email as string
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || `${area} forecast failed.` },
                { status: response.status }
            );
        }

        return NextResponse.json(data);

    } catch (error) {
        const { area } = await params;
        console.error(`${area} forecast error:`, error);
        return NextResponse.json(
            { error: `Failed to retrieve ${area} forecast.` },
            { status: 500 }
        );
    }
}
