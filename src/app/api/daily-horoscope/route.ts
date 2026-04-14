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

        console.log(`Fetching horoscope for ${user.moonSign} on ${today}`);

        // ALWAYS fetch fresh data from Cloudflare
        let externalData = null;
        if (process.env.AI_BACKEND_URL) {
            try {
                const externalApiUrl = `${process.env.AI_BACKEND_URL}/api/daily-horoscope?sign=${encodeURIComponent(user.moonSign)}`;
                console.log(`Calling external API: ${externalApiUrl}`);
                const response = await fetch(externalApiUrl, { 
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(5000)
                });
                
                if (response.ok) {
                    externalData = await response.json();
                    console.log('Successfully fetched from external API:', externalData);
                }
            } catch (error) {
                console.warn("External API unavailable:", error);
            }
        }

        // Generate fallback data
        const generateRandomScore = () => Math.floor(Math.random() * 40) + 50;
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
            overall_score: externalData?.overall_score || generateRandomScore(),
            mood: externalData?.mood || moods[Math.floor(Math.random() * moods.length)],
            lucky_color: externalData?.lucky_color || colors[Math.floor(Math.random() * colors.length)],
            lucky_number: externalData?.lucky_number || numbers[Math.floor(Math.random() * numbers.length)],
            career: externalData?.career || careerMessages[Math.floor(Math.random() * careerMessages.length)],
            love: externalData?.love || loveMessages[Math.floor(Math.random() * loveMessages.length)],
            health: externalData?.health || healthMessages[Math.floor(Math.random() * healthMessages.length)],
            finance: externalData?.finance || financeMessages[Math.floor(Math.random() * financeMessages.length)],
            tip: externalData?.tip || tips[Math.floor(Math.random() * tips.length)],
            updatedAt: new Date(),
            source: externalData ? 'external_api' : 'generated'
        };

        // ALWAYS update the database with fresh data
        await horoscopes.updateOne(
            { sign: user.moonSign, date: today },
            { 
                $set: horoscopeData,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );
        
        console.log(`Updated database for ${user.moonSign} on ${today}`);

        const horoscope = horoscopeData;

        // Clean up old horoscopes (older than 7 days) to keep database clean
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        await horoscopes.deleteMany({
            createdAt: { $lt: sevenDaysAgo }
        });

        return NextResponse.json({
            sign: horoscope.sign,
            date: horoscope.date,
            overall_score: horoscope.overall_score,
            mood: horoscope.mood,
            lucky_color: horoscope.lucky_color,
            lucky_number: horoscope.lucky_number,
            career: horoscope.career,
            love: horoscope.love,
            health: horoscope.health,
            finance: horoscope.finance,
            tip: horoscope.tip
        });

    } catch (error) {
        console.error("Daily horoscope error:", error);
        return NextResponse.json({ 
            error: "Failed to retrieve daily horoscope." 
        }, { status: 500 });
    }
}
