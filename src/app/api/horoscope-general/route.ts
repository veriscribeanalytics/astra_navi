import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Helper to get today's date in consistent format (UTC)
function getTodayDateString(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        let sign = searchParams.get('sign');

        if (!sign) {
            return NextResponse.json({ error: "Sign is required." }, { status: 400 });
        }

        // Normalize sign name (Capitalize first letter)
        sign = sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();

        const client = await clientPromise;
        const db = client.db("astra-navi-database");
        const collections = {
            general: db.collection("general_horoscopes_by_sign")
        };

        const today = getTodayDateString();

        // 1. Check Cache
        const cached = await collections.general.findOne({ sign, date: today });
        if (cached) {
            console.log(`[GeneralHoroscope] Cache HIT for ${sign} on ${today}`);
            return NextResponse.json(cached);
        }

        // 2. Fetch from External API
        // User says: curl https://api.veriscribeanalytics.com/api/horoscope/[RASHI]
        if (!process.env.AI_BACKEND_URL) {
            return NextResponse.json({ error: "Backend URL not configured" }, { status: 503 });
        }

        console.log(`[GeneralHoroscope] Cache MISS for ${sign}. Fetching from external...`);
        
        try {
            // Trying the /api/horoscope/[sign] pattern as per user suggestion
            const externalUrl = `${process.env.AI_BACKEND_URL}/api/horoscope/${sign}`;
            const response = await fetch(externalUrl, {
                method: 'GET',
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                // FALLBACK: If individual rashi endpoint fails, fetch the bulk one and filter
                console.log(`[GeneralHoroscope] Individual rashi fetch failed (${response.status}). Trying bulk fallback...`);
                const bulkResponse = await fetch(`${process.env.AI_BACKEND_URL}/api/horoscope`);
                if (!bulkResponse.ok) throw new Error("Bulk fetch failed");
                const bulkData = await bulkResponse.json();
                
                if (bulkData.signs && bulkData.signs[sign]) {
                    const rashiData = bulkData.signs[sign];
                    // Save and return
                    const finalData = { ...rashiData, date: today, createdAt: new Date() };
                    await collections.general.insertOne(finalData);
                    return NextResponse.json(finalData);
                }
                throw new Error("Sign data not found in bulk response");
            }

            const data = await response.json();
            const finalData = { ...data, date: today, createdAt: new Date() };
            
            // 3. Cache and Return
            await collections.general.insertOne(finalData);
            return NextResponse.json(finalData);

        } catch (fetchError) {
            console.error("[GeneralHoroscope] Fetch failed:", fetchError);
            return NextResponse.json({ error: "External service error" }, { status: 503 });
        }

    } catch (error) {
        console.error("General horoscope API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
