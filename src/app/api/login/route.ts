import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { checkRateLimit, AUTH_LIMIT_CONFIG } from '@/middleware/rateLimit';
import { LoginSchema } from '@/lib/schemas';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = LoginSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
        }

        const { email, password } = validation.data;

        // Rate limiting: 5 attempts per 15 minutes per IP
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const rateLimitResult = await checkRateLimit(`login:${ip}`, AUTH_LIMIT_CONFIG);

        if (!rateLimitResult.allowed) {
            const resetInMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
            return NextResponse.json({ 
                error: `Too many login attempts. Please try again in ${resetInMinutes} minutes.` 
            }, { status: 429 });
        }

        const client = await clientPromise;
        const db = client.db("astra-navi-database");
        const users = db.collection("users");

        const user = await users.findOne({ email });

        if (!user || !user.password) {
            return NextResponse.json({ error: "No celestial identity found with these credentials." }, { status: 401 });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return NextResponse.json({ error: "Invalid celestial credentials." }, { status: 401 });
        }

        return NextResponse.json({
            message: "Welcome back, Seeker.",
            user: {
                email: user.email,
                name: user.name,
                dob: user.dob,
                tob: user.tob,
                pob: user.pob,
                moonSign: user.moonSign,
                sunSign: user.sunSign
            }
        });

    } catch (error) {
        console.error("Login database error:", error);
        return NextResponse.json({ error: "The stars are currently obscured. Try again later." }, { status: 500 });
    }
}
