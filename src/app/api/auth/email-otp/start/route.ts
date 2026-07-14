import { NextResponse } from 'next/server';
import { checkRateLimit, AUTH_LIMIT_CONFIG } from '@/middleware/rateLimit';
import { EmailOtpStartSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';
import { getClientIp } from '@/lib/request';

/**
 * Start Email OTP login/signup process
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // 1. Validate schema
        const validation = EmailOtpStartSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: validation.error.issues[0].message
            }, { status: 400 });
        }
        const { email } = validation.data;

        // 2. Rate limiting by IP — fails closed on Redis error.
        const ip = getClientIp(req);
        const rateLimitResult = await checkRateLimit(`email-otp-start:${ip}`, AUTH_LIMIT_CONFIG);

        if (!rateLimitResult.allowed) {
            const resetInMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
            return NextResponse.json({ 
                error: `Too many attempts. Please try again in ${resetInMinutes} minutes.` 
            }, { status: 429 });
        }

        // 3. Proxy to Backend
        const response = await backendFetch('/api/auth/email-otp/start', {
            method: 'POST',
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Email OTP start proxy error:", error);
        return NextResponse.json({ 
            code: "server_down",
            error: "Server is currently unavailable, please try again later." 
        }, { status: 500 });
    }
}
