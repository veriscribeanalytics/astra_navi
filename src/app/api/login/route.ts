import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required credentials." }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("astra-navi-database");
        const users = db.collection("users");

        // Find the user by email
        const user = await users.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: "These celestial credentials do not align." }, { status: 404 });
        }

        // Compare the passwords securely
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json({ error: "These celestial credentials do not align." }, { status: 401 });
        }

        // For now: Just return the user ID and success
        // In the future: Add JWT token generation here
        return NextResponse.json({ 
            message: "Credentials aligned. Welcome, Seeker!", 
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                dob: user.dob,
                tob: user.tob,
                pob: user.pob
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Login database error:", error);
        return NextResponse.json({ error: "The stars are currently obscured. Try again later." }, { status: 500 });
    }
}
