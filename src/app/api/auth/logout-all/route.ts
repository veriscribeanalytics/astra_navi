import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendClient';
import { auth } from '@/lib/auth';

export async function POST(_req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const response = await backendFetch('/api/auth/logout-all', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.user.accessToken}`
            }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json({ error: data.error || data.detail || "Failed to logout devices" }, { status: response.status });
        }

        return NextResponse.json({ message: "Successfully logged out all other devices" }, { status: 200 });

    } catch (error) {
        console.error("Logout all error:", error);
        return NextResponse.json({ error: "Failed to process request. Please try again later." }, { status: 500 });
    }
}
