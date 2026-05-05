import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * User Analytics Summary Route (Proxy Mode)
 * 
 * Proxies request to FastAPI backend.
 * Data source: PostgreSQL chat_analytics table.
 */
export async function GET(req: Request) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;
        const email = user?.email;

        const response = await backendFetch('/api/analytics/summary', {
            userEmail: email as string,
            accessToken: accessToken as string
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
