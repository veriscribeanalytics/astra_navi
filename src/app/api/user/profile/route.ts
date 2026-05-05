import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { ProfileUpdateSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * User Profile API Route (Proxy Mode)
 * 
 * Proxies profile requests to the FastAPI backend.
 * Ownership is verified by passing session email as X-User-Email.
 */

export async function GET(req: Request) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;
        const email = user?.email;

        console.log(`[Profile API] Fetching profile for: ${email}, hasAccessToken: ${!!accessToken}, tokenLength: ${accessToken?.length || 0}`);

        const response = await backendFetch('/api/user/profile', {
            userEmail: email as string,
            accessToken: accessToken as string
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            console.error(`[Profile API] Backend returned ${response.status}:`, errorData);
            return NextResponse.json({ error: errorData.error || errorData.detail || "Failed to fetch profile." }, { status: response.status });
        }

        const data = await response.json();

        // Diagnostic: log sign fields from backend response
        console.log(`[Profile API] Backend response sign fields:`, {
            moonSign: data?.user?.moonSign ?? data?.moonSign ?? 'MISSING',
            sunSign: data?.user?.sunSign ?? data?.sunSign ?? 'MISSING',
            lagnaSign: data?.user?.lagnaSign ?? data?.lagnaSign ?? 'MISSING',
            hasAstrologyData: !!(data?.user?.astrologyData ?? data?.astrologyData),
            topLevelKeys: Object.keys(data || {}),
            userKeys: data?.user ? Object.keys(data.user) : 'no user key',
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;
        const email = user?.email;

        const body = await req.json();
        const validation = ProfileUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: validation.error.issues[0].message
            }, { status: 400 });
        }

        const response = await backendFetch('/api/user/profile', {
            method: 'PUT',
            userEmail: email as string,
            accessToken: accessToken as string,
            body: JSON.stringify(validation.data)
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || data.detail || "Profile update failed." }, { status: response.status });
        }

        return NextResponse.json({ 
            message: "Profile successfully aligned with the stars!",
            user: data.user
        });

    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "The stars are obscured. Please try again later." }, { status: 500 });
    }
}
