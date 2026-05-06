import { NextResponse } from 'next/server';
import { checkRateLimit, AUTH_LIMIT_CONFIG } from '@/middleware/rateLimit';
import { RegisterSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * Registration API Route (Proxy Mode)
 * 
 * Proxies registration requests to the FastAPI backend which 
 * handles PostgreSQL storage and password hashing.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // 1. Validate input with Zod (Frontend first line of defense)
        const validation = RegisterSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: validation.error.issues[0].message
            }, { status: 400 });
        }
        const { email, password } = validation.data;

        // 2. Rate limiting (Upstash Redis)
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const rateLimitResult = await checkRateLimit(`register:${ip}`, AUTH_LIMIT_CONFIG);

        if (!rateLimitResult.allowed) {
            const resetInMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
            return NextResponse.json({ 
                error: `Too many registration attempts. Please try again in ${resetInMinutes} minutes.` 
            }, { status: 429 });
        }

        // 3. Proxy to AI Backend (PostgreSQL)
        const response = await backendFetch('/api/register', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || data.detail || "Registration failed. Please try again." }, { status: response.status });
        }

        return NextResponse.json({
            message: "Your account has been created.",
            user: data.user
        }, { status: 201 });

    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ error: "Registration failed. Please try again later." }, { status: 500 });
    }
}
