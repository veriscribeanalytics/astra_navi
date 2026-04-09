import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { getCurrentDateTime } from '@/lib/datetime';
import { authRateLimiter } from '@/middleware/rateLimit';

export async function POST(req: Request) {
    try {
        const { email, password, name, dob, tob, pob, phoneNumber } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required celestial inputs." }, { status: 400 });
        }

        // Rate limiting: 5 attempts per 15 minutes per IP
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const rateLimitResult = authRateLimiter(`register:${ip}`);
        
        if (!rateLimitResult.allowed) {
            const resetInMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
            return NextResponse.json({ 
                error: `Too many registration attempts. Please try again in ${resetInMinutes} minutes.` 
            }, { status: 429 });
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
            phoneNumber: phoneNumber || undefined,
            createdAt: getCurrentDateTime(),
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
                pob: newUser.pob,
                phoneNumber: newUser.phoneNumber
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Database connection error:", error);
        return NextResponse.json({ error: "The stars are currently obscured. Try again later." }, { status: 500 });
    }
}
