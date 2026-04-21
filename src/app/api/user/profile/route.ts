import { NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
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
        const session = await getAuthSession();
        if (!session) return unauthorizedResponse();
        const email = session.user?.email;

        const response = await backendFetch('/api/user/profile', {
            userEmail: email as string
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || data.detail || "Failed to fetch profile." }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session) return unauthorizedResponse();

        const body = await req.json();
        const validation = ProfileUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: validation.error.issues[0].message
            }, { status: 400 });
        }
        const email = session.user?.email;

        const response = await backendFetch('/api/user/profile', {
            method: 'PUT',
            userEmail: email as string,
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
