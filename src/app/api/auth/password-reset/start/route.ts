import { NextResponse } from 'next/server';
import { checkRateLimit, AUTH_LIMIT_CONFIG } from '@/middleware/rateLimit';
import { PasswordResetStartSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';
import { getClientIp } from '@/lib/request';

/**
 * Start password reset OTP flow.
 * Always returns the same message regardless of whether the email exists.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Validate schema
        const validation = PasswordResetStartSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                code: 'email_invalid',
                error: validation.error.issues[0].message,
            }, { status: 400 });
        }
        const { email } = validation.data;

        // 2. Rate limiting by IP — fails closed on Redis error.
        const ip = getClientIp(req);
        const rateLimitResult = await checkRateLimit(`pw-reset-start:${ip}`, AUTH_LIMIT_CONFIG);

        if (!rateLimitResult.allowed) {
            const resetInMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
            return NextResponse.json({
                code: 'rate_limited',
                error: `Too many attempts. Please try again in ${resetInMinutes} minutes.`,
            }, { status: 429 });
        }

        // 3. Proxy to Backend
        const response = await backendFetch('/api/auth/password-reset/start', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Always return the generic success message — do not expose
            // whether the email is registered or not.
            if (response.status === 429) {
                return NextResponse.json(data, { status: 429 });
            }
            // For any non-200 that isn't rate-limit, still return the
            // generic message so the UI always shows the OTP step.
            return NextResponse.json({
                message: 'If that email is registered, a reset code has been sent.',
                expiresIn: 300,
            });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Password reset start proxy error:', error);
        return NextResponse.json({
            code: 'password_reset_unavailable',
            error: 'Service is currently unavailable. Please try again later.',
        }, { status: 500 });
    }
}
