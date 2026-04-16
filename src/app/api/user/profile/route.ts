import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentDateTime } from '@/lib/datetime';
import { extractRashiSigns } from '@/utils/chartParser';

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

        const user = await users.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        // ONE-TIME EXTRACTION: If user has chartContext but no sun/moon sign, extract it so it's ready forever
        const chartContext = user.chartContext || user.preferences?.chartContext;
        if (chartContext && (!user.moonSign || !user.sunSign)) {
            const { sunSign, moonSign } = extractRashiSigns(chartContext);
            const updates: any = {};
            
            if (sunSign && !user.sunSign) {
                user.sunSign = sunSign.charAt(0).toUpperCase() + sunSign.slice(1).toLowerCase();
                updates.sunSign = user.sunSign;
            }
            if (moonSign && !user.moonSign) {
                user.moonSign = moonSign.charAt(0).toUpperCase() + moonSign.slice(1).toLowerCase();
                updates.moonSign = user.moonSign;
            }
            
            if (Object.keys(updates).length > 0) {
                updates.updatedAt = getCurrentDateTime();
                await users.updateOne({ email }, { $set: updates });
                console.log(`One-time auto-extracted signs for ${email}: Moon=${user.moonSign}, Sun=${user.sunSign}`);
            }
        }

        return NextResponse.json({
            user: {
                email: user.email,
                name: user.name,
                dob: user.dob,
                tob: user.tob,
                pob: user.pob,
                moonSign: user.moonSign,
                sunSign: user.sunSign,
                astrologyData: user.astrologyData
            }
        });
    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { email, name, dob, tob, pob } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required to identify your celestial path." }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("astra-navi-database");
        const users = db.collection("users");

        // Check if birth details changed (requires chart recomputation)
        const existingUser = await users.findOne({ email });
        const birthChanged = existingUser && (
            existingUser.dob !== dob ||
            existingUser.tob !== tob ||
            existingUser.pob !== pob
        );

        const updateFields: any = {
            name,
            dob,
            tob,
            pob,
            updatedAt: getCurrentDateTime()
        };

        // If birth details changed, invalidate chart + signs so they recompute on next chat
        if (birthChanged) {
            updateFields.chartContext = null;
            updateFields["preferences.chartContext"] = null;
            updateFields.moonSign = null;
            updateFields.sunSign = null;
        }

        // Update the user document
        const result = await users.updateOne(
            { email },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "No celestial identity found with this email." }, { status: 404 });
        }

        // Fetch and return updated user data
        const updatedUser = await users.findOne({ email });

        return NextResponse.json({ 
            message: "Profile successfully aligned with the stars!",
            user: {
                email: updatedUser?.email,
                name: updatedUser?.name,
                dob: updatedUser?.dob,
                tob: updatedUser?.tob,
                pob: updatedUser?.pob,
                moonSign: updatedUser?.moonSign,
                sunSign: updatedUser?.sunSign,
                astrologyData: updatedUser?.astrologyData
            }
        });

    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "The stars are obscured. Please try again later." }, { status: 500 });
    }
}
