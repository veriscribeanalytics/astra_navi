import { NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * User Analytics Summary Route (Proxy Mode)
 * 
 * Proxies request to FastAPI backend.
 * Data source: PostgreSQL chat_analytics table.
 */
export async function GET(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session) return unauthorizedResponse();
        const email = session.user?.email;

        const response = await backendFetch('/api/analytics/summary', {
            userEmail: email as string
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || data.detail || "Failed to load summary." }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Analytics summary error:", error);
        return NextResponse.json({ error: "Failed to load usage patterns." }, { status: 500 });
    }
}
