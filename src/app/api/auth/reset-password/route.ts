import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendClient';
import { ResetPasswordSchema } from '@/lib/schemas';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate the field contract (token + `password`) before proxying so a
        // wrong field name / weak password fails loudly here instead of silently
        // no-op'ing against the backend.
        const validation = ResetPasswordSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                field: 'password',
                error: validation.error.issues[0].message,
            }, { status: 400 });
        }

        const response = await backendFetch('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(validation.data)
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ 
            code: "server_down",
            error: "Server is down, please contact the developer." 
        }, { status: 500 });
    }
}
