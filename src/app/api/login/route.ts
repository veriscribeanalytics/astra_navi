import { NextResponse } from 'next/server';
import { checkRateLimit, AUTH_LIMIT_CONFIG } from '@/middleware/rateLimit';
import { LoginSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * Login API Route (Proxy Mode)
 * 
 * Proxies login requests to the FastAPI backend.
 * Uses PostgreSQL for user verification.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // 1. Validate input
        const validation = LoginSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: validation.error.issues[0].message
            }, { status: 400 });
        }
        const { email, password } = validation.data;

        // 2. Rate limiting (Upstash Redis)
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const rateLimitResult = await checkRateLimit(`login:${ip}`, AUTH_LIMIT_CONFIG);

        if (!rateLimitResult.allowed) {
            const resetInMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
            return NextResponse.json({ 
                error: `Too many login attempts. Please try again in ${resetInMinutes} minutes.` 
            }, { status: 429 });
        }

        // 3. Proxy to AI Backend (PostgreSQL)
        const response = await backendFetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ 
                error: data.error || "Invalid credentials." 
            }, { status: response.status });
        }

        return NextResponse.json({
            message: "Welcome back.",
            user: data.user
        });

    } catch (error) {
        console.error("Login proxy error:", error);
        return NextResponse.json({ 
            error: "An error occurred. Please try again later." 
        }, { status: 500 });
    }
}
