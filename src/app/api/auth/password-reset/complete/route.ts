import { NextResponse } from 'next/server';
import { checkRateLimit, AUTH_LIMIT_CONFIG } from '@/middleware/rateLimit';
import { PasswordResetCompleteSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';
import { getClientIp } from '@/lib/request';

/**
 * Complete password reset — submit new password with resetToken.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Validate schema
        const validation = PasswordResetCompleteSchema.safeParse(body);
        if (!validation.success) {
            const issue = validation.error.issues[0];
            const isPasswordIssue = issue.path.includes('password');
            return NextResponse.json({
                code: isPasswordIssue ? 'password_weak' : 'reset_token_invalid',
                field: isPasswordIssue ? 'password' : 'token',
                error: issue.message,
            }, { status: 400 });
        }
        const { resetToken, password } = validation.data;

        // 2. Rate limiting by IP — fails closed on Redis error.
        const ip = getClientIp(req);
        const rateLimitResult = await checkRateLimit(`pw-reset-complete:${ip}`, AUTH_LIMIT_CONFIG);

        if (!rateLimitResult.allowed) {
            const resetInMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
            return NextResponse.json({
                code: 'rate_limited',
                error: `Too many attempts. Please try again in ${resetInMinutes} minutes.`,
            }, { status: 429 });
        }

        // 3. Proxy to Backend
        const response = await backendFetch('/api/auth/password-reset/complete', {
            method: 'POST',
            body: JSON.stringify({ resetToken, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Password reset complete proxy error:', error);
        return NextResponse.json({
            code: 'password_reset_unavailable',
            error: 'Service is currently unavailable. Please try again later.',
        }, { status: 500 });
    }
}
