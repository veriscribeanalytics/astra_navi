import { useState, useEffect, useCallback } from 'react';
import { clientFetch } from '@/lib/apiClient';

export interface ChatSummaryData {
  summary: string;
  messageCount: number;
  topicsDiscussed: string[];
}

export function useChatSummary(chatId: string | null) {
  const [data, setData] = useState<ChatSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!chatId) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await clientFetch(`/api/chats/${chatId}/summary`);
      if (!res.ok) throw new Error('Failed to load chat summary');
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load chat summary';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { data, isLoading, error, refetch: fetchSummary };
}