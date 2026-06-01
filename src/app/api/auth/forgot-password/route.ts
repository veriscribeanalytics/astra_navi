import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendClient';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        const response = await backendFetch('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || data.detail || "Failed to process request" }, { status: response.status });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ 
            code: "server_down",
            error: "Server is down, please contact the developer." 
        }, { status: 500 });
    }
}
