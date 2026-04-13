import { Db, ObjectId } from 'mongodb';

/**
 * Chat Analytics System
 * Preserves ratings and feedback even after chats are deleted
 * Respects privacy by NOT storing message content
 */

export interface ChatAnalytics {
  _id?: ObjectId;
  userEmail: string;
  chatId: string; // Original chat ID (for reference)
  chatTitle: string;
  totalMessages: number;
  aiMessages: number;
  userMessages: number;
  averageRating: number | null;
  ratingsCount: number;
  feedbackTags: string[]; // Aggregated feedback tags
  feedbackComments: string[]; // Anonymized feedback comments
  createdAt: string;
  deletedAt: string; // When the chat was deleted
  preservedAt: string; // When analytics were preserved
}

/**
 * Preserve chat analytics before deletion
 * Extracts ratings and feedback WITHOUT message content
 */
export async function preserveChatAnalytics(
  db: Db,
  chatId: string
): Promise<void> {
  try {
    const chats = db.collection('chats');
    const analytics = db.collection('chat_analytics');

    // Get the chat
    const chat = await chats.findOne({ _id: new ObjectId(chatId) });
    if (!chat) {
      console.warn(`Chat ${chatId} not found for analytics preservation`);
      return;
    }

    // Extract analytics data (NO message content)
    const messages = chat.messages || [];
    const aiMessages = messages.filter((m: any) => m.type === 'ai');
    const userMessages = messages.filter((m: any) => m.type === 'user');
    
    // Get all ratings and feedback
    const ratedMessages = aiMessages.filter((m: any) => m.rating != null);
    const ratingsCount = ratedMessages.length;
    
    let averageRating: number | null = null;
    if (ratingsCount > 0) {
      const sum = ratedMessages.reduce((acc: number, m: any) => acc + m.rating, 0);
      averageRating = parseFloat((sum / ratingsCount).toFixed(1));
    }

    // Aggregate feedback tags (deduplicated)
    const allFeedbackTags: string[] = ratedMessages
      .flatMap((m: any) => m.feedbackTags || [])
      .filter((tag: string) => tag && tag.trim());
    const uniqueFeedbackTags: string[] = [...new Set(allFeedbackTags)];

    // Collect feedback comments (anonymized - no user identification)
    const feedbackComments = ratedMessages
      .map((m: any) => m.feedbackComment)
      .filter((comment: string) => comment && comment.trim());

    const now = new Date().toISOString();

    const analyticsDoc: ChatAnalytics = {
      userEmail: chat.userEmail,
      chatId: chatId,
      chatTitle: chat.title || 'Untitled Chat',
      totalMessages: messages.length,
      aiMessages: aiMessages.length,
      userMessages: userMessages.length,
      averageRating,
      ratingsCount,
      feedbackTags: uniqueFeedbackTags,
      feedbackComments,
      createdAt: chat.createdAt,
      deletedAt: now,
      preservedAt: now,
    };

    // Store analytics
    await analytics.insertOne(analyticsDoc);
    
    console.log(`✅ Analytics preserved for chat ${chatId}`);
  } catch (error) {
    console.error(`❌ Failed to preserve analytics for chat ${chatId}:`, error);
    // Don't throw - analytics preservation shouldn't block deletion
  }
}

/**
 * Preserve analytics for multiple chats (bulk operation)
 */
export async function preserveMultipleChatAnalytics(
  db: Db,
  chatIds: string[]
): Promise<void> {
  console.log(`📊 Preserving analytics for ${chatIds.length} chats...`);
  
  for (const chatId of chatIds) {
    await preserveChatAnalytics(db, chatId);
  }
  
  console.log(`✅ Analytics preservation complete`);
}

/**
 * Get user's analytics summary
 */
export async function getUserAnalyticsSummary(
  db: Db,
  userEmail: string
): Promise<{
  totalChatsDeleted: number;
  totalRatings: number;
  overallAverageRating: number | null;
  commonFeedbackTags: { tag: string; count: number }[];
}> {
  const analytics = db.collection('chat_analytics');

  const userAnalytics = await analytics
    .find({ userEmail })
    .toArray();

  const totalChatsDeleted = userAnalytics.length;
  const totalRatings = userAnalytics.reduce((sum, a: any) => sum + (a.ratingsCount || 0), 0);

  // Calculate overall average rating
  let overallAverageRating: number | null = null;
  const chatsWithRatings = userAnalytics.filter((a: any) => a.averageRating != null);
  if (chatsWithRatings.length > 0) {
    const sum = chatsWithRatings.reduce((acc, a: any) => acc + a.averageRating, 0);
    overallAverageRating = parseFloat((sum / chatsWithRatings.length).toFixed(1));
  }

  // Aggregate feedback tags
  const tagCounts: Record<string, number> = {};
  userAnalytics.forEach((a: any) => {
    (a.feedbackTags || []).forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const commonFeedbackTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 tags

  return {
    totalChatsDeleted,
    totalRatings,
    overallAverageRating,
    commonFeedbackTags,
  };
}
