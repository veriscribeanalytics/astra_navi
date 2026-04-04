import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET /api/chat?email=user@example.com — List all chats for a user
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('astra-navi-database');
    const chats = db.collection('chats');

    const userChats = await chats
      .find({ userEmail: email })
      .project({ title: 1, createdAt: 1, updatedAt: 1, averageRating: 1 })
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({ chats: userChats });
  } catch (error) {
    console.error('Chat list error:', error);
    return NextResponse.json({ error: 'Failed to load chats' }, { status: 500 });
  }
}

// POST /api/chat — Create a new chat
export async function POST(req: NextRequest) {
  try {
    const { email, title } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('astra-navi-database');
    const chats = db.collection('chats');

    // Get user profile for system message
    const users = db.collection('users');
    const user = await users.findOne({ email });

    const now = new Date();

    const systemMessage = {
      id: crypto.randomUUID(),
      type: 'system',
      text: `Session started · Reading your chart${user?.dob ? ` · DOB: ${user.dob}` : ''}`,
      createdAt: now,
    };

    const welcomeMessage = {
      id: crypto.randomUUID(),
      type: 'ai',
      text: `Namaste${user?.name ? ` ${user.name}` : ''} ✦ I'm Navi, your AI Vedic astrologer. Ask me anything about your chart, transits, career, relationships, or timing of events. I'll give you insights specific to your placements — not generic predictions.`,
      rating: null,
      createdAt: now,
    };

    const newChat = {
      userEmail: email,
      title: title || 'New conversation',
      messages: [systemMessage, welcomeMessage],
      averageRating: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await chats.insertOne(newChat);

    return NextResponse.json({
      chat: { ...newChat, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Create chat error:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
