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

        let externalData = null;
        if (process.env.AI_BACKEND_URL) {
            try {
                const externalApiUrl = `${process.env.AI_BACKEND_URL}/api/daily-horoscope?sign=${encodeURIComponent(user.moonSign)}`;
                const response = await fetch(externalApiUrl, { 
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(8000)
                });
                
                if (response.ok) {
                    externalData = await response.json();
                    console.log(`[Horoscope] External API returned data for ${user.moonSign}`);
                }
            } catch (error) {
                console.warn("[Horoscope] External API unavailable:", error);
            }
        }

        // ──────────────────────────────────────────────────────
        // STEP 3: Build horoscope data (external API data or deterministic fallback)
        // Using a seed based on sign + date so fallback is CONSISTENT for the day
        // ──────────────────────────────────────────────────────
        const seedHash = (str: string): number => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash |= 0; // Convert to 32-bit integer
            }
            return Math.abs(hash);
        };

        const seed = seedHash(`${user.moonSign}-${today}`);
        const pick = <T,>(arr: T[], offset: number = 0): T => arr[(seed + offset) % arr.length];

        const moods = ['Energetic', 'Balanced', 'Reflective', 'Optimistic', 'Focused', 'Calm'];
        const colors = ['Gold', 'Blue', 'Green', 'Purple', 'Red', 'Silver', 'Orange', 'Pink'];
        const numbers = [1, 3, 5, 7, 9, 11, 13, 21];
        
        const careerMessages = [
            'Focus on your tasks and stay productive.',
            'New opportunities may arise today.',
            'Collaboration brings success.',
            'Trust your professional instincts.',
            'A good day for important decisions.'
        ];
        
        const loveMessages = [
            'Communication is key in relationships today.',
            'Express your feelings openly.',
            'Quality time strengthens bonds.',
            'Listen to your heart.',
            'Romance is in the air.'
        ];
        
        const healthMessages = [
            'Maintain a balanced routine.',
            'Prioritize rest and recovery.',
            'Physical activity boosts energy.',
            'Stay hydrated and mindful.',
            'Listen to your body\'s needs.'
        ];
        
        const financeMessages = [
            'Be mindful of your spending.',
            'Good day for financial planning.',
            'Avoid impulsive purchases.',
            'Opportunities for growth.',
            'Review your budget carefully.'
        ];
        
        const tips = [
            'Trust your intuition.',
            'Stay positive and focused.',
            'Embrace new opportunities.',
            'Balance is the key to success.',
            'Your patience will be rewarded.',
            'Follow your inner wisdom.',
            'Small steps lead to big changes.'
        ];

        const horoscopeData = {
            sign: user.moonSign,
            date: today,
            overall_score: externalData?.overall_score || (seed % 40) + 50,
            mood: externalData?.mood || pick(moods, 0),
            lucky_color: externalData?.lucky_color || pick(colors, 1),
            lucky_number: externalData?.lucky_number || pick(numbers, 2),
            career: externalData?.career || pick(careerMessages, 3),
            love: externalData?.love || pick(loveMessages, 4),
            health: externalData?.health || pick(healthMessages, 5),
            finance: externalData?.finance || pick(financeMessages, 6),
            tip: externalData?.tip || pick(tips, 7),
            createdAt: new Date(),
            updatedAt: new Date(),
            source: externalData ? 'external_api' : 'generated'
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
