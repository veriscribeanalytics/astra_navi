import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

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
        const horoscopes = db.collection("daily_horoscopes_by_sign"); // OPTIMIZED: Sign-based collection

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

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // OPTIMIZED: Check if horoscope exists for this SIGN today (not per user)
        let horoscope = await horoscopes.findOne({
            sign: user.moonSign,
            date: today
        });

        // If no horoscope for this sign today, fetch from external API
        if (!horoscope) {
            // Call your external horoscope API
            const externalApiUrl = `${process.env.AI_BACKEND_URL}/api/daily-horoscope?sign=${user.moonSign}`;
            
            try {
                const response = await fetch(externalApiUrl);
                
                if (!response.ok) {
                    throw new Error('External API failed');
                }
                
                const data = await response.json();

                // OPTIMIZED: Store once per sign per day (not per user)
                horoscope = {
                    sign: user.moonSign,
                    date: today,
                    overall_score: data.overall_score || 50,
                    mood: data.mood || 'Balanced',
                    lucky_color: data.lucky_color || 'Gold',
                    lucky_number: data.lucky_number || 7,
                    career: data.career || 'Focus on your goals today.',
                    love: data.love || 'Good day for relationships.',
                    health: data.health || 'Take care of your wellbeing.',
                    finance: data.finance || 'Be mindful of expenses.',
                    tip: data.tip || 'Stay positive and focused.',
                    createdAt: new Date() // For TTL index
                };

                await horoscopes.insertOne(horoscope);
            } catch (error) {
                console.error("Failed to fetch horoscope from external API:", error);
                
                // Fallback: Create a default horoscope
                horoscope = {
                    sign: user.moonSign,
                    date: today,
                    overall_score: 50,
                    mood: 'Balanced',
                    lucky_color: 'Gold',
                    lucky_number: 7,
                    career: 'Focus on your tasks and stay productive.',
                    love: 'Communication is key in relationships today.',
                    health: 'Maintain a balanced routine.',
                    finance: 'Be mindful of your spending.',
                    tip: 'Trust your intuition.',
                    createdAt: new Date()
                };

                await horoscopes.insertOne(horoscope);
            }
        }

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
