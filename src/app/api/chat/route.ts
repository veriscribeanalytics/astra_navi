import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { generateUUID } from '@/lib/uuid';

// GET /api/chat?email=user@example.com&limit=20&cursor=lastChatId — List chats for a user with pagination
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const cursor = req.nextUrl.searchParams.get('cursor');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('astra-navi-database');
    const chats = db.collection('chats');

    // Build query with cursor-based pagination
    const query: any = { userEmail: email };
    if (cursor) {
      query._id = { $lt: new ObjectId(cursor) };
    }

    const userChats = await chats
      .find(query)
      .project({ title: 1, createdAt: 1, updatedAt: 1, averageRating: 1 })
      .sort({ updatedAt: -1 })
      .limit(limit + 1) // Fetch one extra to check if there are more
      .toArray();

    const hasMore = userChats.length > limit;
    const chatsToReturn = hasMore ? userChats.slice(0, limit) : userChats;
    const nextCursor = hasMore ? chatsToReturn[chatsToReturn.length - 1]._id.toString() : null;

    return NextResponse.json({ 
      chats: chatsToReturn,
      hasMore,
      nextCursor
    });
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
      id: generateUUID(),
      type: 'system',
      text: `Session started · Reading your chart${user?.dob ? ` · DOB: ${user.dob}` : ''}`,
      createdAt: now,
    };

    const welcomeMessage = {
      id: generateUUID(),
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
