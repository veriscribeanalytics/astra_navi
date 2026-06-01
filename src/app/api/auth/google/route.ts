import { NextResponse } from 'next/server';
import { checkRateLimit, AUTH_LIMIT_CONFIG } from '@/middleware/rateLimit';
import { backendFetch } from '@/lib/backendClient';

/**
 * Google Auth API Proxy Route
 * 
 * Proxies Google ID token authentication to the FastAPI backend.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { idToken } = body;
        
        if (!idToken) {
            return NextResponse.json({
                error: "Google ID token is required."
            }, { status: 400 });
        }

        // Rate limiting (Upstash Redis)
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const rateLimitResult = await checkRateLimit(`google_auth:${ip}`, AUTH_LIMIT_CONFIG);

        if (!rateLimitResult.allowed) {
            const resetInMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
            return NextResponse.json({ 
                error: `Too many auth attempts. Please try again in ${resetInMinutes} minutes.` 
            }, { status: 429 });
        }

        // Proxy to FastAPI Backend
        const response = await backendFetch('/api/auth/google', {
            method: 'POST',
            body: JSON.stringify({ idToken })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        // Return all necessary session credentials to the frontend
        return NextResponse.json({
            message: "Google login successful",
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresIn: data.expiresIn,
            profileComplete: data.profileComplete
        });

    } catch (error) {
        console.error("Google login proxy error:", error);
        return NextResponse.json({ 
            code: "server_down",
            error: "Server is down, please contact the developer." 
        }, { status: 500 });
    }
}
