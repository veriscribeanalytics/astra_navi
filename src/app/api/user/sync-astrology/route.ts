import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Sync Astrology Data API Route (Proxy Mode)
 * 
 * Proxies sync requests to the FastAPI backend.
 * Verification via session email.
 * 
 * BACKEND DEV NOTE (IMPORTANT):
 * The backend /api/user/sync-astrology endpoint currently only saves raw astrologyData
 * to the DB. It does NOT extract and persist moonSign/sunSign/lagnaSign from the
 * astrologyData payload. This means signs remain NULL in the DB even after sync.
 * 
 * To fix: Add the same sign extraction logic from /api/analyze-full (server.py lines
 * 1714-1725) to the sync-astrology endpoint:
 *   1. Extract lagna_sign from astrology_data["ascendant"]["sign"]
 *   2. Extract moon_sign from planets array (planet == "Moon")
 *   3. Extract sun_sign from planets array (planet == "Sun")
 *   4. UPDATE users SET moon_sign=$1, sun_sign=$2, lagna_sign=$3 WHERE email=$4
 * 
 * Also: When a user updates birth details (dob/tob/pob) via PUT /api/user/profile,
 * the backend CLEARS all signs to NULL (lines 871-873). After clearing, it should
 * trigger a recalculation rather than leaving signs as NULL.
 * 
 * Frontend workaround: We now call /api/analyze-full after profile save (which does
 * persist signs), and also extract signs from astrologyData as a fallback in the
 * dashboard UI.
 */
export async function POST(req: Request) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;
        const email = user?.email;

        const body = await req.json();

        const response = await backendFetch('/api/user/sync-astrology', {
            method: 'POST',
            userEmail: email as string,
            accessToken: accessToken as string,
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || data.detail || "Sync failed." }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Astrology sync error:", error);
        return NextResponse.json({ error: "The stars are obscured. Sync failed." }, { status: 500 });
    }
}
