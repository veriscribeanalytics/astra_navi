import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendClient';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        const response = await backendFetch('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Failed to reset password. Please try again later." }, { status: 500 });
    }
}
