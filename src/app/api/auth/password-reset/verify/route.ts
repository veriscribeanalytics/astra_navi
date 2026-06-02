import { NextResponse } from 'next/server';
import { checkRateLimit, AUTH_LIMIT_CONFIG } from '@/middleware/rateLimit';
import { PasswordResetVerifySchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * Verify OTP for password reset flow.
 * Returns a short-lived resetToken on success.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Validate schema
        const validation = PasswordResetVerifySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                code: 'email_invalid',
                error: validation.error.issues[0].message,
            }, { status: 400 });
        }
        const { email, otp } = validation.data;

        // 2. Rate limiting by IP
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const rateLimitResult = await checkRateLimit(`pw-reset-verify:${ip}`, {
            ...AUTH_LIMIT_CONFIG,
            max: 10, // slightly more lenient since users may retry OTP entries
        });

        if (!rateLimitResult.allowed) {
            const resetInMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
            return NextResponse.json({
                code: 'rate_limited',
                error: `Too many attempts. Please try again in ${resetInMinutes} minutes.`,
            }, { status: 429 });
        }

        // 3. Proxy to Backend
        const response = await backendFetch('/api/auth/password-reset/verify', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Password reset verify proxy error:', error);
        return NextResponse.json({
            code: 'password_reset_unavailable',
            error: 'Service is currently unavailable. Please try again later.',
        }, { status: 500 });
    }
}
