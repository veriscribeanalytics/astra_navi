import { NextResponse } from 'next/server';
import { checkRateLimit, AUTH_LIMIT_CONFIG } from '@/middleware/rateLimit';
import { RegisterSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';
import { normalizeProfileUser, resolveProfileComplete } from '@/lib/profileCompleteness';

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
        const payload = validation.data;

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
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        let user = normalizeProfileUser({
            ...payload,
            ...(data.user || {}),
            email: data.user?.email || payload.email,
        });
        let profileComplete = resolveProfileComplete(data.profileComplete, user);

        // Some backend register handlers only create credentials and return
        // tokens. When the signup form already collected birth/profile fields,
        // persist them immediately with the fresh access token so the dashboard
        // does not bounce the user back to onboarding.
        if (data.accessToken && user.email) {
            const profileSyncPayload = Object.fromEntries(Object.entries({
                name: payload.name,
                dob: payload.dob,
                tob: payload.tob,
                pob: payload.pob || payload.birthPlaceName,
                birthPlaceName: payload.birthPlaceName || payload.pob,
                birthLatitude: payload.birthLatitude,
                birthLongitude: payload.birthLongitude,
                birthTimezoneName: payload.birthTimezoneName,
                phoneNumber: payload.phoneNumber,
                gender: payload.gender,
                maritalStatus: payload.maritalStatus,
                occupation: payload.occupation,
                language: payload.language,
                preferences: {
                    horoscope: payload.preferences?.horoscope_enabled ?? true,
                    notifications: payload.preferences?.notifications_enabled ?? false,
                },
            }).filter(([, value]) => value !== undefined && value !== ''));

            if (Object.keys(profileSyncPayload).length > 0) {
                try {
                    const profileResponse = await backendFetch('/api/user/profile', {
                        method: 'PUT',
                        userEmail: user.email,
                        accessToken: data.accessToken,
                        body: JSON.stringify(profileSyncPayload),
                    });
                    const profileData = await profileResponse.json().catch(() => ({}));

                    if (profileResponse.ok) {
                        user = normalizeProfileUser({
                            ...user,
                            ...(profileData.user || {}),
                        });
                        profileComplete = resolveProfileComplete(profileData.profileComplete ?? data.profileComplete, user);
                    } else {
                        console.warn('[Register] Profile sync after registration failed:', profileResponse.status, profileData);
                    }
                } catch (syncError) {
                    console.warn('[Register] Profile sync after registration failed:', syncError);
                }
            }
        }

        return NextResponse.json({
            message: "Your account has been created.",
            user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresIn: data.expiresIn,
            profileComplete
        }, { status: 201 });

    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ 
            code: "server_down",
            error: "Server is down, please contact the developer." 
        }, { status: 500 });
    }
}
