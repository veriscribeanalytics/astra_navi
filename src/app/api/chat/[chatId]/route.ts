import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/chat/[chatId] — Get a single chat with all messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;

    if (!ObjectId.isValid(chatId)) {
      return NextResponse.json({ error: 'Invalid chat ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('astra-navi-database');
    const chats = db.collection('chats');

    const chat = await chats.findOne({ _id: new ObjectId(chatId) });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Get chat error:', error);
    return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 });
  }
}

// DELETE /api/chat/[chatId] — Delete a chat
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;

    if (!ObjectId.isValid(chatId)) {
      return NextResponse.json({ error: 'Invalid chat ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('astra-navi-database');
    const chats = db.collection('chats');

    const result = await chats.deleteOne({ _id: new ObjectId(chatId) });

    console.log(`Deletion requested for chat ${chatId}. Deleted count: ${result.deletedCount}`);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Chat not found in database' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Celestial record successfully cleared', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Delete chat error:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
