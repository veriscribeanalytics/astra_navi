import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// PUT /api/chat/[chatId]/rate — Rate a specific AI message
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const { messageId, rating } = await req.json();

    if (!ObjectId.isValid(chatId)) {
      return NextResponse.json({ error: 'Invalid chat ID' }, { status: 400 });
    }
    if (!messageId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Valid messageId and rating (1-5) required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('astra-navi-database');
    const chats = db.collection('chats');

    // Update the specific message's rating
    await chats.updateOne(
      { _id: new ObjectId(chatId), 'messages.id': messageId },
      { $set: { 'messages.$.rating': rating } }
    );

    // Recalculate average rating for the chat
    const chat = await chats.findOne({ _id: new ObjectId(chatId) });
    let averageRating: number | null = null;

    if (chat) {
      const ratedMessages = chat.messages.filter(
        (m: { type: string; rating?: number | null }) => m.type === 'ai' && m.rating != null
      );
      if (ratedMessages.length > 0) {
        const sum = ratedMessages.reduce((acc: number, m: { rating: number }) => acc + m.rating, 0);
        averageRating = parseFloat((sum / ratedMessages.length).toFixed(1));
      }

      await chats.updateOne(
        { _id: new ObjectId(chatId) },
        { $set: { averageRating } }
      );
    }

    return NextResponse.json({ rating, averageRating });
  } catch (error) {
    console.error('Rate message error:', error);
    return NextResponse.json({ error: 'Failed to rate message' }, { status: 500 });
  }
}
