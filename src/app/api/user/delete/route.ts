import { NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * User Deletion API Route (Proxy Mode)
 * 
 * Proxies deletion requests to the FastAPI backend.
 * Ownership is verified via session.
 */
export async function DELETE(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session) return unauthorizedResponse();
        const email = session.user?.email;

        const response = await backendFetch('/api/user', {
            method: 'DELETE',
            userEmail: email as string
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return NextResponse.json({ error: data.error || data.detail || "Failed to delete account." }, { status: response.status });
        }

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error("Account deletion error:", error);
        return NextResponse.json({ error: "The stars are currently obscured. Account deletion failed." }, { status: 500 });
    }
}
