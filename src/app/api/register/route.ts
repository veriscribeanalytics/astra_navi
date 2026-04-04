import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { email, password, name, dob, tob, pob } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required celestial inputs." }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("astra-navi-database");
        const users = db.collection("users");

        // Check if user already exists
        const existingUser = await users.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: "This celestial identity already exists in our records." }, { status: 400 });
        }

        // Hash the password securely
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create the user document with full celestial profile
        const newUser = {
            email,
            password: hashedPassword,
            name: name || undefined,
            dob: dob || undefined,
            tob: tob || undefined,
            pob: pob || undefined,
            createdAt: new Date(),
            preferences: {
                horoscope: true,
                notifications: false
            }
        };

        const result = await users.insertOne(newUser);

        // Return user data (without password)
        return NextResponse.json({ 
            message: "Welcome to AstraNavi, Seeker!", 
            user: {
                email: newUser.email,
                name: newUser.name,
                dob: newUser.dob,
                tob: newUser.tob,
                pob: newUser.pob
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Database connection error:", error);
        return NextResponse.json({ error: "The stars are currently obscured. Try again later." }, { status: 500 });
    }
}
