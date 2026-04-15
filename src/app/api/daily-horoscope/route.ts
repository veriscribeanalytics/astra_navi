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
        const email = searchParams.get('email');
        const signParam = searchParams.get('sign');

        if (!email && !signParam) {
            return NextResponse.json({ error: "Email or Sign is required." }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("astra-navi-database");
        const users = db.collection("users");
        const horoscopes = db.collection("daily_horoscopes_by_sign");

        let sign = signParam;

        // If no sign provided, get user's moon sign from email
        if (!sign && email) {
            const user = await users.findOne({ email });
            if (!user) {
                return NextResponse.json({ error: "User not found." }, { status: 404 });
            }
            if (!user.moonSign) {
                return NextResponse.json({ 
                    error: "Moon sign not available. Please complete your profile first." 
                }, { status: 400 });
            }
            sign = user.moonSign;
        }

        if (!sign) {
            return NextResponse.json({ error: "Sign could not be determined." }, { status: 400 });
        }

        // Normalize sign name (Capitalize first letter)
        sign = sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();

        // Get today's date in consistent UTC format
        const today = getTodayDateString();

        // ──────────────────────────────────────────────────────
        // STEP 1: Check if today's horoscope already exists in DB
        // ──────────────────────────────────────────────────────
        const existingHoroscope = await horoscopes.findOne({ 
            sign: sign, 
            date: today 
        });

        if (existingHoroscope) {
            console.log(`[Horoscope] Cache HIT for ${sign} on ${today}`);
            return NextResponse.json({
                sign: existingHoroscope.sign,
                date: existingHoroscope.date,
                overall_score: existingHoroscope.overall_score,
                mood: existingHoroscope.mood,
                lucky_color: existingHoroscope.lucky_color,
                lucky_number: existingHoroscope.lucky_number,
                career: existingHoroscope.career,
                love: existingHoroscope.love,
                health: existingHoroscope.health,
                finance: existingHoroscope.finance,
                tip: existingHoroscope.tip
            });
        }

        // ──────────────────────────────────────────────────────
        // STEP 2: No horoscope for today — fetch from external API
        // ──────────────────────────────────────────────────────
        console.log(`[Horoscope] Cache MISS for ${sign} on ${today}. Fetching from external API...`);

        if (!process.env.AI_BACKEND_URL) {
            console.error("[Horoscope] AI_BACKEND_URL not configured");
            return NextResponse.json({ 
                error: "Horoscope service is not configured. Please try again later." 
            }, { status: 503 });
        }

        let externalData = null;
        try {
            const externalApiUrl = `${process.env.AI_BACKEND_URL}/api/daily-horoscope?sign=${encodeURIComponent(sign)}&lang=English`;
            const response = await fetch(externalApiUrl, { 
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(10000)
            });
            
            if (!response.ok) {
                console.error(`[Horoscope] External API error: ${response.status} ${response.statusText}`);
                return NextResponse.json({ 
                    error: "Horoscope service is temporarily unavailable. Please try again later." 
                }, { status: 503 });
            }

            externalData = await response.json();
            console.log(`[Horoscope] External API returned data for ${sign}`);
        } catch (error) {
            console.error("[Horoscope] External API request failed:", error);
            return NextResponse.json({ 
                error: "Unable to fetch horoscope at this time. Please try again later." 
            }, { status: 503 });
        }

        // ──────────────────────────────────────────────────────
        // STEP 3: Validate and store horoscope data
        // ──────────────────────────────────────────────────────
        if (!externalData || typeof externalData.overall_score === 'undefined') {
            console.error("[Horoscope] Invalid data received from external API");
            return NextResponse.json({ 
                error: "Invalid horoscope data received. Please try again later." 
            }, { status: 503 });
        }

        const horoscopeData = {
            sign: sign,
            date: today,
            overall_score: externalData.overall_score,
            mood: externalData.mood || 'Neutral',
            lucky_color: externalData.lucky_color || 'Gold',
            lucky_number: externalData.lucky_number || 8,
            career: externalData.career || 'Stay focused on your goals.',
            love: externalData.love || 'Harmony flows in your relations.',
            health: externalData.health || 'Take care of your vitality.',
            finance: externalData.finance || 'Opportunities are coming your way.',
            tip: externalData.tip || 'Follow your intuition.',
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'external_api'
        };

        // ──────────────────────────────────────────────────────
        // STEP 4: Store in DB and return
        // ──────────────────────────────────────────────────────
        try {
            await horoscopes.insertOne(horoscopeData);
            console.log(`[Horoscope] Stored new horoscope for ${sign} on ${today}`);
        } catch (dbError) {
            console.error("[Horoscope] Failed to store horoscope in DB:", dbError);
            // Still return the data even if saving fails
        }

        // Clean up old horoscopes (optional, but good practice)
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            await horoscopes.deleteMany({
                createdAt: { $lt: sevenDaysAgo }
            });
        } catch (cleanupError) {
            console.error("[Horoscope] Cleanup failed:", cleanupError);
        }

        return NextResponse.json({
            sign: horoscopeData.sign,
            date: horoscopeData.date,
            overall_score: horoscopeData.overall_score,
            mood: horoscopeData.mood,
            lucky_color: horoscopeData.lucky_color,
            lucky_number: horoscopeData.lucky_number,
            career: horoscopeData.career,
            love: horoscopeData.love,
            health: horoscopeData.health,
            finance: horoscopeData.finance,
            tip: horoscopeData.tip
        });

    } catch (error) {
        console.error("Daily horoscope error:", error);
        return NextResponse.json({ 
            error: "Failed to retrieve daily horoscope." 
        }, { status: 500 });
    }
}

