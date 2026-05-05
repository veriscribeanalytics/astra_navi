import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Sync Astrology Data API Route (Proxy Mode)
 * 
 * Proxies sync requests to the FastAPI backend.
 * Verification via session email.
 */
export async function POST(req: Request) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;
        const email = user?.email;

        const body = await req.json();

        const response = await backendFetch('/api/user/sync-astrology', {
            method: 'POST',
            userEmail: email as string,
            accessToken: accessToken as string,
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || data.detail || "Sync failed." }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Astrology sync error:", error);
        return NextResponse.json({ error: "The stars are obscured. Sync failed." }, { status: 500 });
    }
}
