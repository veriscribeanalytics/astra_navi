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

        // Pass through backend's profileComplete flag if present
        return NextResponse.json({
            ...data,
            ...(data.profileComplete !== undefined ? { profileComplete: data.profileComplete } : {}),
        });
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
            console.error("[Profile PUT] Zod validation failed:", JSON.stringify(validation.error.issues));
            return NextResponse.json({
                error: validation.error.issues[0].message,
                ...(process.env.NODE_ENV !== "production" ? { issues: validation.error.issues.map(i => ({ path: i.path.join("."), message: i.message })) } : {}),
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
            // Pass through the backend status code (including 409 for DST conflicts)
            // and include all error detail fields
            return NextResponse.json({ 
                error: data.error || data.detail || "Profile update failed.",
                ...(data.dst_conflict ? { dst_conflict: data.dst_conflict } : {}),
                ...(data.message ? { message: data.message } : {}),
            }, { status: response.status });
        }

        return NextResponse.json({ 
            message: "Profile successfully aligned with the stars!",
            user: data.user,
            ...(data.profileComplete !== undefined ? { profileComplete: data.profileComplete } : {}),
            ...(data.requiresReanalysis !== undefined ? { requiresReanalysis: data.requiresReanalysis } : {}),
        });

    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "The stars are obscured. Please try again later." }, { status: 500 });
    }
}
