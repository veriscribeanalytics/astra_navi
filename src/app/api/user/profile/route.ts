import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

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

        // Update the user document with full profile details
        const result = await users.updateOne(
            { email },
            { 
                $set: { 
                    name, 
                    dob, 
                    tob, 
                    pob,
                    chartContext: null, // Reset to force recomputation on next message
                    updatedAt: new Date() 
                } 
            }
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
                pob: updatedUser?.pob
            }
        });

    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "The stars are obscured. Please try again later." }, { status: 500 });
    }
}
