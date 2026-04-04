import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// POST /api/chat/[chatId]/message — Send a message and get a placeholder AI response
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const { text } = await req.json();

    if (!ObjectId.isValid(chatId)) {
      return NextResponse.json({ error: 'Invalid chat ID' }, { status: 400 });
    }
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('astra-navi-database');
    const chats = db.collection('chats');

    const now = new Date();

    const userMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      text: text.trim(),
      createdAt: now,
    };

    // Placeholder AI response since bot isn't connected yet
    const aiResponse = {
      id: crypto.randomUUID(),
      type: 'ai',
      text: `Thank you for asking about "<strong>${text.trim().substring(0, 80)}</strong>". I'm currently being connected to the Vedic astrology engine. Once fully connected, I'll provide detailed insights based on your birth chart, planetary transits, and dasha periods.<br/><br/>In the meantime, feel free to continue asking questions — they'll all be saved in your chat history. ✦`,
      rating: null,
      createdAt: now,
    };

    // Auto-title from first user message
    const chat = await chats.findOne({ _id: new ObjectId(chatId) });
    const hasUserMessage = chat?.messages?.some((m: { type: string }) => m.type === 'user');

    const updateOps: Record<string, unknown> = {
      $push: { messages: { $each: [userMessage, aiResponse] } } as unknown,
      $set: { updatedAt: now } as unknown,
    };

    if (!hasUserMessage) {
      (updateOps.$set as Record<string, unknown>).title = text.trim().substring(0, 60);
    }

    await chats.updateOne(
      { _id: new ObjectId(chatId) },
      updateOps
    );

    // Simulated DB/AI processing delay (3.5 seconds)
    // Ensures the frontend 3-step animation ('Reading', 'Analyzing', 'Typing') completes smoothly.
    await new Promise((resolve) => setTimeout(resolve, 3500));

    return NextResponse.json({ userMessage, aiResponse });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
