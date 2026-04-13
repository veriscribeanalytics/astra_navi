import { Db, ObjectId } from 'mongodb';
import { preserveMultipleChatAnalytics } from './chatAnalytics';

/**
 * User Deletion Service
 * Handles cascade deletion of user data with analytics preservation
 */

export interface UserDeletionResult {
  success: boolean;
  deletedUser: boolean;
  chatsDeleted: number;
  analyticsPreserved: number;
  error?: string;
}

/**
 * Delete user and all associated data
 * Preserves chat analytics (ratings/feedback) before deletion
 */
export async function deleteUserWithCascade(
  db: Db,
  userEmail: string
): Promise<UserDeletionResult> {
  try {
    console.log(`🗑️  Starting cascade deletion for user: ${userEmail}`);

    const users = db.collection('users');
    const chats = db.collection('chats');

    // Step 1: Check if user exists
    const user = await users.findOne({ email: userEmail });
    if (!user) {
      return {
        success: false,
        deletedUser: false,
        chatsDeleted: 0,
        analyticsPreserved: 0,
        error: 'User not found',
      };
    }

    // Step 2: Find all user's chats
    const userChats = await chats
      .find({ userEmail })
      .project({ _id: 1 })
      .toArray();

    const chatIds = userChats.map(chat => chat._id.toString());
    console.log(`📊 Found ${chatIds.length} chats to process`);

    // Step 3: Preserve analytics BEFORE deletion
    if (chatIds.length > 0) {
      await preserveMultipleChatAnalytics(db, chatIds);
    }

    // Step 4: Delete all user's chats
    const chatDeletionResult = await chats.deleteMany({ userEmail });
    console.log(`🗑️  Deleted ${chatDeletionResult.deletedCount} chats`);

    // Step 5: Delete the user
    const userDeletionResult = await users.deleteOne({ email: userEmail });
    console.log(`🗑️  Deleted user: ${userDeletionResult.deletedCount > 0}`);

    return {
      success: true,
      deletedUser: userDeletionResult.deletedCount > 0,
      chatsDeleted: chatDeletionResult.deletedCount,
      analyticsPreserved: chatIds.length,
    };
  } catch (error) {
    console.error('❌ User deletion failed:', error);
    return {
      success: false,
      deletedUser: false,
      chatsDeleted: 0,
      analyticsPreserved: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete user by MongoDB _id
 */
export async function deleteUserByIdWithCascade(
  db: Db,
  userId: string
): Promise<UserDeletionResult> {
  try {
    if (!ObjectId.isValid(userId)) {
      return {
        success: false,
        deletedUser: false,
        chatsDeleted: 0,
        analyticsPreserved: 0,
        error: 'Invalid user ID',
      };
    }

    const users = db.collection('users');
    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user || !user.email) {
      return {
        success: false,
        deletedUser: false,
        chatsDeleted: 0,
        analyticsPreserved: 0,
        error: 'User not found',
      };
    }

    return await deleteUserWithCascade(db, user.email);
  } catch (error) {
    console.error('❌ User deletion by ID failed:', error);
    return {
      success: false,
      deletedUser: false,
      chatsDeleted: 0,
      analyticsPreserved: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
