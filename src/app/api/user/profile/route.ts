import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { email, name, dob, tob, pob } = body;

        console.log('--- PROFILE API DEBUG ---');
        console.log('Request Body:', body);

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
                    updatedAt: new Date() 
                } 
            }
        );

        console.log('Update Result:', {
            matched: result.matchedCount,
            modified: result.modifiedCount,
            upserted: result.upsertedId
        });

        if (result.matchedCount === 0) {
            console.log('NO RECORD FOUND for email:', email);
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
