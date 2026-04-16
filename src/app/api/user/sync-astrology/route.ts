import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentDateTime } from '@/lib/datetime';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required." }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("astra-navi-database");
        const users = db.collection("users");

        const user = await users.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        const chartContext = user.chartContext;
        if (!chartContext) {
            return NextResponse.json({ error: "No chart data found. Please chat with Navi first or update your profile." }, { status: 400 });
        }

        // Call the Python backend to analyze the full chart
        const backendUrl = process.env.AI_BACKEND_URL || "http://localhost:5050";
        const response = await fetch(`${backendUrl}/api/analyze-full`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chart_context: chartContext }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to analyze chart via backend.");
        }

        const result = await response.json();
        const astrologyData = result.astrologyData;

        // Save the structured data back to MongoDB
        await users.updateOne(
            { email },
            { 
                $set: { 
                    astrologyData,
                    updatedAt: getCurrentDateTime() 
                } 
            }
        );

        return NextResponse.json({ 
            success: true, 
            message: "Your celestial data has been synchronized!",
            astrologyData
        });

    } catch (error: any) {
        console.error("Astrology sync error:", error);
        return NextResponse.json({ error: error.message || "Failed to synchronize celestial data." }, { status: 500 });
    }
}
