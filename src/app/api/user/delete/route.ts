import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { deleteUserWithCascade } from '@/lib/userDeletion';

/**
 * DELETE /api/user/delete
 * Deletes user and all associated data with analytics preservation
 * 
 * Body: { email: string }
 * 
 * This endpoint:
 * 1. Preserves chat analytics (ratings/feedback) - NO message content
 * 2. Deletes all user's chats
 * 3. Deletes the user account
 * 
 * Privacy-first: Message content is deleted, only ratings/feedback preserved
 */
export async function DELETE(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('astra-navi-database');

    // Perform cascade deletion with analytics preservation
    const result = await deleteUserWithCascade(db, email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete user' },
        { status: result.error === 'User not found' ? 404 : 500 }
      );
    }

    return NextResponse.json({
      message: 'User and associated data deleted successfully',
      deletedUser: result.deletedUser,
      chatsDeleted: result.chatsDeleted,
      analyticsPreserved: result.analyticsPreserved,
      privacyNote: 'Message content deleted, only ratings/feedback preserved for service improvement',
    });
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
