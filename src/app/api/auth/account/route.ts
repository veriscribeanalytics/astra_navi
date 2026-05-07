import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendClient';
import { auth } from '@/lib/auth';

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        
        const response = await backendFetch('/api/auth/account', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${session.user.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body) // { password: '...' }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json({ error: data.error || data.detail || "Failed to delete account" }, { status: response.status });
        }

        return NextResponse.json({ message: "Account successfully deleted" }, { status: 200 });

    } catch (error) {
        console.error("Delete account error:", error);
        return NextResponse.json({ error: "Failed to process request. Please try again later." }, { status: 500 });
    }
}
