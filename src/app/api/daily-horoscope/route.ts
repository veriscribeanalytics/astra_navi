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

        if (!email) {
            return NextResponse.json({ error: "Email is required." }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("astra-navi-database");
        const users = db.collection("users");
        const horoscopes = db.collection("daily_horoscopes_by_sign");

        // Get user to find their moon sign
        const user = await users.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        if (!user.moonSign) {
            return NextResponse.json({ 
                error: "Moon sign not available. Please complete your profile first." 
            }, { status: 400 });
        }

        // Get today's date in consistent UTC format
        const today = getTodayDateString();

        // ──────────────────────────────────────────────────────
        // STEP 1: Check if today's horoscope already exists in DB
        // If it does, return it immediately — no external API call needed
        // ──────────────────────────────────────────────────────
        const existingHoroscope = await horoscopes.findOne({ 
            sign: user.moonSign, 
            date: today 
        });

        if (existingHoroscope) {
            console.log(`[Horoscope] Cache HIT for ${user.moonSign} on ${today}`);
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
        // STEP 2: No horoscope for today — fetch from external API (once per sign per day)
        // ──────────────────────────────────────────────────────
        console.log(`[Horoscope] Cache MISS for ${user.moonSign} on ${today}. Fetching from external API...`);

        if (!process.env.AI_BACKEND_URL) {
            console.error("[Horoscope] AI_BACKEND_URL not configured");
            return NextResponse.json({ 
                error: "Horoscope service is not configured. Please try again later." 
            }, { status: 503 });
        }

        let externalData = null;
        try {
            const externalApiUrl = `${process.env.AI_BACKEND_URL}/api/daily-horoscope?sign=${encodeURIComponent(user.moonSign)}`;
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
            console.log(`[Horoscope] External API returned data for ${user.moonSign}`);
        } catch (error) {
            console.error("[Horoscope] External API request failed:", error);
            return NextResponse.json({ 
                error: "Unable to fetch horoscope at this time. Please try again later." 
            }, { status: 503 });
        }

        // ──────────────────────────────────────────────────────
        // STEP 3: Validate and store horoscope data from external API
        // ──────────────────────────────────────────────────────
        if (!externalData || !externalData.overall_score) {
            console.error("[Horoscope] Invalid data received from external API");
            return NextResponse.json({ 
                error: "Invalid horoscope data received. Please try again later." 
            }, { status: 503 });
        }

        const horoscopeData = {
            sign: user.moonSign,
            date: today,
            overall_score: externalData.overall_score,
            mood: externalData.mood,
            lucky_color: externalData.lucky_color,
            lucky_number: externalData.lucky_number,
            career: externalData.career,
            love: externalData.love,
            health: externalData.health,
            finance: externalData.finance,
            tip: externalData.tip,
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'external_api'
        };

        // ──────────────────────────────────────────────────────
        // STEP 4: Store in DB so all subsequent requests today get instant cache hit
        // ──────────────────────────────────────────────────────
        await horoscopes.insertOne(horoscopeData);
        console.log(`[Horoscope] Stored new horoscope for ${user.moonSign} on ${today}`);

        // Clean up old horoscopes (older than 7 days) to keep database clean
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        await horoscopes.deleteMany({
            createdAt: { $lt: sevenDaysAgo }
        });

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
